// /kit: 2 sheep spawn eggs, for wool (hot air balloon envelopes), since most islands have no sheep.
// Every player can use it once every 24 hours, so losing your sheep (off the island edge, or into the
// void with you) never leaves you stuck for good. The time of the last use is kept in the player's
// KubeJS persistent data, which is saved with the player and kept through death (KubeJS copies it on
// respawn). A try that gives nothing (dead, no room) does not count.
const CMP_KIT_LAST_USE = 'cmp_kit_last_use' // Date.now() of the last /kit
const CMP_KIT_OLD_USES = 'cmp_kit_uses' // the old "twice ever" counter, dropped at the next /kit
const CMP_KIT_COOLDOWN = 24 * 60 * 60 * 1000
const CMP_KIT_ITEM = 'minecraft:sheep_spawn_egg'
const CMP_KIT_COUNT = 2

// Room in the 36 main slots, where give() puts things; whatever does not fit would drop at the
// player's feet, which on an island edge or an airship is the void.
function cmpKitHasRoom(player, stack) {
    const inv = player.inventory
    let room = 0
    for (let i = 0; i < 36; i++) {
        let slot = inv.getItem(i) // let: Rhino keeps the first value of a const declared in a loop
        if (slot.isEmpty()) room += stack.getMaxStackSize()
        else if (slot.getItem() == stack.getItem()) room += slot.getMaxStackSize() - slot.getCount()
    }
    return room >= stack.getCount()
}

// The wait until the next /kit, rounded up to the minute: "5h 12m", "3h" or "40m".
function cmpKitWait(ms) {
    const minutes = Math.ceil(ms / 60000)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h == 0) return m + 'm'
    return m == 0 ? h + 'h' : h + 'h ' + m + 'm'
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('kit').executes(ctx => {
        const player = ctx.source.player
        if (!player) {
            ctx.source.sendFailure(Text.of('Only players can use /kit.'))
            return 0
        }
        const data = player.persistentData
        const now = Date.now()
        // A last use "in the future" means the server clock was set back: count it as now, so the
        // wait never runs longer than 24 hours.
        if (data.getLong(CMP_KIT_LAST_USE) > now) data.putLong(CMP_KIT_LAST_USE, now)
        const wait = data.getLong(CMP_KIT_LAST_USE) + CMP_KIT_COOLDOWN - now
        if (wait > 0) {
            player.tell(Text.red('You can use /kit again in ' + cmpKitWait(wait) + '.'))
            return 0
        }
        if (!player.isAlive()) return 0
        const stack = Item.of(CMP_KIT_ITEM, CMP_KIT_COUNT)
        if (!cmpKitHasRoom(player, stack)) {
            player.tell(Text.red('Your inventory is full. Make some room and try /kit again.'))
            return 0
        }
        data.putLong(CMP_KIT_LAST_USE, now)
        data.remove(CMP_KIT_OLD_USES)
        player.give(stack)
        player.tell(Text.gold("Here's 2 sheep spawn eggs. Breed them with wheat for wool. "
            + 'You can use /kit again in 24 hours.'))
        return 1
    }))
})
