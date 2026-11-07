// The Metal Market and the Metal Auction (Vlad, 2026-11-06): two blocks staff place in the city, cmpcity:market and
// cmpcity:auction. A click opens the /shop screen on that block's tab, and every button there runs a /shop command like
// the rest of that screen. These commands only work within reach of a block the player clicked, so people have to bring
// their metal to the city.
//
//   Market:   CMP_MARKET_INGOTS ingots of any of CMP_METALS make 1 spur, at most CMP_MARKET_DAILY spurs per crew per UTC
//             day. The metal is used up. The coins count as minted.
//   Auction:  an open ascending auction. Crews bid metal through the UTC day and can't take a bid back. At the end the
//             highest bid wins CMP_AUCTION_PRIZE spurs and its metal is used up; on a tie, the crew that got there first
//             wins. A bid has to reach CMP_AUCTION_MIN ingots to win, or a lone crew would win the prize for one ingot.
//             All other metal goes back to whoever bid it, and waits at the block until they collect it. The prize waits
//             for the crew in the same way, and counts as minted when it's collected.
//
// cmp_shop/market/<crew>: day, spurs. cmp_shop/auction: day, bids/<crew>: name, total, at, players/<player>/<item>: count;
// back/<player>/<item>: count; prizes/<crew>: spurs.
const CMP_MARKET_INGOTS = 16
const CMP_MARKET_DAILY = 8
const CMP_AUCTION_PRIZE = 128
const CMP_AUCTION_MIN = 256
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

function cmpDeskOpen(player, kind, x, y, z) {
    CMP_DESK_OPEN[cmpDeskPlayerId(player)] = { kind: kind, x: x + 0.5, y: y + 0.5, z: z + 0.5 }
    return cmpShopSend(player.createCommandSourceStack(), 'open', null)
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

// When the day has turned: the highest bid at or above the minimum wins, and everyone else's metal goes back. Runs from
// the tick below and before anything that reads the auction, so a bid can never land in a day that is over.
function cmpAuctionSettle(server) {
    const auction = cmpAuctionData(server)
    const today = cmpDeskToday()
    if (String(auction.getString('day')) == today) return
    auction.putString('day', today)
    const bids = cmpShopSub(auction, 'bids')
    const crews = cmpDeskKeys(bids)
    let winner = null
    let top = 0
    let at = 0
    crews.forEach(crew => {
        let entry = bids.getCompound(crew)
        let total = entry.getInt('total')
        let when = entry.getLong('at')
        if (total >= CMP_AUCTION_MIN && (winner == null || total > top || (total == top && when < at))) {
            winner = crew
            top = total
            at = when
        }
    })
    const back = cmpShopSub(auction, 'back')
    crews.forEach(crew => {
        if (crew == winner) return
        let players = bids.getCompound(crew).getCompound('players')
        cmpDeskKeys(players).forEach(id => {
            let bid = players.getCompound(id)
            let own = cmpShopSub(back, id)
            cmpDeskKeys(bid).forEach(item => own.putInt(item, own.getInt(item) + bid.getInt(item)))
        })
    })
    if (winner != null) {
        let name = String(bids.getCompound(winner).getString('name'))
        let prize = cmpShopSub(cmpShopSub(auction, 'prizes'), winner)
        prize.putInt('spurs', prize.getInt('spurs') + CMP_AUCTION_PRIZE)
        console.info('[shop] auction won by ' + cmpShopLogName(name) + ' with ' + top + ' ingots, ' + crews.length + ' bids')
        server.getPlayerList().broadcastSystemMessage(Text.gold(name + ' won the Metal Auction with ' + top + ' ingots. Everyone else can collect their metal at the block.'), false)
    } else if (crews.length > 0) {
        console.info('[shop] auction: no bid reached ' + CMP_AUCTION_MIN + ' ingots, ' + crews.length + ' bids go back')
    }
    auction.remove('bids')
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
    const entry = cmpShopSub(cmpShopSub(cmpAuctionData(server), 'bids'), team.key)
    const total = entry.getInt('total') + ingots
    entry.putString('name', team.name)
    entry.putInt('total', total)
    entry.putLong('at', Date.now())
    const own = cmpShopSub(cmpShopSub(entry, 'players'), cmpDeskPlayerId(player))
    own.putInt(id, own.getInt(id) + ingots)
    console.info('[shop] auction bid ' + cmpShopName(player) + ' ' + cmpShopLogParty(team) + ' ' + ingots + ' ' + metal + ' (total ' + total + ')')
    cmpShopSay(source, Text.green('You bid ' + ingots + ' ingots. ' + (team.party ? "Your crew's" : 'Your') + ' bid is now ' + total + '.'))
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

// ---- what the screen shows --------------------------------------------------------------------------------

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
    const rows = cmpDeskKeys(bids).map(crew => {
        let entry = bids.getCompound(crew)
        return { name: cmpShopJsonText(entry.getString('name')), amount: entry.getInt('total'), ours: crew == team.key, at: entry.getLong('at') }
    })
    rows.sort((a, b) => b.amount - a.amount || a.at - b.at)
    const mine = rows.filter(row => row.ours)
    const backTag = cmpShopSub(auction, 'back')
    const id = cmpDeskPlayerId(player)
    let back = 0
    if (backTag.contains(id)) {
        let own = backTag.getCompound(id)
        cmpDeskKeys(own).forEach(item => (back += own.getInt(item)))
    }
    const prizes = cmpShopSub(auction, 'prizes')
    return {
        kind: kind, metals: metals, prize: CMP_AUCTION_PRIZE, min: CMP_AUCTION_MIN, ends: 86400 - Math.floor(Date.now() / 1000) % 86400,
        mine: mine.length > 0 ? mine[0].amount : 0, bids: rows.slice(0, 10).map(row => ({ name: row.name, amount: row.amount, ours: row.ours })),
        back: back, won: prizes.contains(team.key) ? prizes.getCompound(team.key).getInt('spurs') : 0,
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
        if (event.server.getTickCount() % 400 == 0) cmpAuctionSettle(event.server)
    } catch (err) {
        console.error('[shop] auction day: ' + err)
    }
})

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    const metalBid = run => Commands.argument('metal', $CmpDeskWord.word())
        .then(Commands.argument('ingots', $CmpDeskInt.integer(1))
            .executes(ctx => cmpShopAct(ctx.source, () => run(ctx.source, String($CmpDeskWord.getString(ctx, 'metal')), $CmpDeskInt.getInteger(ctx, 'ingots')))))
    event.register(Commands.literal('shop')
        .then(Commands.literal('market').then(Commands.literal('sell').then(metalBid(cmpMarketSell))))
        .then(Commands.literal('auction')
            .then(Commands.literal('bid').then(metalBid(cmpAuctionBid)))
            .then(Commands.literal('collect').executes(ctx => cmpShopAct(ctx.source, () => cmpAuctionCollect(ctx.source)))))
        // For staff trying it out: this screen where they stand, with no block.
        .then(Commands.literal('desk').requires(source => source.hasPermission(2))
            .then(Commands.literal('market').executes(ctx => (cmpDeskOpen(ctx.source.getPlayer(), 'market', ctx.source.getPlayer().getX() - 0.5, ctx.source.getPlayer().getY() - 0.5, ctx.source.getPlayer().getZ() - 0.5) ? 1 : 0)))
            .then(Commands.literal('auction').executes(ctx => (cmpDeskOpen(ctx.source.getPlayer(), 'auction', ctx.source.getPlayer().getX() - 0.5, ctx.source.getPlayer().getY() - 0.5, ctx.source.getPlayer().getZ() - 0.5) ? 1 : 0)))))
})
