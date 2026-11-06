// Season 2 city generators (#59, settled point 8, detail D1; the block is the CMP City mod, cmpcity/, whose info page and
// Ponder scene say the numbers below in words: change them together).
//
// A right-click with the main hand on a cmpcity:generator hands the player everything that is ready for them, straight
// into the 36 main slots. Supply comes in bundles: one bundle (CMP_GEN_BUNDLE) from the start, then one for every CMP_GEN_BUNDLE_MINUTES of
// the player's play time, the vanilla statistic, which counts only while they are online, idle time included. The
// player's KubeJS persistent data keeps the play time up to which bundles were paid (cmp_gen_paid, in ticks), so
// clicking often loses nothing, and restarts, deaths and team changes change nothing. At most CMP_GEN_DAILY_BUNDLES
// bundles a UTC day: what is ready beyond that is dropped when they click (the cap is per day, so it never stores up).
// When it does not all fit, the click is refused like /kit and nothing changes. Every player gets only their own
// supply; there is no menu, nothing goes in and no hopper or funnel can pull anything out (the block has no inventory).
//
// Playtest numbers (set low on purpose, "from the smallest successful expedition"): one bundle per 20 minutes online,
// 6 bundles a day (2 hours of play). Contents follow the first-expedition recipe audit (scripts/tests/s2_city_test.js,
// "audit"): with these, the islands, the kits and the shop, every Create, Aeronautics, Simulated, Propulsion and
// Diesel Generators part of a first aircraft, drill, mixer, refinery and burner can be made. One quartz breaks a loop: a
// crushing wheel needs mechanical crafters, crafters need electron tubes, tubes need quartz, and quartz needs a crushing wheel
// (launch audit, 2026-11-05). After the first wheels, crushing diorite gives quartz.
const CMP_GEN_BUNDLE_MINUTES = 20
const CMP_GEN_DAILY_BUNDLES = 6
const CMP_GEN_BUNDLE = [
    ['minecraft:iron_ingot', 8],
    ['minecraft:copper_ingot', 8],
    ['create:zinc_ingot', 4],
    ['minecraft:gold_ingot', 2],
    ['minecraft:redstone', 8],
    ['minecraft:amethyst_shard', 4],
    ['minecraft:quartz', 1],
    ['create:andesite_alloy', 16],
    ['cmpveins:rubber', 4],
    ['createdieselgenerators:diesel_bucket', 1],
]
const CMP_GEN_PAID = 'cmp_gen_paid'   // play-time ticks up to which bundles were handed out (or dropped past the cap)
const CMP_GEN_DAY = 'cmp_gen_day'     // UTC date of the day CMP_GEN_TODAY counts
const CMP_GEN_TODAY = 'cmp_gen_today' // bundles handed out that day
const CMP_GEN_TICKS = CMP_GEN_BUNDLE_MINUTES * 60 * 20
const $CmpGenFake = Java.loadClass('net.neoforged.neoforge.common.util.FakePlayer')

// The vanilla play-time statistic in ticks (KubeJS hands out the player's statistics as its PlayerStatsJS).
function cmpGenPlayTicks(player) {
    return player.getStats().getPlayTime()
}

function cmpGenToday() {
    return new Date().toISOString().slice(0, 10)
}

// Item names for chat, "8 Iron Ingot, 8 Copper Ingot, ...".
function cmpGenWords(stacks) {
    return stacks.map(s => s.getCount() + ' ' + s.getHoverName().getString()).join(', ')
}

// What a click does for this player now: {give: bundles handed out, drop: bundles past the cap, next: ticks to the
// next bundle, left: bundles left today}. Changes nothing.
function cmpGenState(player) {
    const data = player.persistentData
    const play = cmpGenPlayTicks(player)
    // Before the first click nothing is paid, and one bundle is ready from the start (Vlad, 2026-11-05).
    let paid = data.contains(CMP_GEN_PAID) ? data.getLong(CMP_GEN_PAID) : -CMP_GEN_TICKS
    if (paid > play) paid = play // the statistic was reset: start again from now
    const ready = Math.floor((play - paid) / CMP_GEN_TICKS)
    const used = data.getString(CMP_GEN_DAY) == cmpGenToday() ? data.getInt(CMP_GEN_TODAY) : 0
    const left = Math.max(0, CMP_GEN_DAILY_BUNDLES - used)
    const give = Math.min(ready, left)
    return { play: play, paid: paid, ready: ready, give: give, drop: ready - give, used: used, left: left - give,
             next: CMP_GEN_TICKS - ((play - paid) - ready * CMP_GEN_TICKS) }
}

function cmpGenMinutes(ticks) {
    return Math.max(1, Math.ceil(ticks / 1200)) + 'm'
}

// One click. Returns a short word for tests: 'gave', 'empty', 'capped', 'full'.
function cmpGenClick(player) {
    const st = cmpGenState(player)
    const data = player.persistentData
    if (st.give == 0) {
        if (st.drop > 0) {
            // past the daily cap: what was ready is dropped, so it never stores up for tomorrow
            data.putLong(CMP_GEN_PAID, st.paid + st.ready * CMP_GEN_TICKS)
            player.tell(Text.red("You've had today's " + CMP_GEN_DAILY_BUNDLES + ' generator bundles. More tomorrow (the day turns at 00:00 UTC).'))
            return 'capped'
        }
        if (st.left <= 0) {
            player.tell(Text.red("You've had today's " + CMP_GEN_DAILY_BUNDLES + ' generator bundles. More tomorrow (the day turns at 00:00 UTC).'))
            return 'capped'
        }
        player.tell(Text.yellow('Nothing ready yet. Your next bundle is ready after ' + cmpGenMinutes(st.next) + ' more online.'))
        return 'empty'
    }
    const stacks = []
    CMP_GEN_BUNDLE.forEach(entry => {
        let total = entry[1] * st.give
        let one = Item.of(entry[0], 1)
        let max = one.getMaxStackSize()
        while (total > 0) {
            let n = Math.min(total, max)
            stacks.push(Item.of(entry[0], n))
            total -= n
        }
    })
    if (!cmpKitHasRoom(player, stacks)) {
        player.tell(Text.red('Not enough room for your ' + st.give + (st.give == 1 ? ' bundle' : ' bundles')
            + '. Make some room and click again; nothing is lost.'))
        return 'full'
    }
    data.putLong(CMP_GEN_PAID, st.paid + st.ready * CMP_GEN_TICKS)
    data.putString(CMP_GEN_DAY, cmpGenToday())
    data.putInt(CMP_GEN_TODAY, st.used + st.give)
    stacks.forEach(stack => player.give(stack))
    const summary = CMP_GEN_BUNDLE.map(entry => Item.of(entry[0], entry[1] * st.give))
    console.info('[generator] ' + player.getGameProfile().getName() + ' x' + st.give + (st.drop > 0 ? ' (dropped ' + st.drop + ' past the cap)' : ''))
    player.tell(Text.gold('Generator (' + st.give + (st.give == 1 ? ' bundle' : ' bundles') + '): ' + cmpGenWords(summary) + '.'))
    player.tell(Text.gray(st.left > 0
        ? 'Next bundle after ' + cmpGenMinutes(CMP_GEN_TICKS) + ' more online. ' + st.left + ' more today.'
        : "That was today's last bundle. More tomorrow (00:00 UTC)."))
    return 'gave'
}

// A native NeoForge listener, as numismatics.js uses: KubeJS's own BlockEvents.rightClicked is not posted for every
// click (it skips some, which the headless test showed). An error thrown here would not be caught by KubeJS and would
// crash the server, so everything is inside try.
const $CmpGenPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $CmpGenResult = Java.loadClass('net.minecraft.world.InteractionResult')
const $CmpGenRegs = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
NativeEvents.onEvent($CmpGenPriority.HIGH, 'net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
    try {
        if (event.getLevel().isClientSide()) return
        let state = event.getLevel().getBlockState(event.getPos())
        if (String($CmpGenRegs.BLOCK.getKey(state.getBlock())) != 'cmpcity:generator') return
        // nothing else happens on a click: no block goes against it, no item is used on it
        event.setCanceled(true)
        event.setCancellationResult($CmpGenResult.SUCCESS)
        if (String(event.getHand()) != 'MAIN_HAND') return
        let player = event.getEntity()
        // Deployers and turtles click as fake players: no automation pulls supply out.
        if (player == null || player instanceof $CmpGenFake || !player.isAlive()) return
        cmpGenClick(player)
    } catch (err) {
        console.error('generator (click): ' + err)
    }
})
