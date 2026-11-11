// Season 2 ships at sea (When Dungeons Arise: Seven Seas, placed by worldgen/s2/ships.py). Their own chests hold vanilla loot, diamonds
// and all, so every roll here throws that away and gives working parts: a side reward for exploring that never beats a vein (Frigulus,
// 2026-11-06: "more advanced tech, not as op as giving thrusters"). Further out the ships are bigger and have more treasure rooms.
// Each list: [item, least, most]. CMP_SHIP_ROLLS says how many lines a container of that kind gets. Test numbers: tune them with playtesters.
const CMP_SHIP_ROLLS = { barrels: [1, 3], normal: [2, 3], supply: [2, 4], treasure: [2, 3] }
const CMP_SHIP_LOOT = {
    barrels: [['minecraft:charcoal', 4, 12], ['create:andesite_alloy', 4, 10], ['minecraft:copper_ingot', 2, 6], ['minecraft:iron_ingot', 2, 5],
        ['create:shaft', 4, 8], ['create:cogwheel', 2, 6], ['minecraft:gunpowder', 2, 6], ['cmpveins:rubber', 1, 4]],
    normal: [['minecraft:iron_ingot', 3, 8], ['minecraft:copper_ingot', 3, 8], ['create:zinc_ingot', 2, 4], ['create:fluid_pipe', 4, 8], ['create:gearbox', 1, 2],
        ['create:belt_connector', 2, 4], ['create:mechanical_pump', 1, 1], ['create:clutch', 1, 2], ['create:gearshift', 1, 2], ['create:depot', 1, 2]],
    supply: [['createdieselgenerators:diesel_bucket', 1, 1], ['cmpveins:sulfur', 4, 8], ['minecraft:gunpowder', 8, 16], ['create:fluid_tank', 2, 4],
        ['create:encased_fan', 1, 2], ['create:large_cogwheel', 2, 4]],
    treasure: [['create:rotation_speed_controller', 1, 1], ['create:fluid_tank', 4, 8], ['create:mechanical_bearing', 1, 2], ['create:electron_tube', 2, 4],
        ['create:precision_mechanism', 1, 1], ['minecraft:gold_ingot', 3, 8], ['create:brass_ingot', 4, 8], ['create:stressometer', 1, 1]]
}
const CMP_SHIP_TABLES = /^dungeons_arise_seven_seas:chests\/[a-z_]+\/[a-z_]+?_(barrels|normal|supply|treasure)(_lower|_upper)?$/

function cmpShipFill(id, loot) {
    const match = CMP_SHIP_TABLES.exec(id)
    if (!match) return
    const kind = match[1]
    const lines = CMP_SHIP_LOOT[kind]
    const rolls = CMP_SHIP_ROLLS[kind]
    const count = rolls[0] + Math.floor(Math.random() * (rolls[1] - rolls[0] + 1))
    loot.clear()
    for (let i = 0; i < count; i++) {
        let line = lines[Math.floor(Math.random() * lines.length)]
        loot.addItem(Item.of(line[0], line[1] + Math.floor(Math.random() * (line[2] - line[1] + 1))))
    }
}

LootJS.modifiers(event => {
    event.addTableModifier(LootType.CHEST).customAction((ctx, loot) => {
        // An error thrown here would take the chest's whole roll with it.
        try {
            cmpShipFill(String(ctx.getQueriedLootTableId()), loot)
        } catch (e) {
            console.error('ship loot: ' + e)
        }
    })
})
