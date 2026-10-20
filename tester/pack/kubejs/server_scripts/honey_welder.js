// Sable Photomancy's honey welder does nothing by itself; Synaxis gives it a weld panel, and that panel can
// slide a physics structure up to 1,000,000 blocks along an axis, with whoever stands on it. On 2026-10-03 a
// player ended up a million blocks in the air that way. It is turned off: no recipe, the
// c:hidden_from_recipe_viewers tag keeps it out of EMI and JEI, and a welder that a player already has is
// taken out of their inventory for the parts it was crafted from. Both mods only run a weld for a player
// who holds a welder, so without the item the panel cannot be used. Welds made before stay as they are.
const CMP_WELDER = 'sable_schematic_api:honey_welder'
// One welder's recipe, handed back for each welder taken.
const CMP_WELDER_PARTS = [['create:brass_sheet', 4], ['create:electron_tube', 1], ['minecraft:glass_bottle', 1],
    ['minecraft:chain', 1]]

ServerEvents.recipes(event => {
    event.remove({ output: CMP_WELDER })
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_WELDER)
})

// Every slot: the 36 main ones, armor and the off hand.
function cmpTakeWelders(player) {
    const inv = player.inventory
    let taken = 0
    for (let i = 0; i < inv.getContainerSize(); i++) {
        let slot = inv.getItem(i) // let: Rhino keeps the first value of a const declared in a loop
        if (slot.isEmpty() || String(slot.id) != CMP_WELDER) continue
        taken += slot.getCount()
        inv.removeItemNoUpdate(i)
    }
    if (taken == 0) return
    CMP_WELDER_PARTS.forEach(part => player.give(Item.of(part[0], part[1] * taken)))
    player.tell(Text.red('The honey welder is turned off on this server. Yours was taken and you got its parts back.'))
    console.info('honey welder: took ' + taken + ' from ' + player.username)
}

PlayerEvents.loggedIn(event => cmpTakeWelders(event.player))

// A welder picked up, taken out of a chest or pulled from the creative tab.
PlayerEvents.inventoryChanged(event => {
    if (String(event.item.id) == CMP_WELDER) cmpTakeWelders(event.player)
})
