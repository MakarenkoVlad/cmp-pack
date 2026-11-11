// The Metal Market and the Metal Auction (Vlad, 2026-11-06): two blocks staff place in the city, cmpcity:market and
// cmpcity:auction. A click opens that block's own screen (cmpshop's MetalMarketScreen and MetalAuctionScreen, apart from
// the /shop screen since 2026-11-11), and every button there runs a /shop command. These commands only work within reach
// of a block the player clicked, so people have to bring their metal to the city.
//
//   Market:   CMP_MARKET_INGOTS ingots of any of CMP_METALS make 1 spur, at most CMP_MARKET_DAILY spurs per crew per UTC
//             day. The metal is used up. The coins count as minted.
//   Auction:  CMP_AUCTION_PRIZE spurs a UTC day, by maximum bids, as on eBay (Vlad, 2026-11-11: "players compete for
//             those 2 cogs, but i want this competition to be fair and for everyone to take part in it who has those
//             resources", and on this way of doing it: "YES, THAT's the best"). A crew puts in the most it would pay;
//             its bids add up and can't be taken back before the end. Nobody else is shown the amount. The crew that
//             put in the most leads, once that is at least the opening price of CMP_AUCTION_OPENING ingots (his number
//             too, so that a crew bidding alone can't win for one ingot); among equal amounts the first to get there.
//             The price is what the leader would pay right now: one ingot more than the next crew's amount, never
//             under the opening price and never over the leader's own amount. The price and the leader's name are all
//             anyone sees. At the end of the day the leader wins: the price is used up out of its metal (copper first,
//             then iron, zinc and gold, the order of CMP_METALS) and the rest goes back to whoever bid it. All other
//             metal goes back too, and waits at the block until it is collected. So a bid in the last second only wins
//             by being the biggest, and the hour a crew plays at doesn't matter. With no bid at the opening price
//             nobody wins. The prize waits for the crew at the block, and counts as minted when it's collected.
//
// cmp_shop/market/<crew>: day, spurs. cmp_shop/auction: day, bids/<crew>: name, total (the crew's maximum), at,
// players/<player>/<item>: count; back/<player>/<item>: count; prizes/<crew>: spurs; last: name, total (the last winner
// and what they paid); price, leader (what anyone may see of today: cmpwar's Jade lines read these two and never a total).
const CMP_MARKET_INGOTS = 16
const CMP_MARKET_DAILY = 8
const CMP_AUCTION_PRIZE = 128
const CMP_AUCTION_OPENING = 1024
const CMP_DESK_REACH = 8
const CMP_METALS = { copper: 'minecraft:copper_ingot', iron: 'minecraft:iron_ingot', zinc: 'create:zinc_ingot', gold: 'minecraft:gold_ingot' }
const CMP_DESK_BLOCKS = { 'cmpcity:market': 'market', 'cmpcity:auction': 'auction' }
// Where each player last clicked one of the blocks: {kind, x, y, z}. Gone after a restart, and a click brings it back.
const CMP_DESK_OPEN = {}

const $CmpDeskWord = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')
const $CmpDeskInt = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')
const $CmpDeskPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $CmpDeskResult = Java.loadClass('net.minecraft.world.InteractionResult')
const $CmpDeskRegs = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $CmpDeskFake = Java.loadClass('net.neoforged.neoforge.common.util.FakePlayer')
// The two screens (the cmpshop mod, in the pack on both sides). Without it a click says in chat what the block does.
let $CmpDeskNet = null
try { $CmpDeskNet = Java.loadClass('dev.cmp.shop.DeskNet') } catch (e) { $CmpDeskNet = null }

function cmpDeskPlayerId(player) {
    return String(player.getGameProfile().getId())
}

function cmpDeskToday() {
    return new Date(Date.now()).toISOString().slice(0, 10)
}

// The kind of block this player clicked and is still within reach of, or null.
function cmpDeskAt(player) {
    const open = CMP_DESK_OPEN[cmpDeskPlayerId(player)]
    if (!open || player.distanceToSqr(open.x, open.y, open.z) > CMP_DESK_REACH * CMP_DESK_REACH) return null
    return open.kind
}

// A click on a block: from now on this player trades there, and its screen opens. A game without the screen gets a
// line in chat with the commands the buttons would run.
function cmpDeskOpen(player, kind, x, y, z) {
    CMP_DESK_OPEN[cmpDeskPlayerId(player)] = { kind: kind, x: x + 0.5, y: y + 0.5, z: z + 0.5 }
    const source = player.createCommandSourceStack()
    if (cmpDeskSend(source, 'open', null)) return true
    const metals = Object.keys(CMP_METALS).join('|')
    if (kind == 'market') {
        cmpShopSay(source, Text.gold('Metal Market: ' + CMP_MARKET_INGOTS + ' ingots make 1 Spur, up to ' + CMP_MARKET_DAILY + ' Spur a day for a crew. /shop market sell <' + metals + '> <ingots>'))
    } else {
        cmpAuctionSettle(player.getServer())
        let lead = cmpAuctionLead(cmpShopSub(cmpAuctionData(player.getServer()), 'bids'))
        cmpShopSay(source, Text.gold('Metal Auction: put in the most you would pay for ' + cmpShopPrice(CMP_AUCTION_PRIZE) + ', from ' + CMP_AUCTION_OPENING + ' ingots. The highest at 00:00 UTC wins and pays 1 more than the next crew. Price now: ' + cmpAuctionPrice(lead) + ' ingots'
            + (lead == null ? '' : ' (' + lead.name + ' leads)') + '. /shop auction bid <' + metals + '> <ingots>, /shop auction collect'))
    }
    return false
}

// The player, when they may trade here now. Otherwise null, and they have been told why.
function cmpDeskTrader(source, kind) {
    const player = cmpShopTrader(source)
    if (player == null) return null
    if (cmpDeskAt(player) != kind) {
        cmpShopFail(source, kind == 'market' ? 'Use a Metal Market in the city for that.' : 'Use a Metal Auction in the city for that.')
        return null
    }
    return player
}

function cmpMetalId(key) {
    return Object.prototype.hasOwnProperty.call(CMP_METALS, key) ? CMP_METALS[key] : null
}

function cmpDeskHas(player, id) {
    const inv = player.getInventory()
    let count = 0
    for (let i = 0; i < 36; i++) {
        let stack = inv.getItem(i)
        if (!stack.isEmpty() && cmpShopStackId(stack) == id) count += stack.getCount()
    }
    return count
}

// ---- the market ----------------------------------------------------------------------------------------

function cmpMarketSold(server, crew) {
    const entry = cmpShopSub(cmpShopSub(cmpShopData(server), 'market'), crew)
    return String(entry.getString('day')) == cmpDeskToday() ? entry.getInt('spurs') : 0
}

function cmpMarketSell(source, metal, ingots) {
    const player = cmpDeskTrader(source, 'market')
    if (player == null) return 0
    const id = cmpMetalId(metal)
    if (id == null) return cmpShopFail(source, "The market doesn't buy that.")
    const server = source.getServer()
    const team = cmpShopTeam(player)
    const sold = cmpMarketSold(server, team.key)
    const left = CMP_MARKET_DAILY - sold
    if (left <= 0) {
        return cmpShopFail(source, (team.party ? 'Your crew has' : 'You have') + " sold today's " + CMP_MARKET_DAILY + ' Spur. More tomorrow (the day turns at 00:00 UTC).')
    }
    const spurs = Math.min(left, Math.floor(Math.min(ingots, cmpDeskHas(player, id)) / CMP_MARKET_INGOTS))
    if (spurs <= 0) return cmpShopFail(source, 'It takes ' + CMP_MARKET_INGOTS + ' ingots to make 1 Spur.')
    const take = {}
    take[id] = spurs * CMP_MARKET_INGOTS
    const coins = cmpShopCoinsFor(spurs)
    const slots = cmpShopPlan(player, take, coins)
    if (slots == null) return cmpShopFail(source, 'Your inventory is full. Make some room and try again.')
    cmpShopApply(player, slots)
    cmpShopAddScore(server, '#minted', spurs)
    const entry = cmpShopSub(cmpShopSub(cmpShopData(server), 'market'), team.key)
    entry.putString('day', cmpDeskToday())
    entry.putInt('spurs', sold + spurs)
    console.info('[shop] market ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + take[id] + ' ' + metal + ' for ' + spurs + ' spurs (' + (sold + spurs) + '/' + CMP_MARKET_DAILY + ' today)')
    cmpShopSay(source, Text.green('You sold ' + take[id] + ' ingots for ' + cmpShopCoinWords(coins) + '. ' + (left - spurs) + ' Spur left to sell today.'))
    return 1
}

// ---- the auction ---------------------------------------------------------------------------------------

function cmpAuctionData(server) {
    return cmpShopSub(cmpShopData(server), 'auction')
}

function cmpDeskKeys(tag) {
    const keys = tag.getAllKeys().toArray()
    const out = []
    for (let i = 0; i < keys.length; i++) out.push(String(keys[i]))
    return out
}

// Who leads and at what price: {crew, name, max, at, price}, or null while no crew's amount has reached the opening
// price. The leader is the crew that put in the most, among equal amounts the first to get there. The price is one ingot
// more than the next crew's amount, never under the opening price and never over the leader's own amount.
function cmpAuctionLead(bids) {
    let top = null
    let second = 0
    cmpDeskKeys(bids).forEach(crew => {
        let entry = bids.getCompound(crew)
        let total = entry.getInt('total')
        let when = entry.getLong('at')
        if (total <= 0) return
        if (top == null || total > top.max || (total == top.max && when < top.at)) {
            if (top != null) second = Math.max(second, top.max)
            top = { crew: crew, name: String(entry.getString('name')), max: total, at: when }
        } else {
            second = Math.max(second, total)
        }
    })
    if (top == null || top.max < CMP_AUCTION_OPENING) return null
    top.price = Math.min(top.max, Math.max(CMP_AUCTION_OPENING, second + 1))
    return top
}

// The price: what the leader would pay now, or the opening price while nobody leads.
function cmpAuctionPrice(lead) {
    return lead == null ? CMP_AUCTION_OPENING : lead.price
}

// What anyone may see of today, kept beside the bids for cmpwar's Jade lines: the price and the leader's name.
function cmpAuctionPublish(auction) {
    const lead = cmpAuctionLead(cmpShopSub(auction, 'bids'))
    auction.putInt('price', cmpAuctionPrice(lead))
    auction.putString('leader', lead == null ? '' : lead.name)
}

// When the day has turned: the leader wins and pays the price out of its metal, and everything else goes back. Runs
// from the tick below and before anything that reads the auction, so a bid can never land in a day that is over.
function cmpAuctionSettle(server) {
    const auction = cmpAuctionData(server)
    const today = cmpDeskToday()
    if (String(auction.getString('day')) == today) return
    auction.putString('day', today)
    const bids = cmpShopSub(auction, 'bids')
    const crews = cmpDeskKeys(bids)
    const lead = cmpAuctionLead(bids)
    const back = cmpShopSub(auction, 'back')
    const metals = Object.keys(CMP_METALS).map(key => CMP_METALS[key])
    // What the winner still has to pay while its metal is gone through: copper first, then iron, zinc and gold.
    let owed = lead == null ? 0 : lead.price
    crews.forEach(crew => {
        let wins = lead != null && crew == lead.crew
        let players = bids.getCompound(crew).getCompound('players')
        let ids = cmpDeskKeys(players).sort()
        // The metals in their order, then anything else a player's entry holds (a metal the auction took once).
        let items = metals.slice()
        ids.forEach(id => cmpDeskKeys(players.getCompound(id)).forEach(item => {
            if (items.indexOf(item) < 0) items.push(item)
        }))
        items.forEach(item => {
            ids.forEach(id => {
                let has = players.getCompound(id).getInt(item)
                if (has <= 0) return
                let used = wins ? Math.min(has, owed) : 0
                owed -= used
                if (has > used) {
                    let own = cmpShopSub(back, id)
                    own.putInt(item, own.getInt(item) + has - used)
                }
            })
        })
    })
    if (lead != null) {
        let prize = cmpShopSub(cmpShopSub(auction, 'prizes'), lead.crew)
        prize.putInt('spurs', prize.getInt('spurs') + CMP_AUCTION_PRIZE)
        let last = cmpShopSub(auction, 'last')
        last.putString('name', lead.name)
        last.putInt('total', lead.price)
        console.info('[shop] auction won by ' + cmpShopLogName(lead.name) + ' for ' + lead.price + ' of its ' + lead.max + ' ingots, ' + crews.length + ' bids')
        server.getPlayerList().broadcastSystemMessage(Text.gold(lead.name + ' won the Metal Auction for ' + lead.price + ' ingots and takes ' + cmpShopPrice(CMP_AUCTION_PRIZE)
            + (crews.length > 1 || lead.max > lead.price ? '. Metal that was not used can be collected at the block.' : '.')), false)
    } else if (crews.length > 0) {
        console.info('[shop] auction: no bid reached the opening price of ' + CMP_AUCTION_OPENING + ' ingots, ' + crews.length + ' bids go back')
        server.getPlayerList().broadcastSystemMessage(Text.gold('No bid reached the Metal Auction\'s opening price of ' + CMP_AUCTION_OPENING + ' ingots. Everyone can collect their metal at the block.'), false)
    }
    auction.remove('bids')
    cmpAuctionPublish(auction)
}

function cmpAuctionBid(source, metal, ingots) {
    const player = cmpDeskTrader(source, 'auction')
    if (player == null) return 0
    const id = cmpMetalId(metal)
    if (id == null) return cmpShopFail(source, "The auction doesn't take that.")
    const have = cmpDeskHas(player, id)
    if (ingots > have) return cmpShopFail(source, 'You only have ' + have + ' of those.')
    const server = source.getServer()
    cmpAuctionSettle(server)
    const take = {}
    take[id] = ingots
    const slots = cmpShopPlan(player, take, [])
    if (slots == null) return cmpShopFail(source, 'You only have ' + have + ' of those.')
    cmpShopApply(player, slots)
    const team = cmpShopTeam(player)
    const bids = cmpShopSub(cmpAuctionData(server), 'bids')
    const entry = cmpShopSub(bids, team.key)
    const total = entry.getInt('total') + ingots
    entry.putString('name', team.name)
    entry.putInt('total', total)
    entry.putLong('at', Date.now())
    const own = cmpShopSub(cmpShopSub(entry, 'players'), cmpDeskPlayerId(player))
    own.putInt(id, own.getInt(id) + ingots)
    // What the bidder is told: where their own crew stands and the price, never another crew's amount.
    const lead = cmpAuctionLead(bids)
    const price = cmpAuctionPrice(lead)
    const leads = lead != null && lead.crew == team.key
    cmpAuctionPublish(cmpAuctionData(server))
    console.info('[shop] auction bid ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + ingots + ' ' + metal + ' (maximum ' + total + ', price ' + price + (leads ? ', leads' : '') + ')')
    const mine = team.party ? "Your crew's maximum" : 'Your maximum'
    let stands
    if (leads) stands = (team.party ? 'Your crew leads' : 'You lead') + '. ' + mine + ' is ' + total + ' and the price is ' + price + '.'
    else if (lead == null) stands = mine + ' is now ' + total + '. ' + (CMP_AUCTION_OPENING - total) + ' more to lead.'
    else stands = mine + ' is now ' + total + '. Another crew is ahead, and the price is now ' + price + '.'
    cmpShopSay(source, Text.green('You bid ' + ingots + ' ingots. ' + stands))
    return 1
}

// Whatever waits here for this player and their crew, as far as it fits. The rest keeps waiting.
function cmpAuctionCollect(source) {
    const player = cmpDeskTrader(source, 'auction')
    if (player == null) return 0
    const server = source.getServer()
    cmpAuctionSettle(server)
    const auction = cmpAuctionData(server)
    const team = cmpShopTeam(player)
    const said = []
    let waiting = 0
    const prizes = cmpShopSub(auction, 'prizes')
    if (prizes.contains(team.key)) {
        let spurs = prizes.getCompound(team.key).getInt('spurs')
        let coins = cmpShopCoinsFor(spurs)
        let slots = cmpShopPlan(player, {}, coins)
        if (slots == null) {
            waiting += 1
        } else {
            cmpShopApply(player, slots)
            cmpShopAddScore(server, '#minted', spurs)
            prizes.remove(team.key)
            said.push(cmpShopCoinWords(coins))
            console.info('[shop] auction prize ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + spurs + ' spurs')
        }
    }
    const back = cmpShopSub(auction, 'back')
    const id = cmpDeskPlayerId(player)
    if (back.contains(id)) {
        let own = back.getCompound(id)
        let got = 0
        cmpDeskKeys(own).forEach(item => {
            let left = own.getInt(item)
            while (left > 0) {
                let n = Math.min(left, 64)
                let slots = cmpShopPlan(player, {}, [[item, n]])
                if (slots == null) break
                cmpShopApply(player, slots)
                left -= n
                got += n
            }
            if (left > 0) {
                own.putInt(item, left)
                waiting += left
            } else {
                own.remove(item)
            }
        })
        if (cmpDeskKeys(own).length == 0) back.remove(id)
        if (got > 0) said.push(got + ' ingots')
    }
    if (said.length == 0) {
        return cmpShopFail(source, waiting > 0 ? 'Your inventory is full. Make some room and try again.' : 'Nothing is waiting here for you.')
    }
    cmpShopSay(source, Text.green('You collected ' + said.join(' and ') + '.' + (waiting > 0 ? ' Your inventory is full, so the rest keeps waiting here.' : '')))
    return 1
}

// ---- what the screens show --------------------------------------------------------------------------------

// The numbers of the block this player is at, or null when they aren't at one. Market: ingots to a spur, the day's cap
// and what the crew sold. Auction: the prize, the opening price, the price, the leader's name and whether that is the
// player's crew, the crew's own maximum, the crews that have bid (names only: no amount but the player's own crew's
// ever leaves the server), seconds until the end, what waits here for the player and the crew, and the last winner
// with what they paid.
function cmpDeskSnapshot(player) {
    const kind = cmpDeskAt(player)
    if (kind == null) return null
    const server = player.getServer()
    const team = cmpShopTeam(player)
    const metals = Object.keys(CMP_METALS).map(key => ({ key: key, item: CMP_METALS[key] }))
    if (kind == 'market') {
        return { kind: kind, metals: metals, ingots: CMP_MARKET_INGOTS, cap: CMP_MARKET_DAILY, sold: cmpMarketSold(server, team.key) }
    }
    cmpAuctionSettle(server)
    const auction = cmpAuctionData(server)
    const bids = cmpShopSub(auction, 'bids')
    const lead = cmpAuctionLead(bids)
    const bidders = []
    let mine = 0
    cmpDeskKeys(bids).forEach(crew => {
        let entry = bids.getCompound(crew)
        if (entry.getInt('total') <= 0) return
        if (crew == team.key) mine = entry.getInt('total')
        bidders.push({ name: cmpShopJsonText(entry.getString('name')), ours: crew == team.key, leads: lead != null && crew == lead.crew })
    })
    // The leader first, the rest by name: an order by amount would give away who is close.
    bidders.sort((a, b) => {
        if (a.leads != b.leads) return a.leads ? -1 : 1
        let x = a.name.toLowerCase()
        let y = b.name.toLowerCase()
        return x < y ? -1 : x > y ? 1 : 0
    })
    const backTag = cmpShopSub(auction, 'back')
    const id = cmpDeskPlayerId(player)
    let back = 0
    if (backTag.contains(id)) {
        let own = backTag.getCompound(id)
        cmpDeskKeys(own).forEach(item => (back += own.getInt(item)))
    }
    const prizes = cmpShopSub(auction, 'prizes')
    const last = auction.contains('last') ? auction.getCompound('last') : null
    return {
        kind: kind, metals: metals, prize: CMP_AUCTION_PRIZE, opening: CMP_AUCTION_OPENING, price: cmpAuctionPrice(lead), ends: 86400 - Math.floor(Date.now() / 1000) % 86400,
        mine: mine, leading: lead != null && lead.crew == team.key, leader: lead == null ? null : cmpShopJsonText(lead.name),
        bidders: bidders.slice(0, 10), crews: bidders.length,
        back: back, won: prizes.contains(team.key) ? prizes.getCompound(team.key).getInt('spurs') : 0,
        last: last == null ? null : { name: cmpShopJsonText(last.getString('name')), amount: last.getInt('total') },
    }
}

// A screen's whole message, as JSON: the block's numbers and, as the shop's screen gets them, whether trading is open,
// how long until the player may trade, whether they are in a crew, and what the last command said. A player who is no
// longer at a block gets only that last line (kind "none"), so an open screen can still show why nothing happened.
// mode: open (opens the screen) or update (refreshes it if it is open).
function cmpDeskJson(player, mode, result) {
    let desk = cmpDeskSnapshot(player)
    if (desk == null) {
        if (mode == 'open') return null
        desk = { kind: 'none' }
    }
    desk.v = 1
    desk.mode = mode
    desk.open = cmpShopOpen(player.getServer())
    desk.hurt = Math.max(0, Math.ceil(cmpShopHurtWait(player) / 1000))
    desk.party = cmpShopTeam(player).party
    desk.result = result == null ? null : { ok: result.ok, text: cmpShopJsonText(result.text) }
    return JSON.stringify(desk)
}

// Sends it to the player behind the command. False for the console, or a player without the screens.
function cmpDeskSend(source, mode, result) {
    const player = source.getPlayer()
    if (player == null || $CmpDeskNet == null) return false
    try {
        let json = cmpDeskJson(player, mode, result)
        return json != null && $CmpDeskNet.send(player, json) == true
    } catch (err) {
        console.error('[shop] could not send the market or auction screen to ' + cmpShopName(player) + ': ' + err)
        return false
    }
}

// ---- the blocks, the commands, the day turning -------------------------------------------------------------

// A native listener, as the City Generator uses. An error thrown here would not be caught by KubeJS and would crash the
// server, so everything is inside try.
NativeEvents.onEvent($CmpDeskPriority.HIGH, 'net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
    try {
        if (event.getLevel().isClientSide()) return
        let state = event.getLevel().getBlockState(event.getPos())
        let id = String($CmpDeskRegs.BLOCK.getKey(state.getBlock()))
        if (!Object.prototype.hasOwnProperty.call(CMP_DESK_BLOCKS, id)) return
        event.setCanceled(true)
        event.setCancellationResult($CmpDeskResult.SUCCESS)
        if (String(event.getHand()) != 'MAIN_HAND') return
        let player = event.getEntity()
        if (player == null || player instanceof $CmpDeskFake || !player.isAlive()) return
        let pos = event.getPos()
        cmpDeskOpen(player, CMP_DESK_BLOCKS[id], pos.getX(), pos.getY(), pos.getZ())
    } catch (err) {
        console.error('[shop] market or auction click: ' + err)
    }
})

ServerEvents.tick(event => {
    try {
        if (event.server.getTickCount() % 400 == 0) {
            cmpAuctionSettle(event.server)
            cmpAuctionPublish(cmpAuctionData(event.server))
        }
    } catch (err) {
        console.error('[shop] auction day: ' + err)
    }
})

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    const metalBid = run => Commands.argument('metal', $CmpDeskWord.word())
        .then(Commands.argument('ingots', $CmpDeskInt.integer(1))
            .executes(ctx => cmpShopAct(ctx.source, () => run(ctx.source, String($CmpDeskWord.getString(ctx, 'metal')), $CmpDeskInt.getInteger(ctx, 'ingots')), cmpDeskSend)))
    event.register(Commands.literal('shop')
        .then(Commands.literal('market').then(Commands.literal('sell').then(metalBid(cmpMarketSell))))
        .then(Commands.literal('auction')
            .then(Commands.literal('bid').then(metalBid(cmpAuctionBid)))
            .then(Commands.literal('collect').executes(ctx => cmpShopAct(ctx.source, () => cmpAuctionCollect(ctx.source), cmpDeskSend))))
        // For staff trying it out: the block's screen where they stand, with no block.
        .then(Commands.literal('desk').requires(source => source.hasPermission(2))
            .then(Commands.literal('market').executes(ctx => (cmpDeskOpen(ctx.source.getPlayer(), 'market', ctx.source.getPlayer().getX() - 0.5, ctx.source.getPlayer().getY() - 0.5, ctx.source.getPlayer().getZ() - 0.5) ? 1 : 0)))
            .then(Commands.literal('auction').executes(ctx => (cmpDeskOpen(ctx.source.getPlayer(), 'auction', ctx.source.getPlayer().getX() - 0.5, ctx.source.getPlayer().getY() - 0.5, ctx.source.getPlayer().getZ() - 0.5) ? 1 : 0)))))
})
