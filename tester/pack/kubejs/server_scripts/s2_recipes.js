// Season 2 bans (#27, #34) and the recipe audit (#33, below): no Ender Chests, Ender Pearls, Eyes of Ender, boats or
// chest boats, crafted or found; gunpowder only from sulfur, levitite only from the shop, no metal from rock or sand.
//
// Use is banned server-wide in pack/config/openpartiesandclaims-server.toml (completelyDisabledItemInteractions:
// pearls, eyes, #minecraft:boats, #minecraft:chest_boats; completelyDisabledBlockInteractions: ender chests), in a
// claim or not: nobody throws a pearl (so no pearl stasis either), uses an eye, places a boat or opens an Ender Chest.
// Here every recipe that makes one goes, and EMI hides them (the c:hidden_from_recipe_viewers tag, as numismatics.js
// does). S2 has no loot chests (no structures), no endermen (cmpwar noHostileMobs) and no villagers, and Create Sifting
// left the pack in stage 1, so nothing else makes them.
// The borehead and its rockcutting wheel cut any block with no HP, no claim check and no raid, even in the city and through the
// offline shield (launch audit, 2026-11-05), so they stay out.
const CMP_S2_BANNED = ['minecraft:ender_chest', 'minecraft:ender_eye', 'minecraft:ender_pearl', '#minecraft:boats', '#minecraft:chest_boats', 'offroad:borehead_bearing', 'offroad:rockcutting_wheel']

ServerEvents.recipes(event => {
    CMP_S2_BANNED.forEach(output => event.remove({ output: output }))
    // Amethyst takes the pearl's and the eye's place in every recipe that used one: the chunk loader (pearl), the
    // wireless modem (pearl) and the advanced modem (eye) (#34), and anything else, which would otherwise have no
    // source at all.
    event.replaceInput({ input: 'minecraft:ender_pearl' }, 'minecraft:ender_pearl', 'minecraft:amethyst_shard')
    event.replaceInput({ input: 'minecraft:ender_eye' }, 'minecraft:ender_eye', 'minecraft:amethyst_shard')
    // Recipe audit (#33, stage 2): the Nether is locked, so nothing gives netherrack, and the empty blaze burner needs
    // one. Charcoal stands in. That makes the Diesel Generators liquid burner (the refinery's heat, #5) craftable; a
    // blaze burner still needs a blaze to work, and filled ones come from the shop only.
    event.replaceInput({ output: 'create:empty_blaze_burner' }, '#c:netherracks', 'minecraft:charcoal')
    // No coal ore on the islands: 9 charcoal press into a coal block ("charcoal for coal", #33). The Aeronautics hot-air
    // burner takes a coal block (tag aeronautics:burner_fire), and the block crafts back into coal for anything else.
    event.shapeless('minecraft:coal_block', ['9x minecraft:charcoal']).id('cmp:s2/coal_block_from_charcoal')

    // Mineral stand-ins (#33): the islands have no ores and the Nether is locked, so these minerals have no source.
    // Each is swapped in every recipe for an item a crew gets: amethyst (generators and deposits) for lapis, sulfur (deposits) for
    // glowstone dust and blaze powder. Lapis unblocks Power Grid's integrated circuit, which computercraft.js puts in
    // every CC advanced recipe (advanced computers, turtles, pocket computers, the advanced modem); glowstone the
    // tracer tip and Power Grid's lamps and tubes; blaze powder the tracer tip, HEI autocannon rounds and congealed
    // nitro. Quartz needs no stand-in: the generators give the first of it (s2_generators.js) and Create's crushing of diorite
    // (the islands' rock blobs) the rest. Diamond, emerald,
    // netherite and the other Nether and End minerals stay without a source (tools, armour, beacons).
    event.replaceInput({ input: 'minecraft:lapis_lazuli' }, 'minecraft:lapis_lazuli', 'minecraft:amethyst_shard')
    event.replaceInput({ input: 'minecraft:glowstone_dust' }, 'minecraft:glowstone_dust', 'kubejs:sulfur')
    event.replaceInput({ input: 'minecraft:blaze_powder' }, 'minecraft:blaze_powder', 'kubejs:sulfur')

    // Gunpowder comes only from sulfur and charcoal in a mixer (#7, #31; the recipe is in s2_deposits.js). Out go
    // Create's cinder flour + harming potion filling and the 25% gunpowder from washing crushed zinc (the wash keeps its
    // 9 zinc nuggets). Kept: the two round trips that only give gunpowder back (Big Cannons' 9 pinches, Immersive
    // TaCZ's gunpowder fluid pressed back into gunpowder). No mob drops any: cmpwar's noHostileMobs keeps creepers,
    // witches and ghasts out, there are no loot chests, and wandering traders are off (the city build sets
    // doTraderSpawning false).
    event.remove({ id: 'create:filling/gunpowder' })
    cmpS2Rewash(event, 'crushed_raw_zinc', 'create:crushed_raw_zinc', [{ id: 'create:zinc_nugget', count: 9 }])

    // Levitite only from the shop (#19): no recipe makes levitite blend (the fluid that sets into levitite).
    event.remove({ id: 'aeronautics:mixing/levitite_blend' })
    event.remove({ output: 'aeronautics:levitite' })
    event.remove({ output: 'aeronautics:pearlescent_levitite' })

    // No metal from rock or sand (#34): metal comes from the deposits and the generators. Washing gravel, red sand and
    // soul sand and grinding tuff keep their other outputs and lose their nuggets.
    cmpS2Rewash(event, 'gravel', 'minecraft:gravel', [{ id: 'minecraft:flint', chance: 0.25 }])
    cmpS2Rewash(event, 'red_sand', 'minecraft:red_sand', [{ id: 'minecraft:dead_bush', chance: 0.05 }])
    cmpS2Rewash(event, 'soul_sand', 'minecraft:soul_sand', [{ id: 'minecraft:quartz', count: 4, chance: 0.125 }])
    event.remove({ id: 'create:milling/tuff' })
    event.remove({ id: 'create:crushing/tuff' })
    event.remove({ id: 'create:crushing/tuff_recycling' })
    event.custom({
        type: 'create:milling', ingredients: [{ item: 'minecraft:tuff' }], processing_time: 150,
        results: [{ id: 'minecraft:flint', chance: 0.25 }]
    }).id('cmp:s2/milling/tuff')
    event.custom({
        type: 'create:crushing', ingredients: [{ tag: 'create:stone_types/tuff' }], processing_time: 350,
        results: [{ id: 'minecraft:flint', chance: 0.25 }]
    }).id('cmp:s2/crushing/tuff')
})

// Create's washing recipe create:splashing/<name> again as cmp:s2/splashing/<name>, with only these results.
function cmpS2Rewash(event, name, input, results) {
    event.remove({ id: 'create:splashing/' + name })
    event.custom({ type: 'create:splashing', ingredients: [{ item: input }], results: results }).id('cmp:s2/splashing/' + name)
}

// No kelp in Season 2 (Vlad, 2026-11-04: "remove kelp from the game", option A): the sea grows none (build.py S2_REMOVED)
// and /kit2 gives none. Rubber takes its place in every machine recipe; one rubber also replaces a dried kelp block, as
// in the hose and elevator pulleys. The foods that need kelp go, since rubber is no food.
const CMP_S2_KELP = ['minecraft:kelp', 'minecraft:dried_kelp', 'minecraft:dried_kelp_block']
const CMP_S2_KELP_FOOD_RECIPES = [
    'brewinandchewin:fermenting/kimchi', 'brewinandchewin:fermenting/kippers', 'brewinandchewin:fermenting/salty_folly_from_vodka',
    'farmersdelight:cooking/noodle_soup', 'farmersdelight:kelp_roll', 'farmersdelight:cutting/kelp_roll',
    'farmersdelight:rice_roll_medley_block',
    'farmerspizzeria:dough_add_dried_kelp', 'farmerspizzeria:dough_add_cod', 'farmerspizzeria:dough_add_salmon',
    'farmerspizzeria:dough_cod_add_salmon', 'farmerspizzeria:dough_salmon_add_cod',
    'create:dough_add_dried_kelp', 'create:dough_dried_kelp_add_cod', 'create:dough_dried_kelp_add_salmon',
    'create:dough_cod_add_salmon', 'create:dough_salmon_add_cod',
]

ServerEvents.recipes(event => {
    CMP_S2_KELP_FOOD_RECIPES.forEach(id => event.remove({ id: id }))
    CMP_S2_KELP.forEach(id => event.remove({ output: id }))
    CMP_S2_KELP.forEach(id => event.replaceInput({ input: id }, id, 'kubejs:rubber'))
    // replaceInput cannot reach this mod's own recipe type, so it is made again with rubber.
    event.remove({ id: 'aeroworks:wheel_module_from_styles' })
    event.custom({
        type: 'aeroworks:transform_module',
        category: 'misc',
        ingredients: [{ tag: 'aeroworks:wheel_modules' }, { item: 'kubejs:rubber' }],
        result: { id: 'aeroworks:wheel_module', count: 1 }
    }).id('cmp:s2/wheel_module_from_styles')
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_S2_BANNED)
    event.add('c:hidden_from_recipe_viewers', CMP_S2_KELP.concat(['chipped:dried_kelp_block', 'farmersdelight:kelp_roll',
        'farmersdelight:kelp_roll_slice', 'farmersdelight:rice_roll_medley_block', 'farmersdelight:noodle_soup',
        'brewinandchewin:kimchi', 'brewinandchewin:kippers', 'farmerspizzeria:dough_dried_kelp',
        'farmerspizzeria:dough_dried_kelp_cod', 'farmerspizzeria:dough_dried_kelp_salmon',
        'farmerspizzeria:raw_abyssal_marinara_pizza', 'farmerspizzeria:abyssal_marinara_pizza']))
})
