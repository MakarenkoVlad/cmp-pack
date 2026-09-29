// /kit: 2 sheep spawn eggs, for wool (hot air balloon envelopes), since most islands have no sheep.
// Every player can use it twice: the second time is for when the first pair falls off the island.
// Uses are counted in the player's KubeJS persistent data, which is saved with the player and kept
// through death (KubeJS copies it on respawn). A try that gives nothing (dead, no room) does not count.
const CMP_KIT_USES = 'cmp_kit_uses'
const CMP_KIT_MAX_USES = 2
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

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('kit').executes(ctx => {
        const player = ctx.source.player
        if (!player) {
            ctx.source.sendFailure(Text.of('Only players can use /kit.'))
            return 0
        }
        const data = player.persistentData
        const used = data.getInt(CMP_KIT_USES)
        if (used >= CMP_KIT_MAX_USES) {
            player.tell(Text.red("You've already used /kit twice."))
            return 0
        }
        if (!player.isAlive()) return 0
        const stack = Item.of(CMP_KIT_ITEM, CMP_KIT_COUNT)
        if (!cmpKitHasRoom(player, stack)) {
            player.tell(Text.red('Your inventory is full. Make some room and try /kit again.'))
            return 0
        }
        data.putInt(CMP_KIT_USES, used + 1)
        player.give(stack)
        const left = CMP_KIT_MAX_USES - used - 1
        player.tell(Text.gold("Here's 2 sheep spawn eggs. Breed them with wheat for wool. "
            + (left > 0 ? 'You can use /kit ' + left + ' more time.' : 'That was your last /kit.')))
        return 1
    }))
})
