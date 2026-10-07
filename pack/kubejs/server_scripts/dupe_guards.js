// Dupes that are open on this pack's versions and that no mod here fixes yet, closed only where that costs
// players nothing (checked on 2026-10-06).

ServerEvents.tags('block', event => {
    // Create 6.0.10: the clipboard counts as safe NBT, so a hand-edited schematic carries any item data in it
    // (Sharpness 255 gear, filled shulkers) into the world (Create #10733, #10373).
    event.remove('create:safe_nbt', 'create:clipboard')
})
