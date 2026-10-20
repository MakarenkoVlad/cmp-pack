// CMP guns: only guns that are built with Create. Create: Immersive TaCZ Integration adds Create
// recipes (mechanical crafting, sequenced assembly, mixing) for the Create Armorer gun pack's guns,
// ammo and attachments. Everything TaCZ makes at its own gun tables goes, which removes TaCZ's
// modern guns (AK-47, M4 and so on) from survival.
ServerEvents.recipes(event => {
    event.remove({ type: 'tacz:gun_smith_table_crafting' })
    // The gun tables themselves have nothing left to make.
    event.remove({ id: 'tacz:gun_smith_table' })
    event.remove({ id: 'tacz:ammo_workbench' })
    event.remove({ id: 'tacz:attachment_workbench' })
    // TaCZ's hand-crafted gunpowder (flint, sugar, charcoal) would skip the Create gunpowder chain.
    event.remove({ id: 'tacz:gunpowder' })
    // Makes an "atomic" melee weapon that this Create Armorer version does not have: a broken item.
    event.remove({ id: 'createimmersivetacz:guns/special_melee_atomic' })
    // The Create Armorer wrench (a melee "gun") is out of the game, with the spike that only fits it. The
    // unmelee_wrench recipe turned it back into a Create wrench; its 1.20-style "nbt" filter is ignored on
    // 1.21, so it also ate any other gun put in the crafter.
    event.remove({ id: 'createimmersivetacz:guns/melee_wrench' })
    event.remove({ id: 'createimmersivetacz:guns/unmelee_wrench' })
    event.remove({ id: 'createimmersivetacz:attachments/wrench_iron_spike' })
})

// Removed Create Armorer items that players already have: once a second each player's inventory is checked
// and the Armorer wrench becomes the Create wrench it was made from, a spike becomes the 3 iron ingots it
// cost, and the wrench's melee "ammo" goes. Items in chests are swapped when a player takes them.
// Loot never holds them (NEVER_TACZ in loot.js) and JEI hides them (client_scripts/guns.js).
const CmpGunsDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const CMP_REMOVED_TACZ = {
    'tacz:modern_kinetic_gun': { key: 'GunId', ids: { 'create_armorer:special_melee_wrench': ['create:wrench', 1] } },
    'tacz:attachment': { key: 'AttachmentId', ids: { 'create_armorer:muzzle_refit_iron_spike': ['minecraft:iron_ingot', 3] } },
    'tacz:ammo': { key: 'AmmoId', ids: { 'create_armorer:melee_weapon': null } },
}

// [refund id, count per item], null for no refund, or undefined when the stack is not a removed item.
function cmpRemovedTacz(stack) {
    if (stack.isEmpty()) return undefined
    let kind = CMP_REMOVED_TACZ[String(stack.getId())]
    if (!kind) return undefined
    let data = stack.get(CmpGunsDataComponents.CUSTOM_DATA)
    if (data == null) return undefined
    let id = String(data.copyTag().getString(kind.key))
    return Object.prototype.hasOwnProperty.call(kind.ids, id) ? kind.ids[id] : undefined
}

// Swaps the removed items in one player's inventory; returns how many stacks it swapped.
function cmpSwapRemovedTacz(player) {
    let inventory = player.getInventory()
    let swapped = 0
    for (let slot = 0; slot < inventory.getContainerSize(); slot++) {
        let stack = inventory.getItem(slot)
        let refund = cmpRemovedTacz(stack)
        if (refund === undefined) continue
        let id = String(stack.getId())
        let count = stack.getCount()
        if (refund != null && refund[1] == 1 && count == 1) {
            inventory.setItem(slot, Item.of(refund[0]))
        } else {
            inventory.setItem(slot, Item.empty)
            if (refund != null) player.give(Item.of(refund[0], count * refund[1]))
        }
        swapped++
        console.info('CMP guns: swapped a removed Create Armorer item (' + id + ' x' + count + ') for ' + player.getGameProfile().getName())
    }
    return swapped
}

ServerEvents.tick(event => {
    let server = event.getServer()
    if (server.getTickCount() % 20 != 0) return
    server.getPlayerList().getPlayers().forEach(player => cmpSwapRemovedTacz(player))
})
