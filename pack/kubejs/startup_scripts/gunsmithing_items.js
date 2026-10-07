// CMP gunsmithing: the parts and tools a gun is made of (recipes in server_scripts/gunsmithing.js).
StartupEvents.registry('item', event => {
    const part = (id, name) => event.create('cmp:' + id).displayName(name)
    const tool = (id, name, uses) => event.create('cmp:' + id).displayName(name).maxDamage(uses).unstackable()

    // Tools: worn down by every deployer step that uses them.
    tool('boring_bar', 'Boring Bar', 24)
    tool('rifling_broach', 'Rifling Broach', 16)
    tool('milling_cutter', 'Milling Cutter', 24)

    // Barrels: a steel billet, bored, rifled and polished in one long line.
    part('billet_small', 'Small Steel Billet')
    part('billet_long', 'Long Steel Billet')
    part('billet_smooth', 'Smoothbore Billet')
    part('billet_heavy', 'Heavy Steel Billet')
    part('billet_precision', 'Precision Billet')
    part('incomplete_barrel', 'Unfinished Barrel')
    part('barrel_long', 'Long Barrel')
    part('barrel_smooth', 'Smoothbore Barrel')
    part('barrel_heavy', 'Heavy Barrel')
    part('barrel_precision', 'Precision Barrel')

    // Receiver: cut from a steel block, milled, hardened in a blasting fan, quenched.
    part('receiver_blank', 'Receiver Blank')
    part('incomplete_receiver', 'Unfinished Receiver')
    part('receiver_soft', 'Unhardened Receiver')
    part('receiver_hot', 'Glowing Receiver')
    part('receiver', 'Receiver')

    // Bolt (becomes the Firing Mechanism) and trigger parts.
    part('bolt_blank', 'Bolt Blank')
    part('incomplete_bolt', 'Unfinished Bolt')
    part('spring', 'Spring')
    part('firing_pin', 'Firing Pin')
    part('incomplete_trigger', 'Unfinished Trigger Group')

    // Wood.
    part('stock_blank', 'Stock Blank')
    part('incomplete_stock', 'Unfinished Stock')
    part('stock', 'Gun Stock')
    part('grip', 'Pistol Grip')

    // Final assembly.
    part('incomplete_gun', 'Unfinished Gun')
})
