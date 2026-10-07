// /kit: 2 sheep spawn eggs, for wool (hot air balloon envelopes), since most islands have no sheep, and a
// protection block, so nobody has to craft one before they can claim land. A team can only have one block
// placed, so the extra ones are spares (a team whose block is captured can put a new one down at once).
// Every player can use it once every 24 hours, so losing your sheep (off the island edge, or into the
// void with you) never leaves you stuck for good. The time of the last use is kept in the player's
// KubeJS persistent data, which is saved with the player and kept through death (KubeJS copies it on
// respawn). A try that gives nothing (dead, no room) does not count.
const CMP_KIT_LAST_USE = 'cmp_kit_last_use' // Date.now() of the last /kit
const CMP_KIT_OLD_USES = 'cmp_kit_uses' // the old "twice ever" counter, dropped at the next /kit
const CMP_KIT_COOLDOWN = 24 * 60 * 60 * 1000
const CMP_KIT_ITEMS = [['minecraft:sheep_spawn_egg', 2], ['cmpwar:protection_block', 1]]
const CmpKitStack = Java.loadClass('net.minecraft.world.item.ItemStack')

// Room in the 36 main slots, where give() puts things, for all the stacks at once; whatever does not
// fit would drop at the player's feet, which on an island edge or an airship is the void. Each stack
// first fills the slots that hold the same item (same components too, or it would not stack), and
// what is left needs empty slots.
function cmpKitHasRoom(player, stacks) {
    const inv = player.inventory
    let empty = 0
    for (let i = 0; i < 36; i++) if (inv.getItem(i).isEmpty()) empty++
    for (let s = 0; s < stacks.length; s++) {
        let stack = stacks[s] // let: Rhino keeps the first value of a const declared in a loop
        let left = stack.getCount()
        for (let i = 0; i < 36 && left > 0; i++) {
            let slot = inv.getItem(i)
            if (!slot.isEmpty() && CmpKitStack.isSameItemSameComponents(slot, stack)) left -= slot.getMaxStackSize() - slot.getCount()
        }
        if (left > 0) empty -= Math.ceil(left / stack.getMaxStackSize())
    }
    return empty >= 0
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
        const stacks = CMP_KIT_ITEMS.map(entry => Item.of(entry[0], entry[1]))
        if (!cmpKitHasRoom(player, stacks)) {
            player.tell(Text.red('Your inventory is full. Make some room and try /kit again.'))
            return 0
        }
        data.putLong(CMP_KIT_LAST_USE, now)
        data.remove(CMP_KIT_OLD_USES)
        stacks.forEach(stack => player.give(stack))
        player.tell(Text.gold("Here's 2 sheep spawn eggs and a protection block. Breed the sheep with wheat for wool, "
            + 'and place the block to claim land for your team (each team can have one placed). '
            + 'You can use /kit again in 24 hours.'))
        return 1
    }))
})
