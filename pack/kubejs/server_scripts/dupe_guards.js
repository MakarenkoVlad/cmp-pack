// Dupes that are open on this pack's versions and that no mod here fixes yet, closed only where that costs
// players nothing (checked on 2026-10-06).

ServerEvents.tags('block', event => {
    // Create 6.0.10: the clipboard counts as safe NBT, so a hand-edited schematic carries any item data in it
    // (Sharpness 255 gear, filled shulkers) into the world (Create #10733, #10373).
    event.remove('create:safe_nbt', 'create:clipboard')
    // Simulated 1.3.2: the Steering Wheel counts as safe NBT too, and it reads GeneratedSpeed from its saved data with
    // no limit, so a hand-edited schematic prints a wheel that makes any amount of stress for nothing (Simulated #1430,
    // the "infinite energy" builds a playtester reported on 2026-11-10). A printed wheel now comes out at rest.
    event.remove('create:safe_nbt', 'simulated:steering_wheel')
})
