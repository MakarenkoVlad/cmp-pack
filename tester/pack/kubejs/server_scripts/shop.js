// /shop: the only place coins go. Numismatics coins come from airdrops only (the airdrop mod puts them in the
// crates; numismatics.js takes away every recipe, bank and vendor), and the shop sells the items that are not in
// the crates any more for them. It never buys anything back: every coin it takes is destroyed.
//
//   /shop                     the shop screen (the cmpshop mod: tabs, search, prices, your coins, the treasury;
//                             its buttons run the commands below, so every rule here holds), else the list
//   /shop list                the price list in chat (click an item to fill in the buy command) and your coins
//   /shop buy <item> [bundles] that many of the item's bundle (default 1, no cap): froglights come 8 to a
//                             bundle, so /shop buy ochre_froglight 3 is 24 Ochre Froglight for 6 Cog
//   /shop change cog          1 Cog into 4 Sprockets, and /shop change sprocket the other way round
//   /shop treasury <n>        n Cog into your party's treasury; the first party to 160 Cog gets the dragon egg
//   /shop top                 the treasuries
//   /shop off, /shop on       ops only (permission level 2): close and open the shop, kept over restarts
//
// Payment comes from the 36 main inventory slots only (hotbar included; armour, offhand and Curios slots are
// never touched), in any coins by their value in spurs (Spur 1, Bevel 8, Sprocket 16, Cog 64, Crown 512,
// Sun 4096), and the change comes back in the largest coins first. Before anything is taken the script works
// out the whole inventory afterwards: the coins gone, the items and the change in. If that does not fit in the
// 36 slots, it refuses and nothing changes, so nothing ever drops on an island edge. The coins go and the
// items come in the same tick. Nobody can trade within 30 seconds of taking damage (any hit that goes
// through: mobs, falls and fire too), so the shop is no way out of a fight. Chat names the coins the same way
// everywhere, without a plural: "20 Cog", "4 Sprocket", "48 Spur".
//
// Kept in the server's KubeJS persistent data (world/kubejs_persistent_data.nbt, saved with the world) under
// cmp_shop: off (the ops' switch), treasury (per FTB Teams party id: name and Cog; a player without a party
// has an entry of their own under their personal team, which has the player's UUID) and egg (who got it). The
// world is saved right after the egg is handed out, so the egg and the flag that it is gone reach the disk
// together. Every buy logs "[shop] <player> <party> <item> x<bundles> <cog> cog", every swap
// "[shop] change <player> <party> cog->sprocket" (or sprocket->cog) and every deposit
// "[shop] treasury <player> <party> <cog>" ("-" for no party, spaces in names as _).
//
// Tripwire: the scoreboard objective cmp_coins (dummy) counts spurs. The airdrop mod (cmp-airdrop 2.12.0, which
// ships with this script) adds the spurs it puts into crates to #minted and takes off what is destroyed with
// unopened leftovers; the shop adds what it destroys to #spent (buys) and #treasury (deposits). More spent than
// minted means coins that never came from a crate, so a trade that would push #spent + #treasury over #minted
// is refused, the shop closes itself and logs "[shop] tripwire", and an op opens it again with /shop on. Coins
// from /give count as coins from nowhere too, so ops must not hand out coins on live (an op who has to adds
// the spurs to #minted: /scoreboard players add #minted cmp_coins <spurs>). CMP_SHOP_TRIPWIRE = false turns
// the check off; the shop counts #spent and #treasury either way. A trade worth no whole number of spurs above
// 0 (only a bug could make one) is refused without closing the shop.
//
// Rhino: a const inside a block (try, if, a loop) fails with "redeclaration of var" or keeps its first value,
// so everything below a function's top level is let.
const CMP_SHOP_TRIPWIRE = true
const CMP_SHOP_DATA = 'cmp_shop'
const CMP_SHOP_HURT = 'cmp_shop_hurt' // player persistent data: Date.now() of the last damage taken
const CMP_SHOP_HURT_WAIT = 30 * 1000
const CMP_SHOP_EGG_GOAL = 160 // Cog
const CMP_SHOP_COG = 64 // spurs in a Cog
const CMP_SHOP_SCORE = 'cmp_coins'
const CMP_SHOP_BAD_PRICE = "Something's wrong with that price, so nothing was taken. Tell an admin."
// The coins, largest first: [id, value in spurs, name]
const CMP_SHOP_COINS = [
    ['numismatics:sun', 4096, 'Sun'],
    ['numismatics:crown', 512, 'Crown'],
    ['numismatics:cog', 64, 'Cog'],
    ['numismatics:sprocket', 16, 'Sprocket'],
    ['numismatics:bevel', 8, 'Bevel'],
    ['numismatics:spur', 1, 'Spur'],
]

// The tabs of the /shop screen, in order: [id, name]. Every offer below names one of them.
const CMP_SHOP_CATEGORIES = [
    ['rare', 'Rare'],
    ['templates', 'Templates'],
    ['trims', 'Trims'],
    ['discs', 'Discs'],
    ['patterns', 'Patterns'],
    ['froglights', 'Froglights'],
]

// What the shop sells: [key, item, how many in one bundle, price of a bundle in Cog, tab]. Never sold: Ages fuel,
// diesel, crude oil and gasoline, cannon parts and ammo, netherite, nethersteel and ancient debris, elytras,
// totems, end crystals (end_crystals.js also takes away their recipe), beacons, spider eyes and villager eggs.
// The owner cut the list on 2026-10-19 to the crate items, trims, discs, banner patterns and froglights: no
// Nether and End materials, mob heads, spawn eggs, XP bottles, name tags or saddles; levitite sells next to
// pearlescent levitite at the same price.
// The seven rarest armour trim templates (8 Cog) only come from deep or far structures: silence and ward from
// ancient cities, eye from strongholds, vex from woodland mansions, spire from end cities, rib from nether
// fortresses and snout from bastions. The rest are 4 Cog, wayfinder (trail ruins) too. Trims only change how
// armour looks, so the vanilla recipes that copy a template stay.
const CMP_SHOP_OFFERS_ALL = [
    ['dragon_head', 'minecraft:dragon_head', 1, 60, 'rare'],
    ['netherite_template', 'minecraft:netherite_upgrade_smithing_template', 1, 32, 'templates'],
    ['blaze_template', 'create_dragons_plus:blaze_upgrade_smithing_template', 1, 32, 'templates'],
    ['god_apple', 'minecraft:enchanted_golden_apple', 1, 20, 'rare'],
    ['blaze_burner', 'create:blaze_burner', 1, 16, 'rare'], // the filled one (create:empty_blaze_burner is empty)
    ['pearlescent_levitite', 'aeronautics:pearlescent_levitite', 8, 12, 'rare'],
    ['levitite', 'aeronautics:levitite', 8, 12, 'rare'],
].concat(
    ['silence', 'ward', 'eye', 'vex', 'spire', 'rib', 'snout']
        .map(t => [t + '_trim', 'minecraft:' + t + '_armor_trim_smithing_template', 1, 8, 'trims']),
    ['wayfinder', 'sentry', 'dune', 'coast', 'wild', 'tide', 'shaper', 'raiser', 'host', 'flow', 'bolt']
        .map(t => [t + '_trim', 'minecraft:' + t + '_armor_trim_smithing_template', 1, 4, 'trims']),
    ['13', 'cat', 'blocks', 'chirp', 'far', 'mall', 'mellohi', 'stal', 'strad', 'ward', '11', 'wait', 'otherside',
        '5', 'pigstep', 'relic', 'creator', 'creator_music_box', 'precipice']
        .map(d => ['disc_' + d, 'minecraft:music_disc_' + d, 1, 2, 'discs']),
    ['flower', 'creeper', 'skull', 'mojang', 'globe', 'piglin', 'flow', 'guster']
        .map(p => [p + '_pattern', 'minecraft:' + p + '_banner_pattern', 1, 2, 'patterns']),
    ['ochre', 'verdant', 'pearlescent']
        .map(f => [f + '_froglight', 'minecraft:' + f + '_froglight', 8, 2, 'froglights'])
)

const $CmpShopStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const $CmpShopCompound = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $CmpShopRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $CmpShopId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $CmpShopUUID = Java.loadClass('java.util.UUID')
const $CmpShopComponent = Java.loadClass('net.minecraft.network.chat.Component')
const $CmpShopStyle = Java.loadClass('net.minecraft.network.chat.Style')
const $CmpShopFormatting = Java.loadClass('net.minecraft.ChatFormatting')
const $CmpShopClick = Java.loadClass('net.minecraft.network.chat.ClickEvent')
const $CmpShopClickAction = Java.loadClass('net.minecraft.network.chat.ClickEvent$Action')
const $CmpShopHover = Java.loadClass('net.minecraft.network.chat.HoverEvent')
const $CmpShopHoverAction = Java.loadClass('net.minecraft.network.chat.HoverEvent$Action')
const $CmpShopHoverItem = Java.loadClass('net.minecraft.network.chat.HoverEvent$ItemStackInfo')
const $CmpShopScoreHolder = Java.loadClass('net.minecraft.world.scores.ScoreHolder')
const $CmpShopServerPlayer = Java.loadClass('net.minecraft.server.level.ServerPlayer')
const $CmpShopPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $CmpShopTeams = Java.loadClass('dev.ftb.mods.ftbteams.api.FTBTeamsAPI')
const $CmpShopStringArg = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $CmpShopIntArg = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
// The /shop screen (the cmpshop mod, in the pack on both sides). Without it every player gets the chat list.
let $CmpShopNet = null
try {
    $CmpShopNet = Java.loadClass('dev.cmp.shop.ShopNet')
} catch (err) {
    console.warn('[shop] no shop screen, the cmpshop mod is not loaded: ' + err)
}

// The offers whose item is in the game, by key; an id that is not is left out and named in the log.
const CMP_SHOP_OFFERS = []
const CMP_SHOP_BY_KEY = {}
CMP_SHOP_OFFERS_ALL.forEach(entry => {
    if (!$CmpShopRegistries.ITEM.containsKey($CmpShopId.parse(entry[1]))) {
        console.warn('[shop] no such item, left out of the shop: ' + entry[1])
        return
    }
    let offer = { key: entry[0], id: entry[1], count: entry[2], price: entry[3], cat: entry[4] }
    CMP_SHOP_OFFERS.push(offer)
    CMP_SHOP_BY_KEY[offer.key] = offer
})
const CMP_SHOP_COIN_VALUE = {}
CMP_SHOP_COINS.forEach(coin => (CMP_SHOP_COIN_VALUE[coin[0]] = coin[1]))

// The offer with this key, or null. Only the shop's own keys count: "constructor" or "__proto__" would
// otherwise find what every JavaScript object has.
function cmpShopOffer(key) {
    return Object.prototype.hasOwnProperty.call(CMP_SHOP_BY_KEY, key) ? CMP_SHOP_BY_KEY[key] : null
}

// ---- stored state --------------------------------------------------------------------------------------

function cmpShopData(server) {
    const root = server.persistentData
    if (!root.contains(CMP_SHOP_DATA)) root.put(CMP_SHOP_DATA, new $CmpShopCompound())
    return root.getCompound(CMP_SHOP_DATA)
}

function cmpShopSub(tag, key) {
    if (!tag.contains(key)) tag.put(key, new $CmpShopCompound())
    return tag.getCompound(key)
}

function cmpShopOpen(server) {
    return !cmpShopData(server).getBoolean('off')
}

function cmpShopSetOpen(server, open) {
    cmpShopData(server).putBoolean('off', !open)
}

// The tripwire's scores, in spurs. The objective is made when it is missing.
function cmpShopObjective(server) {
    const board = server.getScoreboard()
    let objective = board.getObjective(CMP_SHOP_SCORE)
    if (objective == null) {
        server.runCommandSilent('scoreboard objectives add ' + CMP_SHOP_SCORE + ' dummy')
        objective = board.getObjective(CMP_SHOP_SCORE)
    }
    return objective
}

function cmpShopScore(server, holder) {
    const objective = cmpShopObjective(server)
    if (objective == null) return 0
    const info = server.getScoreboard().getPlayerScoreInfo($CmpShopScoreHolder.forNameOnly(holder), objective)
    return info == null ? 0 : info.value()
}

function cmpShopAddScore(server, holder, spurs) {
    const objective = cmpShopObjective(server)
    if (objective == null) {
        console.error('[shop] could not make the ' + CMP_SHOP_SCORE + ' objective; ' + holder + ' not counted: ' + spurs)
        return
    }
    server.getScoreboard().getOrCreatePlayerScore($CmpShopScoreHolder.forNameOnly(holder), objective).add(spurs)
}

// True for what a trade can take: a whole number of spurs above 0.
function cmpShopSpendable(spurs) {
    return typeof spurs == 'number' && isFinite(spurs) && spurs > 0 && Math.floor(spurs) == spurs
}

// Null when a trade of `spurs` may go ahead, or what to tell the player. One that is not cmpShopSpendable is
// refused and the shop stays open. With the tripwire on, one that would make the shop have destroyed more
// spurs than the airdrops minted closes the shop instead.
function cmpShopTripwire(server, player, spurs) {
    if (!cmpShopSpendable(spurs)) {
        console.error('[shop] refused a trade of ' + spurs + ' spurs from ' + cmpShopName(player))
        return CMP_SHOP_BAD_PRICE
    }
    if (!CMP_SHOP_TRIPWIRE) return null
    const minted = cmpShopScore(server, '#minted')
    const spent = cmpShopScore(server, '#spent')
    const treasury = cmpShopScore(server, '#treasury')
    if (spent + treasury + spurs <= minted) return null
    cmpShopSetOpen(server, false)
    console.warn('[shop] tripwire: ' + cmpShopName(player) + ' tried to spend ' + spurs + ' spurs with #spent ' + spent
        + ' + #treasury ' + treasury + ' already against #minted ' + minted + '; the shop is closed until an op runs /shop on')
    return 'The shop is closed right now.'
}

// ---- players, parties, damage --------------------------------------------------------------------------

function cmpShopName(player) {
    return String(player.getGameProfile().getName())
}

function cmpShopLogName(name) {
    return String(name).replace(/\s+/g, '_')
}

// The player's FTB Teams party, or the player's own team when they have none: {key, name, party}.
function cmpShopTeam(player) {
    try {
        let api = $CmpShopTeams.api()
        if (api.isManagerLoaded()) {
            let found = api.getManager().getTeamForPlayer(player)
            if (found.isPresent()) {
                let team = found.get()
                return { key: String(team.getId()), name: String(team.getName().getString()), party: !team.isPlayerTeam() }
            }
        }
    } catch (err) {
        console.error('[shop] FTB Teams lookup for ' + cmpShopName(player) + ' failed: ' + err)
    }
    return { key: String(player.getGameProfile().getId()), name: cmpShopName(player), party: false }
}

// The party as the log writes it: its name with _ for spaces, or - for no party.
function cmpShopLogParty(team) {
    return team.party ? cmpShopLogName(team.name) : '-'
}

// Milliseconds until the player may trade again (0 or less: now).
function cmpShopHurtWait(player) {
    const data = player.persistentData
    const now = Date.now()
    // A time in the future means the server clock was set back: count it from now.
    if (data.getLong(CMP_SHOP_HURT) > now) data.putLong(CMP_SHOP_HURT, now)
    return data.getLong(CMP_SHOP_HURT) + CMP_SHOP_HURT_WAIT - now
}

// Every hit that goes through (LOWEST, so a hit that claims, grace or anything else cancelled does not count;
// shields and absorption hearts still count, the hit landed). An error thrown here is not caught by KubeJS.
NativeEvents.onEvent($CmpShopPriority.LOWEST, 'net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
        let entity = event.getEntity()
        if (entity instanceof $CmpShopServerPlayer && event.getAmount() > 0) entity.persistentData.putLong(CMP_SHOP_HURT, Date.now())
    } catch (err) {
        console.error('[shop] damage time: ' + err)
    }
})

// ---- coins and the inventory ---------------------------------------------------------------------------

function cmpShopStackId(stack) {
    return String(stack.getItem().builtInRegistryHolder().key().location())
}

// The coins in the 36 main slots: {total spurs, counts by coin id}.
function cmpShopWallet(player) {
    const inv = player.getInventory()
    const counts = {}
    let total = 0
    for (let i = 0; i < 36; i++) {
        let stack = inv.getItem(i)
        if (stack.isEmpty()) continue
        let id = cmpShopStackId(stack)
        let value = CMP_SHOP_COIN_VALUE[id]
        if (!value) continue
        counts[id] = (counts[id] || 0) + stack.getCount()
        total += value * stack.getCount()
    }
    return { total: total, counts: counts }
}

// Which coins pay `price` spurs, as little over it as these coins allow: the largest coins that fit under the
// price first, then, if that leaves a rest, one more of the smallest coin left over (it is worth more than the
// rest), and the smaller coins that extra coin makes unneeded go back. Null when the coins are not enough.
function cmpShopPick(counts, price) {
    const take = {}
    let left = price
    CMP_SHOP_COINS.forEach(coin => {
        let n = Math.min(counts[coin[0]] || 0, Math.floor(left / coin[1]))
        take[coin[0]] = n
        left -= n * coin[1]
    })
    let over = 0
    if (left > 0) {
        let extra = null
        for (let i = CMP_SHOP_COINS.length - 1; i >= 0 && extra == null; i--) {
            let coin = CMP_SHOP_COINS[i]
            if ((counts[coin[0]] || 0) > take[coin[0]] && coin[1] >= left) extra = coin
        }
        if (extra == null) return null
        take[extra[0]]++
        over = extra[1] - left
        CMP_SHOP_COINS.forEach(coin => {
            if (coin[1] >= extra[1]) return
            let back = Math.min(take[coin[0]], Math.floor(over / coin[1]))
            take[coin[0]] -= back
            over -= back * coin[1]
        })
    }
    return { take: take, change: over }
}

// Spurs as coins, the largest first: [[id, n], ...]
function cmpShopCoinsFor(spurs) {
    const coins = []
    let left = spurs
    CMP_SHOP_COINS.forEach(coin => {
        let n = Math.floor(left / coin[1])
        if (n > 0) coins.push([coin[0], n])
        left -= n * coin[1]
    })
    return coins
}

// The 36 main slots after taking `take` ({coin id: n}, from the smallest stacks first, so slots come free)
// and adding `gives` ([[item id, count], ...]: first onto stacks of the same item, then into empty slots).
// Null when it does not fit. Nothing in the inventory changes here.
function cmpShopPlan(player, take, gives) {
    const inv = player.getInventory()
    const slots = []
    for (let i = 0; i < 36; i++) slots.push(inv.getItem(i).copy())
    const ids = Object.keys(take)
    for (let k = 0; k < ids.length; k++) {
        let id = ids[k]
        let left = take[id]
        if (left <= 0) continue
        let from = []
        for (let i = 0; i < 36; i++) if (!slots[i].isEmpty() && cmpShopStackId(slots[i]) == id) from.push(i)
        from.sort((a, b) => slots[a].getCount() - slots[b].getCount())
        for (let f = 0; f < from.length && left > 0; f++) {
            let n = Math.min(left, slots[from[f]].getCount())
            slots[from[f]].shrink(n)
            left -= n
        }
        if (left > 0) return null // cannot happen: the coins were counted in these slots
    }
    for (let g = 0; g < gives.length; g++) {
        let sample = Item.of(gives[g][0], 1)
        let max = sample.getMaxStackSize()
        let left = gives[g][1]
        for (let i = 0; i < 36 && left > 0; i++) {
            let slot = slots[i]
            if (slot.isEmpty() || !$CmpShopStack.isSameItemSameComponents(slot, sample)) continue
            let n = Math.min(left, slot.getMaxStackSize() - slot.getCount())
            if (n > 0) {
                slot.grow(n)
                left -= n
            }
        }
        for (let i = 0; i < 36 && left > 0; i++) {
            if (!slots[i].isEmpty()) continue
            let n = Math.min(left, max)
            slots[i] = sample.copyWithCount(n)
            left -= n
        }
        if (left > 0) return null
    }
    return slots
}

// Puts a plan into the inventory, slot by slot (only the slots that differ).
function cmpShopApply(player, slots) {
    const inv = player.getInventory()
    for (let i = 0; i < 36; i++) {
        if (!$CmpShopStack.matches(inv.getItem(i), slots[i])) inv.setItem(i, slots[i])
    }
    inv.setChanged()
}

// ---- text ----------------------------------------------------------------------------------------------

// Spurs in Cog and the Spur left over: "45 Cog and 48 Spur".
function cmpShopCog(spurs) {
    const cog = Math.floor(spurs / CMP_SHOP_COG)
    const rest = spurs - cog * CMP_SHOP_COG
    if (rest == 0) return cog + ' Cog'
    return cog + ' Cog and ' + rest + ' Spur'
}

// [[id, n], ...] as "7 Crown and 6 Cog".
function cmpShopCoinWords(coins) {
    const words = coins.map(c => c[1] + ' ' + CMP_SHOP_COINS.filter(x => x[0] == c[0])[0][2])
    if (words.length <= 1) return words.join('')
    return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1]
}

// "Iron Peaks'" and "GearMate's".
function cmpShopOf(name) {
    return /s$/i.test(name) ? name + "'" : name + "'s"
}

// What a buy message calls an offer's item: its name in the game, or its shop key in words where several
// offers have the same name (every smithing template is a "Smithing Template", every disc a "Music Disc") or the
// name did not translate. Worked out on the first buy, when every mod's names are loaded.
const CMP_SHOP_ITEM_NAMES = {}
function cmpShopItemName(offer) {
    if (!Object.prototype.hasOwnProperty.call(CMP_SHOP_ITEM_NAMES, offer.key)) {
        let uses = {}
        CMP_SHOP_OFFERS.forEach(o => {
            let name = String(Item.of(o.id, 1).getHoverName().getString())
            CMP_SHOP_ITEM_NAMES[o.key] = name
            uses[name] = (Object.prototype.hasOwnProperty.call(uses, name) ? uses[name] : 0) + 1
        })
        CMP_SHOP_OFFERS.forEach(o => {
            let name = CMP_SHOP_ITEM_NAMES[o.key]
            if (uses[name] > 1 || (name.indexOf(' ') < 0 && name.indexOf('.') >= 0)) {
                CMP_SHOP_ITEM_NAMES[o.key] = o.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            }
        })
    }
    return CMP_SHOP_ITEM_NAMES[offer.key]
}

// KubeJS adds sendSuccess(Component, boolean) to the command source; Rhino would turn a supplier function into the
// text of a Component, so the Component goes in as it is.
// Both also keep what they said last, for the /shop screen (cmpShopAct), where chat is hidden behind it.
let CMP_SHOP_LAST = null
function cmpShopSay(source, text) {
    let component = typeof text == 'string' ? Text.of(text) : text
    CMP_SHOP_LAST = { ok: true, text: String(component.getString()) }
    source.sendSuccess(component, false)
}

function cmpShopFail(source, text) {
    CMP_SHOP_LAST = { ok: false, text: String(text) }
    source.sendFailure(Text.of(text))
    return 0
}

// A shop entry in the list: the key (with the bundle size), which puts the buy command in chat when clicked
// and shows the item when hovered.
function cmpShopEntry(offer) {
    const style = $CmpShopStyle.EMPTY
        .applyFormat($CmpShopFormatting.AQUA) // withColor has overloads Rhino cannot choose between
        .withClickEvent(new $CmpShopClick($CmpShopClickAction.SUGGEST_COMMAND, '/shop buy ' + offer.key + ' '))
        .withHoverEvent(new $CmpShopHover($CmpShopHoverAction.SHOW_ITEM, new $CmpShopHoverItem(Item.of(offer.id, offer.count))))
    return $CmpShopComponent.literal(offer.count > 1 ? offer.key + ' x' + offer.count : offer.key).setStyle(style)
}

// ---- the subcommands -----------------------------------------------------------------------------------

// The player who runs a trade, or null after telling why they cannot trade now.
function cmpShopTrader(source) {
    const player = source.getPlayer()
    if (player == null) {
        cmpShopFail(source, 'Only players can trade in the shop.')
        return null
    }
    if (!cmpShopOpen(source.getServer())) {
        cmpShopFail(source, 'The shop is closed right now.')
        return null
    }
    if (!player.isAlive()) return null
    const wait = cmpShopHurtWait(player)
    if (wait > 0) {
        cmpShopFail(source, 'You took damage in the last 30 seconds. Try again in ' + Math.ceil(wait / 1000) + 's.')
        return null
    }
    return player
}

function cmpShopList(source) {
    const server = source.getServer()
    if (!cmpShopOpen(server)) cmpShopSay(source, Text.red('The shop is closed right now.'))
    cmpShopSay(source, Text.gold('Prices are in Cog per bundle, and ochre_froglight x8 means 8 to a bundle. Click an item to put its /shop buy command in chat.'))
    const prices = []
    CMP_SHOP_OFFERS.forEach(offer => {
        if (prices.indexOf(offer.price) < 0) prices.push(offer.price)
    })
    prices.sort((a, b) => b - a)
    prices.forEach(price => {
        // at most 12 to a line, the lines of one price about as long as each other
        let offers = CMP_SHOP_OFFERS.filter(offer => offer.price == price)
        let size = Math.ceil(offers.length / Math.ceil(offers.length / 12))
        for (let start = 0; start < offers.length; start += size) {
            let line = Text.of(price + ' Cog: ').gold()
            let part = offers.slice(start, start + size)
            for (let i = 0; i < part.length; i++) {
                if (i > 0) line.append(Text.of(', ').gray())
                line.append(cmpShopEntry(part[i]))
            }
            cmpShopSay(source, line)
        }
    })
    cmpShopSay(source, Text.gray('/shop buy <item> [bundles], /shop change cog or sprocket, /shop treasury <cog>, /shop top, /shop list'))
    const player = source.getPlayer()
    if (player != null) cmpShopSay(source, Text.yellow('You have ' + cmpShopCog(cmpShopWallet(player).total) + ' in your inventory.'))
    return 1
}

function cmpShopBuy(source, key, bundles) {
    const player = cmpShopTrader(source)
    if (player == null) return 0
    const offer = cmpShopOffer(key)
    if (offer == null) return cmpShopFail(source, 'The shop has nothing called "' + key + '". Type /shop list to see the list.')
    const server = source.getServer()
    const cog = offer.price * bundles
    const price = cog * CMP_SHOP_COG
    if (!cmpShopSpendable(price)) {
        console.error('[shop] refused ' + offer.key + ' x' + bundles + ' (' + price + ' spurs) for ' + cmpShopName(player))
        return cmpShopFail(source, CMP_SHOP_BAD_PRICE)
    }
    const wallet = cmpShopWallet(player)
    const pick = wallet.total < price ? null : cmpShopPick(wallet.counts, price)
    if (pick == null) return cmpShopFail(source, 'That costs ' + cmpShopCog(price) + '. You have ' + cmpShopCog(wallet.total) + '.')
    const change = cmpShopCoinsFor(pick.change)
    const items = offer.count * bundles
    const slots = cmpShopPlan(player, pick.take, [[offer.id, items]].concat(change))
    if (slots == null) {
        return cmpShopFail(source, change.length > 0
            ? "There's not enough room in your inventory for that and your change. Free up some slots and try again."
            : "There's not enough room in your inventory for that. Free up some slots and try again.")
    }
    const stop = cmpShopTripwire(server, player, price)
    if (stop != null) return cmpShopFail(source, stop)
    cmpShopApply(player, slots)
    cmpShopAddScore(server, '#spent', price)
    const team = cmpShopTeam(player)
    console.info('[shop] ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + offer.key + ' x' + bundles + ' ' + cog + ' cog')
    let message = 'You bought ' + cmpShopItemName(offer) + (items > 1 ? ' x' + items : '')
        + (bundles > 1 && offer.count > 1 ? ' (' + bundles + ' bundles of ' + offer.count + ')' : '') + ' for ' + cog + ' Cog.'
    if (change.length > 0) message += ' You got ' + cmpShopCoinWords(change) + ' back.'
    cmpShopSay(source, Text.green(message))
    return 1
}

// /shop change cog: 1 Cog into 4 Sprockets; /shop change sprocket: 4 Sprockets into 1 Cog. Only real coins of
// that kind count, so nobody gets change for a Crown here.
function cmpShopChange(source, from) {
    const player = cmpShopTrader(source)
    if (player == null) return 0
    const wallet = cmpShopWallet(player)
    const cogs = wallet.counts['numismatics:cog'] || 0
    const sprockets = wallet.counts['numismatics:sprocket'] || 0
    let slots
    if (from == 'cog') {
        if (cogs < 1) return cmpShopFail(source, 'You need a Cog in your inventory for that.')
        slots = cmpShopPlan(player, { 'numismatics:cog': 1 }, [['numismatics:sprocket', 4]])
    } else {
        if (sprockets < 4) return cmpShopFail(source, 'You need 4 Sprocket in your inventory for that.')
        slots = cmpShopPlan(player, { 'numismatics:sprocket': 4 }, [['numismatics:cog', 1]])
    }
    if (slots == null) return cmpShopFail(source, "There's not enough room in your inventory for that. Free up a slot and try again.")
    cmpShopApply(player, slots)
    const team = cmpShopTeam(player)
    console.info('[shop] change ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + (from == 'cog' ? 'cog->sprocket' : 'sprocket->cog'))
    cmpShopSay(source, Text.green(from == 'cog' ? 'You swapped 1 Cog for 4 Sprocket.' : 'You swapped 4 Sprocket for 1 Cog.'))
    return 1
}

function cmpShopDeposit(source, cog) {
    const player = cmpShopTrader(source)
    if (player == null) return 0
    const server = source.getServer()
    const price = cog * CMP_SHOP_COG
    if (!cmpShopSpendable(price)) {
        console.error('[shop] refused a treasury deposit of ' + cog + ' Cog from ' + cmpShopName(player))
        return cmpShopFail(source, CMP_SHOP_BAD_PRICE)
    }
    const wallet = cmpShopWallet(player)
    const pick = wallet.total < price ? null : cmpShopPick(wallet.counts, price)
    if (pick == null) return cmpShopFail(source, "That's " + cog + ' Cog. You have ' + cmpShopCog(wallet.total) + '.')
    const change = cmpShopCoinsFor(pick.change)
    const slots = cmpShopPlan(player, pick.take, change)
    if (slots == null) return cmpShopFail(source, "There's not enough room in your inventory for your change. Free up a slot and try again.")
    const stop = cmpShopTripwire(server, player, price)
    if (stop != null) return cmpShopFail(source, stop)
    cmpShopApply(player, slots)
    cmpShopAddScore(server, '#treasury', price)
    const team = cmpShopTeam(player)
    const treasury = cmpShopSub(cmpShopData(server), 'treasury')
    const entry = cmpShopSub(treasury, team.key)
    const total = entry.getInt('cog') + cog
    entry.putInt('cog', total)
    entry.putString('name', team.name)
    entry.putBoolean('party', team.party)
    console.info('[shop] treasury ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + cog)
    let message = 'You put ' + cog + ' Cog in ' + (team.party ? cmpShopOf(team.name) : 'your') + ' treasury. It holds ' + total + ' Cog now.'
    if (change.length > 0) message += ' You got ' + cmpShopCoinWords(change) + ' back.'
    cmpShopSay(source, Text.green(message))
    if (total >= CMP_SHOP_EGG_GOAL) cmpShopEgg(server, player, team)
    return 1
}

// The season's only dragon egg, for the first treasury to reach the goal. Stored before it is handed over,
// so it can never go out twice, and the world is saved right after, so a crash cannot bring back a world where
// the egg is still to be won while the winner keeps theirs.
function cmpShopEgg(server, player, team) {
    const data = cmpShopData(server)
    if (data.contains('egg')) return
    const egg = new $CmpShopCompound()
    egg.putString('team', team.key)
    egg.putString('name', team.name)
    egg.putString('player', cmpShopName(player))
    egg.putLong('time', Date.now())
    data.put('egg', egg)
    // give() drops what does not fit at the player's feet
    player.give(Item.of('minecraft:dragon_egg', 1))
    console.info('[shop] dragon egg ' + cmpShopName(player) + ' ' + cmpShopLogParty(team))
    server.getPlayerList().broadcastSystemMessage(Text.gold(cmpShopOf(team.party ? team.name : cmpShopName(player))
        + ' treasury reached ' + CMP_SHOP_EGG_GOAL + ' Cog first, so ' + cmpShopName(player) + " gets this season's only dragon egg."), false)
    // What save-all does: the player files and every level, and with the overworld KubeJS writes its persistent
    // data. Called directly, because a command run from inside a command (runCommandSilent) waits until this one
    // is done.
    const saved = server.saveEverything(true, false, true)
    console.info('[shop] saved the world after the dragon egg: ' + saved)
}

// Every treasury as [name, cog, key], the fullest first. Reads only: no entry is made for anyone.
function cmpShopTopRows(server) {
    const data = cmpShopData(server)
    const rows = []
    if (!data.contains('treasury')) return rows
    const treasury = data.getCompound('treasury')
    const keys = treasury.getAllKeys().toArray()
    for (let i = 0; i < keys.length; i++) {
        let key = String(keys[i])
        let entry = treasury.getCompound(key)
        let name = String(entry.getString('name'))
        // A party may have been renamed since its last deposit.
        try {
            let found = $CmpShopTeams.api().getManager().getTeamByID($CmpShopUUID.fromString(key))
            if (found.isPresent()) name = String(found.get().getName().getString())
        } catch (err) {}
        rows.push([name, entry.getInt('cog'), key])
    }
    rows.sort((a, b) => b[1] - a[1])
    return rows
}

function cmpShopTop(source) {
    const server = source.getServer()
    const data = cmpShopData(server)
    const rows = cmpShopTopRows(server)
    if (data.contains('egg')) {
        let egg = data.getCompound('egg')
        cmpShopSay(source, Text.gold(egg.getString('name') + " won this season's dragon egg (" + egg.getString('player') + ' put in the last Cog).'))
    } else {
        cmpShopSay(source, Text.gold("The first treasury to reach " + CMP_SHOP_EGG_GOAL + " Cog gets this season's only dragon egg."))
    }
    if (rows.length == 0) cmpShopSay(source, Text.gray('Nobody has put anything in yet.'))
    for (let i = 0; i < rows.length && i < 10; i++) cmpShopSay(source, Text.of((i + 1) + '. ' + rows[i][0] + ' ' + rows[i][1] + ' Cog'))
    return 1
}

function cmpShopSwitch(source, open) {
    if (!source.hasPermission(2)) return cmpShopFail(source, 'Only ops can close or open the shop.')
    const server = source.getServer()
    cmpShopSetOpen(server, open)
    console.info('[shop] ' + (open ? 'opened' : 'closed') + ' by ' + source.getTextName())
    cmpShopSay(source, open ? 'The shop is open.' : 'The shop is closed. /shop on opens it again.')
    // Every open screen shows the switch at once (a screen that is not open ignores this).
    if ($CmpShopNet != null) {
        let players = server.getPlayerList().getPlayers()
        let self = source.getPlayer()
        for (let i = 0; i < players.size(); i++) {
            let p = players.get(i)
            if (self != null && cmpShopName(p) == cmpShopName(self)) continue // cmpShopAct refreshes this one
            try {
                $CmpShopNet.send(p, cmpShopSnapshot(p, 'update', null))
            } catch (err) {
                console.error('[shop] could not refresh the shop screen of ' + cmpShopName(p) + ': ' + err)
            }
        }
    }
    return 1
}

// ---- the /shop screen ----------------------------------------------------------------------------------

// Text for the snapshot's JSON, as a JavaScript string. KubeJS's JSON.stringify is Gson's whenever Gson is there
// (always, in Minecraft) and escapes backslashes and control characters itself, so a party called ¯\_(ツ)_/¯
// reads back as it is; escaping here as well would double every backslash on the screen.
function cmpShopJsonText(text) {
    return String(text)
}

// What the screen shows, as JSON: the tabs and offers, the switch, the player's party and its treasury (read
// only, so looking makes no entry), the egg, the top ten, how long until the player may trade, and what the last
// command said (null when it said nothing, as for a dead player). The screen counts coins itself, from the
// player's own inventory. mode: open (opens the screen) or update (refreshes it if it is open).
function cmpShopSnapshot(player, mode, result) {
    const server = player.getServer()
    const data = cmpShopData(server)
    const team = cmpShopTeam(player)
    let cog = 0
    if (data.contains('treasury') && data.getCompound('treasury').contains(team.key)) {
        cog = data.getCompound('treasury').getCompound(team.key).getInt('cog')
    }
    let egg = null
    if (data.contains('egg')) {
        let tag = data.getCompound('egg')
        egg = {
            name: cmpShopJsonText(tag.getString('name')),
            player: cmpShopJsonText(tag.getString('player')),
            ours: String(tag.getString('team')) == team.key,
        }
    }
    return JSON.stringify({
        v: 1,
        mode: mode,
        open: cmpShopOpen(server),
        goal: CMP_SHOP_EGG_GOAL,
        cats: CMP_SHOP_CATEGORIES.map(c => ({ id: c[0], name: cmpShopJsonText(c[1]) })),
        offers: CMP_SHOP_OFFERS.map(o => ({ key: o.key, item: o.id, count: o.count, price: o.price, cat: o.cat, name: cmpShopJsonText(cmpShopItemName(o)) })),
        hurt: Math.max(0, Math.ceil(cmpShopHurtWait(player) / 1000)),
        team: { name: cmpShopJsonText(team.name), party: team.party },
        treasury: cog,
        egg: egg,
        top: cmpShopTopRows(server).slice(0, 10).map(r => ({ name: cmpShopJsonText(r[0]), cog: r[1], ours: r[2] == team.key })),
        result: result == null ? null : { ok: result.ok, text: cmpShopJsonText(result.text) },
    })
}

// Sends the screen to the player behind the command. False for the console, or a player without the screen.
function cmpShopSend(source, mode, result) {
    const player = source.getPlayer()
    if (player == null || $CmpShopNet == null) return false
    try {
        return $CmpShopNet.send(player, cmpShopSnapshot(player, mode, result)) == true
    } catch (err) {
        console.error('[shop] could not send the shop screen to ' + cmpShopName(player) + ': ' + err)
        return false
    }
}

// Runs a command and refreshes the player's screen with what came of it (the chat line too, as always). A screen
// that is not open ignores the refresh.
function cmpShopAct(source, command) {
    CMP_SHOP_LAST = null
    const result = command()
    cmpShopSend(source, 'update', CMP_SHOP_LAST)
    return result
}

ServerEvents.loaded(event => {
    cmpShopObjective(event.server)
})

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    // Tab completion: the keys that start with what was typed, or have a part after a _ that does ("trim", "egg").
    // (SharedSuggestionProvider.suggest has overloads Rhino cannot choose between.)
    const keys = (ctx, builder) => {
        const typed = '_' + String(builder.getRemaining()).toLowerCase()
        CMP_SHOP_OFFERS.forEach(offer => {
            if (('_' + offer.key).indexOf(typed) >= 0) builder.suggest(offer.key)
        })
        return builder.buildFuture()
    }
    event.register(Commands.literal('shop')
        // the screen for a player who has it, else the chat list
        .executes(ctx => (cmpShopSend(ctx.source, 'open', null) ? 1 : cmpShopList(ctx.source)))
        .then(Commands.literal('list').executes(ctx => cmpShopList(ctx.source)))
        .then(Commands.literal('buy')
            .then(Commands.argument('item', $CmpShopStringArg.word()).suggests(keys)
                .executes(ctx => cmpShopAct(ctx.source, () => cmpShopBuy(ctx.source, String($CmpShopStringArg.getString(ctx, 'item')), 1)))
                .then(Commands.argument('bundles', $CmpShopIntArg.integer(1))
                    .executes(ctx => cmpShopAct(ctx.source, () => cmpShopBuy(ctx.source, String($CmpShopStringArg.getString(ctx, 'item')), $CmpShopIntArg.getInteger(ctx, 'bundles')))))))
        .then(Commands.literal('change')
            .then(Commands.literal('cog').executes(ctx => cmpShopAct(ctx.source, () => cmpShopChange(ctx.source, 'cog'))))
            .then(Commands.literal('sprocket').executes(ctx => cmpShopAct(ctx.source, () => cmpShopChange(ctx.source, 'sprocket')))))
        .then(Commands.literal('treasury')
            .then(Commands.argument('cog', $CmpShopIntArg.integer(1))
                .executes(ctx => cmpShopAct(ctx.source, () => cmpShopDeposit(ctx.source, $CmpShopIntArg.getInteger(ctx, 'cog'))))))
        .then(Commands.literal('top').executes(ctx => cmpShopTop(ctx.source)))
        .then(Commands.literal('off').executes(ctx => cmpShopAct(ctx.source, () => cmpShopSwitch(ctx.source, false))))
        .then(Commands.literal('on').executes(ctx => cmpShopAct(ctx.source, () => cmpShopSwitch(ctx.source, true)))))
})
