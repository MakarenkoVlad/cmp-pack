// /kit: 2 sheep spawn eggs, for wool (hot air balloon envelopes), and 2 chicken spawn eggs, for eggs and
// feathers, since most islands have neither, and a
// protection block, so nobody has to craft one before they can claim land. A team can only have one block
// placed, so the extra ones are spares (a team whose block is captured can put a new one down at once).
// Every player can use it once every 24 hours, so losing your sheep (off the island edge, or into the
// void with you) never leaves you stuck for good. The time of the last use is kept in the player's
// KubeJS persistent data, which is saved with the player and kept through death (KubeJS copies it on
// respawn). A try that gives nothing (dead, no room) does not count.
const CMP_KIT_LAST_USE = 'cmp_kit_last_use' // Date.now() of the last /kit
const CMP_KIT_OLD_USES = 'cmp_kit_uses' // the old "twice ever" counter, dropped at the next /kit
const CMP_KIT_COOLDOWN = 24 * 60 * 60 * 1000
const CMP_KIT_ITEMS = [['minecraft:sheep_spawn_egg', 2], ['minecraft:chicken_spawn_egg', 2], ['cmpwar:protection_block', 1]]
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
        player.tell(Text.gold("Here's 2 sheep spawn eggs, 2 chicken spawn eggs and a protection block. Breed the sheep with wheat for wool "
            + 'and the chickens with seeds for eggs and feathers, '
            + 'and place the block to claim land for your team (each team can have one placed). '
            + 'You can use /kit again in 24 hours.'))
        return 1
    }))
})

// /kit2: once a week, a farm starter for empty islands: more animals, a bee nest and one bee, one sapling, crops,
// water, grass and some food (the rest of the bees and trees are still to be found). Nothing for fighting, no ores, no Create parts and no coins. Same rules as /kit:
// its own last use in the player's KubeJS persistent data, and a try that gives nothing does not count.
const CMP_KIT2_LAST_USE = 'cmp_kit2_last_use' // Date.now() of the last /kit2
const CMP_KIT2_COOLDOWN = 7 * 24 * 60 * 60 * 1000
const CMP_KIT2_ITEMS = [
    ['minecraft:cow_spawn_egg', 2], ['minecraft:pig_spawn_egg', 2],
    ['minecraft:bee_nest', 1], ['minecraft:bee_spawn_egg', 1], // one bee: more have to be found
    ['minecraft:oak_sapling', 1], // one sapling: other trees have to be found
    ['minecraft:water_bucket', 1], ['minecraft:grass_block', 16], ['minecraft:bone', 8],
    ['minecraft:wheat_seeds', 8], ['minecraft:sugar_cane', 4], ['minecraft:potato', 4], ['minecraft:kelp', 1],
    ['minecraft:red_mushroom', 1], ['minecraft:brown_mushroom', 1],
    ['minecraft:torch', 16], ['minecraft:bread', 8],
]

// The wait in days for the weekly kit: "6d 4h", "2d" or, under a day, like /kit.
function cmpKit2Wait(ms) {
    const hours = Math.ceil(ms / 3600000)
    if (hours < 24) return cmpKitWait(ms)
    const d = Math.floor(hours / 24)
    const h = hours % 24
    return h == 0 ? d + 'd' : d + 'd ' + h + 'h'
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('kit2').executes(ctx => {
        const player = ctx.source.player
        if (!player) {
            ctx.source.sendFailure(Text.of('Only players can use /kit2.'))
            return 0
        }
        const data = player.persistentData
        const now = Date.now()
        if (data.getLong(CMP_KIT2_LAST_USE) > now) data.putLong(CMP_KIT2_LAST_USE, now)
        const wait = data.getLong(CMP_KIT2_LAST_USE) + CMP_KIT2_COOLDOWN - now
        if (wait > 0) {
            player.tell(Text.red('You can use /kit2 again in ' + cmpKit2Wait(wait) + '.'))
            return 0
        }
        if (!player.isAlive()) return 0
        const stacks = CMP_KIT2_ITEMS.map(entry => Item.of(entry[0], entry[1]))
        if (!cmpKitHasRoom(player, stacks)) {
            player.tell(Text.red('Not enough room: /kit2 needs ' + stacks.length + ' free slots. Make some room and try again.'))
            return 0
        }
        data.putLong(CMP_KIT2_LAST_USE, now)
        stacks.forEach(stack => player.give(stack))
        player.tell(Text.gold("Here's your weekly farm kit: cows, pigs, a bee nest and a bee, a sapling, crops, water, grass, "
            + 'bones, kelp, torches and some bread. You can use /kit2 again in 7 days.'))
        return 1
    }))
})
