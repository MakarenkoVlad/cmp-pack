// /market: every player shop in the city, with what it sells, its price, whose it is and where it stands.
// Frigulus, 2026-11-11: "a cool small ui showing all vendors in city w their location, content, and price ... I type
// /market, I can browse and type diamonds". Vlad: "okay then we do this", vendors read from Create's own shops, on a
// screen of its own.
//
//   /market              the screen (cmpshop's MarketScreen), or the first shops in chat for a game without it
//   /market <words>      the same, already searched
//
// A shop is Create's own: a Table Cloth turned into a shop with a Shopping List and a price tag, tied to a Stock
// Ticker. Numismatics vendors stay off (numismatics.js: they can make coins from nothing). Nothing is traded here and
// no coin moves: the buyer walks to the shop. Only shops inside the safe square are listed, so /market never gives
// away a base in No Man's Land.
//
// How shops are found: every tick one player in the city has the loaded chunks around them looked through for Table
// Cloths, so each player comes round once in 10 seconds and no chunk is ever loaded for it. A chunk looked through in
// the last 10 seconds is skipped, which keeps players standing together and /market typed over and over cheap. What
// is found is kept by chunk in the server's KubeJS persistent data, one short text per chunk (a single text for the
// whole list would pass NBT's 65,535 bytes at a few hundred shops), so a shop nobody stands near stays listed as it
// was last seen. A chunk that is looked through again replaces its own entries, which is how a removed or emptied shop
// leaves the list.
// Rhino: a const inside a block (try, if, a loop) fails with "redeclaration of var" or keeps its first value, so
// everything below a function's top level is let. Two overloads that take the same number of arguments can't be told
// apart either (SafeZone.contains(level, BlockPos) against (level, Vec3)): the three-argument one is used.
const CMP_BOARD_KEY = 'cmp_market_board'
const CMP_BOARD_SCAN_TICKS = 200
const CMP_BOARD_RADIUS = 4      // chunks around a player, each way
const CMP_BOARD_SEND = 400      // listings a screen gets at most, nearest first
const CMP_BOARD_JSON = 200000   // characters of JSON a screen gets at most (the payload holds 262,144)
const CMP_BOARD_CHAT = 8        // lines of the chat list
const CMP_BOARD_ITEMS = 6       // items of one shop that are sent

let $CmpBoardCloth = null
let $CmpBoardSafe = null
let $CmpBoardLand = null
let $CmpBoardNet = null
try { $CmpBoardCloth = Java.loadClass('com.simibubi.create.content.logistics.tableCloth.TableClothBlockEntity') } catch (e) { $CmpBoardCloth = null }
try { $CmpBoardSafe = Java.loadClass('dev.cmp.cmpwar.SafeZone') } catch (e) { $CmpBoardSafe = null }
try { $CmpBoardLand = Java.loadClass('dev.cmp.cmpwar.CityLand') } catch (e) { $CmpBoardLand = null }
try { $CmpBoardNet = Java.loadClass('dev.cmp.shop.MarketNet') } catch (e) { $CmpBoardNet = null }
const $CmpBoardText = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType')

// "cx,cz" -> { "x,y,z": listing }. Read from the persistent data on first use; a chunk's text is written when it changes.
let cmpBoard = null
// "cx,cz" -> the tick the chunk was last looked through.
let cmpBoardSeen = {}

function cmpBoardChunks(server) {
    if (cmpBoard != null) return cmpBoard
    cmpBoard = {}
    const prefix = CMP_BOARD_KEY + ':'
    const keys = server.persistentData.getAllKeys().toArray()
    for (let i = 0; i < keys.length; i++) {
        let key = String(keys[i])
        if (key.indexOf(prefix) != 0) continue
        try {
            let entries = JSON.parse(String(server.persistentData.getString(key)))
            cmpBoard[key.substring(prefix.length)] = entries
        } catch (err) {
            console.error('[market] the saved shops of chunk ' + key + ' could not be read and are dropped: ' + err)
        }
    }
    return cmpBoard
}

// Every listing as "x,y,z" -> listing.
function cmpBoardList(server) {
    const chunks = cmpBoardChunks(server)
    const out = {}
    for (let ck in chunks) {
        let entries = chunks[ck]
        for (let key in entries) out[key] = entries[key]
    }
    return out
}

function cmpBoardItemId(stack) {
    return String(stack.getItem().builtInRegistryHolder().key().location())
}

// A listing for a Table Cloth that is a shop with a price, or null.
function cmpBoardEntry(server, level, be) {
    if (!be.isShop()) return null
    const pos = be.getBlockPos()
    // Without cmpwar there is no city to tell from a base, so nothing is listed.
    if ($CmpBoardSafe == null || !$CmpBoardSafe.contains(level, pos.getX(), pos.getZ())) return null
    const price = be.getPaymentItem()
    const amount = be.getPaymentAmount()
    if (price == null || price.isEmpty() || amount <= 0) return null
    const stacks = be.requestData.encodedRequest().stacks()
    const items = []
    for (let i = 0; i < stacks.size() && items.length < CMP_BOARD_ITEMS; i++) {
        let big = stacks.get(i) // let: Rhino keeps the first value of a const declared in a loop
        if (big.stack.isEmpty() || big.count <= 0) continue
        items.push({ id: cmpBoardItemId(big.stack), count: big.count, name: String(big.stack.getHoverName().getString()) })
    }
    if (items.length == 0) return null
    // The seller's name: from the player list while they are online, else from the server's cache of names. A player who
    // never logged in the usual way (the city test's players) is in no cache.
    let seller = '?'
    if (be.owner != null) {
        let online = server.getPlayerList().getPlayer(be.owner)
        if (online != null) seller = String(online.getGameProfile().getName())
        else {
            let cache = server.getProfileCache()
            let profile = cache == null ? null : cache.get(be.owner)
            if (profile != null && profile.isPresent()) seller = String(profile.get().getName())
        }
    }
    let plot = 0
    if ($CmpBoardLand != null) {
        let found = $CmpBoardLand.plotAt(pos.getX(), pos.getZ())
        if (found != null) plot = found.number()
    }
    return {
        x: pos.getX(), y: pos.getY(), z: pos.getZ(), plot: plot, seller: seller, items: items,
        price: { id: cmpBoardItemId(price), count: amount, name: String(price.getHoverName().getString()) },
    }
}

// Looks through the loaded chunks around a player and writes down what changed. A chunk looked through in the last
// 10 seconds is skipped unless `force` is set (/market does: the player asking stands there now). True when the list
// changed.
function cmpBoardScan(server, player, force) {
    if ($CmpBoardCloth == null) return false
    // KubeJS gives players and levels getters of its own that hide the game's methods of the same name: player.level()
    // and level.dimension() throw "is not a function". So: the level as a property, the overworld by comparing with the
    // server's, and the place from getBlockX and getBlockZ.
    const level = player.level
    if (level != server.overworld()) return false
    const chunks = cmpBoardChunks(server)
    const tick = server.getTickCount()
    const pcx = player.getBlockX() >> 4
    const pcz = player.getBlockZ() >> 4
    let changed = false
    for (let cx = pcx - CMP_BOARD_RADIUS; cx <= pcx + CMP_BOARD_RADIUS; cx++) {
        for (let cz = pcz - CMP_BOARD_RADIUS; cz <= pcz + CMP_BOARD_RADIUS; cz++) {
            let ck = cx + ',' + cz
            if (!force && cmpBoardSeen[ck] != null && tick - cmpBoardSeen[ck] < CMP_BOARD_SCAN_TICKS && tick >= cmpBoardSeen[ck]) continue
            let chunk = level.getChunkSource().getChunkNow(cx, cz)
            if (chunk == null) continue
            cmpBoardSeen[ck] = tick
            let found = {}
            let any = false
            let iterator = chunk.getBlockEntities().values().iterator()
            while (iterator.hasNext()) {
                let be = iterator.next()
                if (!(be instanceof $CmpBoardCloth)) continue
                let entry = null
                try {
                    entry = cmpBoardEntry(server, level, be)
                } catch (err) {
                    console.error('[market] a Table Cloth at ' + be.getBlockPos().toShortString() + ' could not be read: ' + err)
                }
                if (entry != null) {
                    found[entry.x + ',' + entry.y + ',' + entry.z] = entry
                    any = true
                }
            }
            let before = chunks[ck] == null ? '' : JSON.stringify(chunks[ck])
            let now = any ? JSON.stringify(found) : ''
            if (before == now) continue
            changed = true
            if (any) {
                chunks[ck] = found
                server.persistentData.putString(CMP_BOARD_KEY + ':' + ck, now)
            } else {
                delete chunks[ck]
                server.persistentData.remove(CMP_BOARD_KEY + ':' + ck)
            }
        }
    }
    return changed
}

function cmpBoardInCity(player) {
    return $CmpBoardSafe != null && $CmpBoardSafe.contains(player)
}

// One player a tick: the player whose place in the list is the tick's place in the 10 seconds.
ServerEvents.tick(event => {
    const server = event.server
    if ($CmpBoardCloth == null) return
    const players = server.getPlayerList().getPlayers()
    const turn = server.getTickCount() % CMP_BOARD_SCAN_TICKS
    if (turn >= players.size()) return
    try {
        let player = players.get(turn)
        if (cmpBoardInCity(player)) cmpBoardScan(server, player, false)
    } catch (err) {
        console.error('[market] scan failed: ' + err)
    }
})

function cmpBoardWords(entry) {
    let text = entry.seller + ' ' + entry.price.name + ' ' + entry.price.id
    for (let i = 0; i < entry.items.length; i++) text += ' ' + entry.items[i].name + ' ' + entry.items[i].id
    if (entry.plot > 0) text += ' #' + entry.plot
    return text.toLowerCase()
}

// Every listing that holds all the words, nearest to (x, z) first.
function cmpBoardMatching(server, query, x, z) {
    const words = String(query).trim().toLowerCase().split(/\s+/)
    const list = cmpBoardList(server)
    const out = []
    for (let key in list) {
        let entry = list[key]
        let text = cmpBoardWords(entry)
        let all = true
        for (let i = 0; i < words.length; i++) if (words[i].length > 0 && text.indexOf(words[i]) < 0) all = false
        if (all) out.push(entry)
    }
    out.sort((a, b) => ((a.x - x) * (a.x - x) + (a.z - z) * (a.z - z)) - ((b.x - x) * (b.x - x) + (b.z - z) * (b.z - z)))
    return out
}

function cmpBoardLine(entry) {
    const first = entry.items[0]
    return first.count + ' ' + first.name + (entry.items.length > 1 ? ' +' + (entry.items.length - 1) + ' more' : '') + ' for '
        + entry.price.count + ' ' + entry.price.name + ' - ' + entry.seller + (entry.plot > 0 ? ', plot #' + entry.plot : '')
        + ' (' + entry.x + ' ' + entry.y + ' ' + entry.z + ')'
}

function cmpBoardOpen(source, query) {
    const player = source.player
    if (!player) {
        source.sendFailure(Text.of('Only players can use /market.'))
        return 0
    }
    const server = source.getServer()
    if ($CmpBoardCloth == null) {
        player.tell(Text.red('The market needs Create, and this server has none.'))
        return 0
    }
    if (cmpBoardInCity(player)) cmpBoardScan(server, player, true)
    const px = player.getBlockX()
    const pz = player.getBlockZ()
    // The screen gets every shop and searches by itself; chat gets what the words match.
    const all = cmpBoardMatching(server, '', px, pz)
    if ($CmpBoardNet != null) {
        // The nearest shops that fit the payload: a quarter fewer until the text is short enough.
        let listings = all.slice(0, CMP_BOARD_SEND)
        let json = JSON.stringify({ query: String(query), x: px, z: pz, listings: listings })
        while (json.length > CMP_BOARD_JSON && listings.length > 1) {
            listings = listings.slice(0, Math.floor(listings.length * 3 / 4))
            json = JSON.stringify({ query: String(query), x: px, z: pz, listings: listings })
        }
        if ($CmpBoardNet.send(player, json)) return 1
    }
    const found = String(query).trim().length == 0 ? all : cmpBoardMatching(server, query, px, pz)
    if (found.length == 0) {
        player.tell(Text.yellow(all.length == 0 ? 'No shops in the city yet. A Table Cloth shop on your plot shows up here.' : 'No shop sells that.'))
        return 1
    }
    player.tell(Text.gold('Market: ' + found.length + (found.length == 1 ? ' shop' : ' shops') + ', nearest first'))
    for (let i = 0; i < found.length && i < CMP_BOARD_CHAT; i++) player.tell(Text.white(cmpBoardLine(found[i])))
    if (found.length > CMP_BOARD_CHAT) player.tell(Text.gray((found.length - CMP_BOARD_CHAT) + ' more. Narrow it: /market <item or seller>'))
    return 1
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('market')
        .executes(ctx => cmpBoardOpen(ctx.source, ''))
        .then(Commands.argument('search', $CmpBoardText.greedyString())
            .executes(ctx => cmpBoardOpen(ctx.source, $CmpBoardText.getString(ctx, 'search')))))
})
