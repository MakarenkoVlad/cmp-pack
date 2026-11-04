// CBC Military Supplement 2.1.4 adds three blocks it does not register (landing_indicator, dish_plate,
// round_dish_plate) to Create's create:wrench_pickup block tag. A tag that names a missing block does not load
// at all, so without this the whole tag was gone: a wrench could not pick up rails, redstone parts and the other
// blocks Create and the other mods list there ("Couldn't load tag create:wrench_pickup" in the server log).
ServerEvents.tags('block', event => {
    event.remove('create:wrench_pickup', [
        'cbcmoreshells:landing_indicator',
        'cbcmoreshells:dish_plate',
        'cbcmoreshells:round_dish_plate',
    ])
})
