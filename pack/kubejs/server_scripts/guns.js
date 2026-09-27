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
})
