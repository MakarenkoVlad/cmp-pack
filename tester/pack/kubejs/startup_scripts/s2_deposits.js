// Season 2: the raw materials that come only from Create: Rock & Stone deposits, and the deposits themselves.
// Registered on both client and server startup; adding or renaming one needs a full restart and a new pack.
//
// Items: sulfur (mixed with charcoal into gunpowder), latex (mixed into rubber), rubber (belts, spouts, hose
// pulleys; it replaces Create: Ages' cured rubber), oil sand (melted into crude oil), and the pressed mechanism
// that replaces Ages' andesite mechanism in the cast iron and bronze cannon mechanisms. Their recipes are in
// server_scripts/s2_deposits.js.
//
// Deposits: one create_rns:deposit block per S2 deposit type. Each gives only its own output (the mining
// recipes in server_scripts/s2_deposits.js), never runs out (Rock & Stone's infiniteDeposits, on by default)
// and cannot be moved (movableDeposits, off by default). They never generate: generate-structures=false stops
// Rock & Stone's own deposit structures, and staff place these blocks from the site list
// (worldgen/s2/sites.json, turned into function files by worldgen/s2/sites.py).
StartupEvents.registry('item', event => {
    const items = [
        { id: 'sulfur', name: 'Sulfur', texture: 'minecraft:item/glowstone_dust', color: 0xd8d23a,
          tooltip: 'From sulfur deposits. Mix with charcoal for gunpowder.' },
        { id: 'latex', name: 'Latex', texture: 'minecraft:item/slime_ball', color: 0xefe9d6,
          tooltip: 'From latex deposits. Mix it into rubber.' },
        { id: 'rubber', name: 'Rubber', texture: 'minecraft:item/dried_kelp', color: 0x3a3a3a,
          tooltip: 'Belts, spouts and hose pulleys.' },
        { id: 'oil_sand', name: 'Oil Sand', texture: 'minecraft:item/clay_ball', color: 0x3b2f22,
          tooltip: 'From oil deposits. Melt it into crude oil in a heated mixer.' },
        { id: 'pressed_mechanism', name: 'Pressed Mechanism', texture: 'create:item/precision_mechanism', color: 0x9a9a8e,
          tooltip: 'Pressed from andesite alloy. The base of cast iron and bronze cannon mechanisms.' }
    ]
    items.forEach(item => {
        event.create('kubejs:' + item.id)
            .displayName(item.name)
            .texture(item.texture)
            .color(0, item.color)
            .tooltip(item.tooltip)
    })
})

// The deposit types. `texture` borrows one of Rock & Stone's own deposit textures, so a player sees an ore deposit.
// Keep this list and DEPOSITS in server_scripts/s2_deposits.js and worldgen/s2/sites.json in step.
StartupEvents.registry('block', event => {
    const deposits = [
        { id: 'veridium', name: 'Veridium', texture: 'copper' },
        { id: 'ochrum', name: 'Ochrum', texture: 'gold' },
        { id: 'crimsite', name: 'Crimsite', texture: 'iron' },
        { id: 'asurine', name: 'Asurine', texture: 'zinc' },
        { id: 'bone_meal', name: 'Bone Meal', texture: 'quartz' },
        { id: 'sulfur', name: 'Sulfur', texture: 'uranium' },
        { id: 'oil', name: 'Oil', texture: 'coal' },
        { id: 'latex', name: 'Latex', texture: 'silver' }
    ]
    deposits.forEach(deposit => {
        event.create('kubejs:' + deposit.id + '_deposit', 'create_rns:deposit')
            .displayName(deposit.name + ' Deposit')
            .texture('create_rns:block/' + deposit.texture + '_deposit_block')
    })
})
