// Season 2 bans (#27, #34) and the recipe audit (#33, below): no Ender Chests, Ender Pearls, Eyes of Ender, boats or
// chest boats, crafted or found; gunpowder only from sulfur, levitite only from the shop, no metal from rock or sand.
//
// Use is banned server-wide in pack/config/openpartiesandclaims-server.toml (completelyDisabledItemInteractions:
// ender chests, pearls, eyes, #minecraft:boats, #minecraft:chest_boats; completelyDisabledBlockInteractions: ender chests),
// in a claim or not: nobody throws a pearl (so no pearl stasis either), uses an eye, places a boat, or places or opens an
// Ender Chest. The block ban also stops one being mined, so a placed one would be an unbreakable block (linuxchr, 2026-11-05).
// Here every recipe that makes one goes, and EMI hides them (the c:hidden_from_recipe_viewers tag, as numismatics.js
// does). S2 has no loot chests (no structures), no endermen (cmpwar noHostileMobs) and no villagers, and Create Sifting
// left the pack in stage 1, so nothing else makes them.
// The borehead and its rockcutting wheel cut any block with no HP, no claim check and no raid, even in the city and through the
// offline shield (launch audit, 2026-11-05), so they stay out.
const CMP_S2_BANNED = [
    // No villagers this season (cmpwar [mobs] keptOut), so none of Easy Villagers' machines: the iron farm and the breeder are metal
    // from nothing, the rest have nothing to hold.
    'easy_villagers:iron_farm', 'easy_villagers:breeder', 'easy_villagers:converter', 'easy_villagers:auto_trader', 'easy_villagers:trader',
    'easy_villagers:farmer', 'easy_villagers:incubator',
    'minecraft:ender_chest', 'minecraft:ender_eye', 'minecraft:ender_pearl', '#minecraft:boats', '#minecraft:chest_boats', 'offroad:borehead_bearing', 'offroad:rockcutting_wheel',
    // Barrels, pressing tubs, taps and freezers are Frigulus's alone, so the city's alcohol market stays his (s2_drinks.js). A
    // shaker stays for sale: it mixes his drinks. The molotov stays out until it works on airships.
    'kaleidoscope_tavern:barrel', 'kaleidoscope_tavern:pressing_tub', 'kaleidoscope_tavern:tap', 'kaleidoscope_world_liquor:freezer',
    'kaleidoscope_tavern:molotov',
    // Minecart contraptions are out: moving machines stay in the city, each with its own check against plot lines, but this one
    // was taken out instead (Vlad, 2026-11-05). The same config line stops a creative copy being placed. No recipe takes one.
    'create:cart_assembler',
    // FTB Quests is here for its Quest Book alone. Its task screens can be set Indestructible by the crew that places one
    // and a 3x3 to 7x7 screen puts its other blocks down across plot and claim lines: a wall nobody can mine. The
    // configurator and the loot crate opener have no use without them (no loot crates, no rewards). The book keeps its recipe.
    'ftbquests:screen_1', 'ftbquests:screen_3', 'ftbquests:screen_5', 'ftbquests:screen_7', 'ftbquests:task_screen_configurator',
    'ftbquests:loot_crate_opener',
    // The Grappling Hook Mod (2026-11-13) stays for its hook, double hook, motor, magnet and long fall boots. Two of its gadgets
    // are out: the Ender Staff costs 2 amethyst and a stick after the pearl swap and throws its holder about 25 blocks, and the
    // Porta-Rocket is flight for 3 iron and a firework. Both run on the player's own game, so no server setting limits them.
    'grapplemod:ender_staff', 'grapplemod:rocket',
    // Simulated Addition's Floatite and Ballasite: their recipes take things the season has no source of, and Floatite is hull
    // material for boats. Shown with no recipe rather than with one nobody can finish.
    'simulated_addition:floatite', 'simulated_addition:ballasite',
    // No water wheels this season (Vlad, 2026-11-13: "waterwheels remove them"). Only their two recipes go, so a wheel that
    // already stands keeps turning and one in a chest can still be placed. Nothing else takes a wheel but the large wheel
    // and a crushing recipe that turns one into wood chips. Hand cranks, windmills and engines are what is left.
    'create:water_wheel', 'create:large_water_wheel'
    // The Re-Packager (create:repackager) was in this list for a day, 2026-11-11: an order short of its items still left
    // as a full package, so metal came from nothing (Create #8082, #8600, #8155). It is back since cmpfixes 0.38.7, which
    // lets a Re-Packager send out only what came in (cmpfixes/README.md, "A Re-Packager makes items out of nothing").
    // If a server ever says at its start that the Re-Packager guard does not fit, it goes back in here and in the OPAC
    // config's completelyDisabledItemInteractions.
]

ServerEvents.recipes(event => {
    CMP_S2_BANNED.forEach(output => event.remove({ output: output }))
    // The smithing upgrades that put the two banned gadgets onto a hook.
    event.remove({ id: 'grapplemod:smithing/hook_ender' })
    event.remove({ id: 'grapplemod:smithing/hook_rocket' })
    // Lava stays /kit-only: it is thruster and burner fuel, and these two turned cobblestone into it, endless without an oil
    // vein. No other recipe in the pack makes lava (Create's Alex's Mobs lava bottle needs a mod the pack doesn't have).
    event.remove({ id: 'create:mixing/lava_from_cobble' })
    event.remove({ id: 'createdieselgenerators:bulk_fermenting/lava' })
    // Amethyst takes the pearl's and the eye's place in every recipe that used one: the chunk loader (pearl), the
    // wireless modem (pearl) and the advanced modem (eye) (#34), and anything else, which would otherwise have no
    // source at all.
    event.replaceInput({ input: 'minecraft:ender_pearl' }, 'minecraft:ender_pearl', 'minecraft:amethyst_shard')
    event.replaceInput({ input: 'minecraft:ender_eye' }, 'minecraft:ender_eye', 'minecraft:amethyst_shard')
    // Recipe audit (#33, stage 2): the Nether is locked, so nothing gives netherrack, and the empty blaze burner needs
    // one. Charcoal stands in. That makes the Diesel Generators liquid burner (the refinery's heat, #5) craftable; a
    // blaze burner still needs a blaze to work, and filled ones come from the shop only.
    event.replaceInput({ output: 'create:empty_blaze_burner' }, '#c:netherracks', 'minecraft:charcoal')
    // Survival cannon parts don't join until welded, and casting is out, so the welder is the only way to a cast iron, steel or bronze
    // cannon. It took a filled burner, 16 Cog in the shop: an empty one instead (progression audit, 2026-11-05). Both of its recipes.
    event.replaceInput({ output: 'createbigcannons:cannon_welder' }, 'create:blaze_burner', 'create:empty_blaze_burner')
    // Bronze alloys took cinder flour, which needs netherrack: 43 items out of reach (same audit).
    event.replaceInput({ output: 'createbigcannons:bronze_ingot' }, 'create:cinder_flour', 'minecraft:charcoal')
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
    event.replaceInput({ input: 'minecraft:glowstone_dust' }, 'minecraft:glowstone_dust', 'cmpveins:sulfur')
    event.replaceInput({ input: 'minecraft:blaze_powder' }, 'minecraft:blaze_powder', 'cmpveins:sulfur')

    // Gunpowder comes only from sulfur and charcoal in a mixer (#7, #31; the recipe is in s2_deposits.js). Out go
    // Create's cinder flour + harming potion filling and the 25% gunpowder from washing crushed zinc (the wash keeps its
    // 9 zinc nuggets). Kept: the two round trips that only give gunpowder back (Big Cannons' 9 pinches, Immersive
    // TaCZ's gunpowder fluid pressed back into gunpowder). No mob drops any: cmpwar's noHostileMobs keeps creepers,
    // witches and ghasts out, there are no loot chests, and wandering traders are off (the city build sets
    // doTraderSpawning false).
    // Create: Connected's smoking catalyst took netherrack on an empty fan catalyst, and the Nether is locked: coal or charcoal
    // makes it instead (Vlad, 2026-11-07).
    event.remove({ id: 'create_connected:item_application/smoking_catalyst_from_empty' })
    event.custom({
        type: 'create:item_application',
        ingredients: [{ item: 'create_connected:empty_fan_catalyst' }, { tag: 'minecraft:coals' }],
        results: [{ id: 'create_connected:fan_smoking_catalyst' }],
    }).id('cmp:s2/item_application/smoking_catalyst_from_coal')
    // Its sanding catalyst took plain sand only: red sand works too (Vlad, 2026-11-07).
    event.remove({ id: 'create_connected:item_application/sanding_catalyst_from_empty' })
    event.custom({
        type: 'create:item_application',
        ingredients: [{ item: 'create_connected:empty_fan_catalyst' }, [{ item: 'minecraft:sand' }, { item: 'minecraft:red_sand' }]],
        results: [{ id: 'create_connected:fan_sanding_catalyst' }],
    }).id('cmp:s2/item_application/sanding_catalyst_from_sand')
    event.remove({ id: 'create:filling/gunpowder' })
    cmpS2Rewash(event, 'crushed_raw_zinc', 'create:crushed_raw_zinc', [{ id: 'create:zinc_nugget', count: 9 }])

    // Levitite only from the shop (#19): no recipe makes levitite blend (the fluid that sets into levitite).
    event.remove({ id: 'aeronautics:mixing/levitite_blend' })
    event.remove({ output: 'aeronautics:levitite' })
    event.remove({ output: 'aeronautics:pearlescent_levitite' })
    // The Gyroscope only from the shop, at a high price (Vlad, 2026-11-05: "disable gyroscopes and make them buyable in shop"). No recipe
    // needs one. The Gyroscopic Propeller Bearing, the gyroscopic mechanism and the gearbox are other items and stay craftable.
    event.remove({ output: 'aeroworks:gyroscope' })

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
    'farmersdelight:cooking/noodle_soup', 'farmersdelight:kelp_roll', 'farmersdelight:cutting/kelp_roll',
    'farmersdelight:rice_roll_medley_block', 'crabbersdelight:cooking/stuffed_nautilus_shell', 'crabbersdelight:kelp_shake',
]
// A crab trap runs on its own, so what it catches must not become a metal or a vein's material: its cans would smelt into iron
// and its fish bones into bone meal.
const CMP_S2_TRAP_SCRAP = ['crabbersdelight:iron_nugget_from_smelting_can', 'crabbersdelight:bone_meal_from_fish_bones']

ServerEvents.recipes(event => {
    CMP_S2_KELP_FOOD_RECIPES.forEach(id => event.remove({ id: id }))
    CMP_S2_TRAP_SCRAP.forEach(id => event.remove({ id: id }))
    CMP_S2_KELP.forEach(id => event.remove({ output: id }))
    CMP_S2_KELP.forEach(id => event.replaceInput({ input: id }, id, 'cmpveins:rubber'))
    // replaceInput cannot reach this mod's own recipe type, so it is made again with rubber.
    event.remove({ id: 'aeroworks:wheel_module_from_styles' })
    event.custom({
        type: 'aeroworks:transform_module',
        category: 'misc',
        ingredients: [{ tag: 'aeroworks:wheel_modules' }, { item: 'cmpveins:rubber' }],
        result: { id: 'aeroworks:wheel_module', count: 1 }
    }).id('cmp:s2/wheel_module_from_styles')
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_S2_BANNED)
    // Nothing makes these shells in Season 2 (same audit): 294 items that only fill the recipe viewers.
    event.add('c:hidden_from_recipe_viewers', /^cbcmoreshells:/)
    event.add('c:hidden_from_recipe_viewers', CMP_S2_KELP.concat(['chipped:dried_kelp_block', 'farmersdelight:kelp_roll',
        'farmersdelight:kelp_roll_slice', 'farmersdelight:rice_roll_medley_block', 'farmersdelight:noodle_soup',
        'crabbersdelight:stuffed_nautilus_shell', 'crabbersdelight:kelp_shake']))
})
