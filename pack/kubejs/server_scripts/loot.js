// CMP Season 1 structure loot (LootJS 3.7 on KubeJS).
//
// The loot of the structure mods, sorted into six tiers from the island-top ruins to the airship-only
// sky fortresses: Create, Create: Ages, Aeronautics, Create Big Cannons and Create Armorer loot that is
// worth the trip, instead of vanilla clutter. The tables below are the whole design; the engine at the
// bottom of the file only reads them.
//
// How a container is handled when it is filled:
//   1. Its loot table picks the tier. A table in a tier's `tables` belongs to one structure mod and is
//      edited wherever it is rolled. Vanilla tables and tables shared between tiers are listed under
//      `structures`, and only count when the container sits inside one of those structures (checked
//      against the structure pieces at the container). Vanilla villages, outposts and trail ruins
//      keep their vanilla loot.
//   2. The table's own loot is kept minus JUNK (and the tier's stripExtra; on the ground tiers also the
//      Nether/End material of OUTSIDE_SKY and every vanilla item outside GROUND_VANILLA) for
//      vanilla: 'strip', or dropped for vanilla: 'replace'.
//   3. Every container has a primary chance p and a filler chance q. Each of the tier's pools and
//      jackpots rolls with chance p x pool chance; each filler pool and filler jackpot with
//      (1 - p) x q x pool chance. A pool with `tables` or `structures` only applies there; an `always`
//      pool ignores p. A jackpot drops one entry by weight. Decorated pots and suspicious sand or gravel
//      hold a single stack, so they keep their own (stripped) loot and roll no pools.
//   4. NEVER_IN_LOOT and the non-Armorer TaCZ variants are removed from every container of these
//      structures. Everywhere else in the world (vanilla villages, outposts, trail ruins, monster rooms)
//      only the war items among them are: NEVER_IN_LOOT minus VANILLA_MAY_KEEP, plus the TaCZ variants.
//
// Entries are [item, min count, max count, weight] with an optional list of [item, min, max] that drop
// with it (a gun comes with its ammo). Every number is per container per player: Lootr fills each
// container once for every player who opens it, so a team of five takes five times all of this.
// The Trial Airship's vaults are loot chests in this pack (worldgen/structures/build.py), so Lootr makes
// them per player like every other chest.

// A Create Armorer gun exactly as Create: Immersive TaCZ Integration crafts it, and a stack of TaCZ ammo.
const gun = (id, mode) => 'tacz:modern_kinetic_gun[minecraft:custom_data={GunId:"' + id + '",GunFireMode:"' + mode + '"}]'
const ammo = id => 'tacz:ammo[minecraft:custom_data={AmmoId:"' + id + '"}]'

const TIERS = {
    ruin_early: {
        // Island-top ruins, camps, towers, houses and taverns reached on foot or by bridging in the first
        // hours (Explorify, Structory, Structory: Towers, MVS, Dungeons and Taverns small builds).
        // Andesite-age bottlenecks of a void world: andesite mechanisms, kelp (no oceans), obsidian, zinc,
        // sheets before the press, sifting meshes. No war-winners, no Nether/End material.
        vanilla: 'strip',
        ground: true,
        pools: [
            { name: 'andesite_age_bottlenecks', rolls: [2, 3], entries: [
                ['createages:andesite_mechanism', 1, 3, 18],  // tier-1 claim fuel and the base of every machine
                ['create:andesite_alloy', 6, 12, 12],
                ['create:andesite_casing', 2, 4, 8],
                ['minecraft:kelp', 2, 6, 12],  // no oceans: one kelp starts the farm that feeds cured rubber
                ['createages:andesite_template', 1, 1, 6],
                ['minecraft:obsidian', 1, 2, 6],  // 4 per protection block; lava is scarce on the islands
                ['create:zinc_ingot', 2, 4, 8],  // zinc hand for the first deployer
                ['create:iron_sheet', 2, 4, 8],  // before the first press
                ['create:copper_sheet', 2, 4, 6],
                ['minecraft:coal_block', 1, 2, 5],  // hot-air burner core
                ['minecraft:sugar_cane', 2, 4, 4],  // cardboard pulp, paper
                ['minecraft:bamboo', 2, 4, 3],
                ['minecraft:gunpowder', 1, 3, 4],  // kept small: raid currency
                ['aeronautics:white_envelope', 4, 8, 4],  // first balloon
            ] },
            { name: 'starter_tools', rolls: [1, 1], chance: 0.5, entries: [
                ['createsifter:string_mesh', 1, 1, 4],
                ['createsifter:andesite_mesh', 1, 1, 2],
                ['minecraft:pointed_dripstone', 1, 1, 2],  // lava farm once one lava source exists
            ] },
        ],
        jackpots: [
            { name: 'ruin_luck', chance: 0.04, entries: [
                ['createages:andesite_machine', 1, 1, 5],
                ['createages:zinc_hand', 1, 1, 4],
                ['minecraft:lava_bucket', 1, 1, 3],
                ['aeronautics:adjustable_burner', 1, 1, 3],
                ['createages:copper_mechanism', 1, 2, 3],  // a taste of the next age
                ['create:propeller', 1, 1, 2],
                ['create:deployer', 1, 1, 1],  // unlocks sequenced assembly
            ] },
        ],
        fillerPools: [
            // every ruin container holds some Create scraps (the mods' own food and clutter is stripped)
            { name: 'ruin_scraps', rolls: [1, 2], chance: 1.0, entries: [
                ['minecraft:kelp', 1, 3, 5],
                ['create:andesite_alloy', 2, 6, 6],
                ['create:zinc_nugget', 3, 9, 4],
                ['minecraft:gunpowder', 1, 2, 2],
                ['createages:andesite_mechanism', 1, 1, 3],
                ['create:iron_sheet', 1, 1, 2],
            ] },
        ],
        fillerJackpots: [
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'explorify:chest/dark_forest_settlement': [0.2, 1.0, ['explorify:dark_forest_settlement']],
            'explorify:chest/supply_cache': [0.5, 1.0, ['explorify:supply_cache/birch', 'explorify:supply_cache/dark', 'explorify:supply_cache/desert', 'explorify:supply_cache/forest', 'explorify:supply_cache/jungle', 'explorify:supply_cache/mangrove', 'explorify:supply_cache/taiga']],
            'mvs:cart': [0.0, 1.0, ['mvs:cart']],
            'mvs:cartographer_tower': [1.0, 1.0, ['mvs:cartographer_tower']],
            'mvs:crystal': [1.0, 1.0, ['mvs:crystal']],
            'mvs:empty': [0.0, 0, ['mvs:azelea_house', 'mvs:beach_bar', 'mvs:gallows', 'mvs:horse_pen', 'mvs:house', 'mvs:prismarine_house_1', 'mvs:prismarine_house_2', 'mvs:sunzi_gate', 'mvs:warped_house']],
            'mvs:houses_brewing': [0.0, 0.2, ['mvs:mud_brick_house_1']],
            'mvs:houses_desert': [0.0, 1.0, ['mvs:desert_house']],
            'mvs:houses_flower': [0.0, 1.0, ['mvs:flower_hole']],
            'mvs:large_carts': [0.0, 1.0, ['mvs:blue_stall', 'mvs:large_cart_1', 'mvs:large_cart_2', 'mvs:orange_stall', 'mvs:pink_stall', 'mvs:red_stall']],
            'mvs:large_carts_2': [0.0, 1.0, ['mvs:blue_stall', 'mvs:orange_stall', 'mvs:pink_stall', 'mvs:red_stall']],
            'mvs:mushroom_pond': [0.0, 1.0, ['mvs:mushroom_pond']],
            'mvs:pond': [0.0, 1.0, ['mvs:prismarine_house_1', 'mvs:prismarine_house_2', 'mvs:small_oak_pond']],
            'mvs:stable': [0.0, 1.0, ['mvs:mud_brick_house_1']],
            'mvs:swamps': [0.0, 1.0, ['mvs:log_ruin', 'mvs:small_swamp_house']],
            'nova_structures:chests/firewatch_tower': [1.0, 1.0, ['nova_structures:firewatch_tower_birch', 'nova_structures:firewatch_tower_cherry', 'nova_structures:firewatch_tower_dark_oak', 'nova_structures:firewatch_tower_forest', 'nova_structures:firewatch_tower_jungle', 'nova_structures:firewatch_tower_mangrove', 'nova_structures:firewatch_tower_savanna', 'nova_structures:firewatch_tower_swamp', 'nova_structures:firewatch_tower_taiga']],
            'nova_structures:chests/illager_camp': [1.0, 1.0, ['nova_structures:illager_camp']],
            // decorated pots: they keep their own stripped loot, see the header
            'explorify:chest/mausoleum_pot': [0.0, 1.0, ['explorify:mausoleum']],
            'nova_structures:pots/pot_generic_ruin': [0.0, 1.0, ['nova_structures:remnant_big_remnant', 'nova_structures:remnant_birch_graveyard', 'nova_structures:remnant_bunny_base', 'nova_structures:remnant_forest_smith', 'nova_structures:remnant_frog_ranch', 'nova_structures:remnant_ruin_farmer', 'nova_structures:remnant_ruin_smith', 'nova_structures:remnant_sawmill', 'nova_structures:remnant_school_remnant', 'nova_structures:remnant_taiga_castle']],
            'nova_structures:pots/pot_illager_camp': [0.0, 1.0, ['nova_structures:illager_camp']],
            'nova_structures:pots/pot_tavern': [0.0, 1.0, ['nova_structures:tavern_acacia', 'nova_structures:tavern_birch', 'nova_structures:tavern_cherry', 'nova_structures:tavern_dark_oak', 'nova_structures:tavern_desert', 'nova_structures:tavern_jungle', 'nova_structures:tavern_mangrove', 'nova_structures:tavern_oak', 'nova_structures:tavern_snowy', 'nova_structures:tavern_spruce', 'nova_structures:tavern_swamp']],
            'nova_structures:pots/pot_wild_ruin': [0.0, 1.0, ['nova_structures:remnant_miner_hut']],
            'nova_structures:chests/village/village_birch_house': [0.0, 0.15, ['nova_structures:village_birch']],
            'structory:library/junk': [0.0, 1.0, ['structory:outcast_villager_grassy']],
            'structory:library/low': [0.0, 1.0, ['structory:abandoned_chapel', 'structory:outcast_villager_grassy']],
            'structory:mood/desert': [0.0, 1.0, ['structory:outcast_villager_desert']],
            'structory:mood/farmer': [0.0, 1.0, ['structory:outcast_villager_grassy', 'structory:ruin_grassy']],
            'structory:mood/grassy': [0.0, 1.0, ['structory:abandoned_camp', 'structory:abandoned_chapel', 'structory:outcast_villager_grassy', 'structory:ruin_grassy']],
            'structory:mood/miner': [0.0, 1.0, ['structory:outcast_villager_grassy']],
            'structory:outcast/bandit/desert': [0.0, 1.0, ['structory:outcast_villager_desert']],
            'structory:outcast/bandit/desert_copper': [1.0, 1.0, ['structory:outcast_villager_desert']],
            'structory:outcast/farm_ruin': [0.0, 1.0, ['structory:ruin_grassy']],
            'structory:outcast/generic/bandit': [0.0, 1.0, ['structory:abandoned_camp', 'structory:outcast_villager_grassy', 'structory:ruin_grassy']],
            'structory:outcast/mine/loot': [1.0, 1.0, ['structory:outcast_villager_grassy']],
            'structory:outcast/settlement': [0.0, 1.0, ['structory:abandoned_camp', 'structory:outcast_villager_grassy']],
            'structory:ruin/ruin': [0.0, 1.0, ['structory:ruin_grassy']],
            'structory:ruin/swamp/loot': [0.15, 1.0, ['structory:swamp_ruin']],
            'structory:ruin/taiga/loot': [1.0, 1.0, ['structory:taiga_ruin_surface']],
            'structory_towers:basic/dark_basic': [0.0, 1.0, ['structory_towers:ancient_temple']],
            'structory_towers:basic/desert_basic': [0.0, 1.0, ['structory_towers:mirage_outpost']],
            'structory_towers:basic/farm_basic': [0.0, 1.0, ['structory_towers:farmer_outpost']],
            'structory_towers:basic/forager_basic': [0.0, 1.0, ['structory_towers:foraging_outpost']],
            'structory_towers:basic/lighthouse_basic': [0.0, 1.0, ['structory_towers:lighthouse']],
            'structory_towers:basic/mangrove_basic': [0.0, 1.0, ['structory_towers:overgrown_mangrove']],
            'structory_towers:basic/nomad_basic': [0.0, 1.0, ['structory_towers:nomad_outpost']],
            'structory_towers:basic/paranoid_basic': [0.0, 1.0, ['structory_towers:taiga_outpost']],
            'structory_towers:basic/pillager_basic': [0.0, 1.0, ['structory_towers:pillager_lookout']],
            'structory_towers:basic/sacred_temple_basic': [0.0, 1.0, ['structory_towers:sacred_relic_temple']],
            'structory_towers:basic/small_firetower_basic': [0.0, 1.0, ['structory_towers:small_firetower']],
            'structory_towers:basic/trader_basic': [0.0, 1.0, ['structory_towers:quarter_outpost']],
            'structory_towers:basic/warped_basic': [0.0, 1.0, ['structory_towers:nether/warped_outpost']],
            'structory_towers:basic/wizard_basic': [0.0, 1.0, ['structory_towers:wizard_tower']],
            'structory_towers:basic/workshop_basic': [0.0, 1.0, ['structory_towers:engineer_tower']],
            'structory_towers:sword_portal': [1.0, 1.0, ['structory_towers:warped_greatsword']],
            'structory_towers:toadstool': [1.0, 1.0, ['structory_towers:great_toadstool']],
            'structory_towers:top/dark_top': [1.0, 1.0, ['structory_towers:ancient_temple']],
            'structory_towers:top/desert_top': [1.0, 1.0, ['structory_towers:mirage_outpost']],
            'structory_towers:top/farm_top': [1.0, 1.0, ['structory_towers:farmer_outpost']],
            'structory_towers:top/forager_top': [1.0, 1.0, ['structory_towers:foraging_outpost']],
            'structory_towers:top/lighthouse_top': [0.5, 1.0, ['structory_towers:lighthouse']],
            'structory_towers:top/mangrove_top': [1.0, 1.0, ['structory_towers:overgrown_mangrove']],
            'structory_towers:top/nomad_top': [1.0, 1.0, ['structory_towers:nomad_outpost']],
            'structory_towers:top/paranoid_top': [1.0, 1.0, ['structory_towers:taiga_outpost']],
            'structory_towers:top/pillager_top': [1.0, 1.0, ['structory_towers:pillager_lookout']],
            'structory_towers:top/sacred_temple_top': [1.0, 1.0, ['structory_towers:sacred_relic_temple']],
            'structory_towers:top/small_firetower_top': [1.0, 1.0, ['structory_towers:small_firetower']],
            'structory_towers:top/trader_top': [1.0, 1.0, ['structory_towers:quarter_outpost']],
            'structory_towers:top/warped_top': [1.0, 1.0, ['structory_towers:nether/warped_outpost']],
            'structory_towers:top/wizard_top': [1.0, 1.0, ['structory_towers:wizard_tower']],
            'structory_towers:top/workshop_top': [1.0, 1.0, ['structory_towers:engineer_tower']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'explorify:badlands_pyramid': { 'minecraft:chests/desert_pyramid': [0.25, 1.0] },
            'explorify:campsite': { 'minecraft:chests/village/village_taiga_house': [0.17, 1.0] },
            'explorify:dark_forest_settlement': { 'minecraft:chests/village/village_armorer': [0.0, 1.0], 'minecraft:chests/village/village_temple': [0.0, 1.0], 'minecraft:chests/village/village_weaponsmith': [0.0, 1.0] },
            'explorify:desert_shrine': { 'minecraft:chests/desert_pyramid': [1, 1.0], 'minecraft:chests/village/village_desert_house': [0.0, 1.0] },
            'explorify:farmstead': { 'minecraft:chests/village/village_plains_house': [0.5, 1.0] },
            'explorify:mausoleum': { 'minecraft:chests/simple_dungeon': [0.5, 1.0] },
            'explorify:ruins': { 'minecraft:archaeology/trail_ruins_common': [0.0, 1.0], 'minecraft:archaeology/trail_ruins_rare': [0.0, 1.0], 'minecraft:chests/jungle_temple': [0.6, 1.0], 'minecraft:chests/simple_dungeon': [0.0, 1.0] },
            'explorify:tavern': { 'minecraft:chests/ancient_city': [0.0, 1.0], 'minecraft:chests/simple_dungeon': [0.66, 1.0], 'minecraft:chests/village/village_armorer': [0.0, 1.0], 'minecraft:chests/village/village_butcher': [0.0, 1.0], 'minecraft:chests/village/village_plains_house': [0.0, 1.0], 'minecraft:chests/village/village_shepherd': [0.0, 1.0], 'minecraft:chests/village/village_temple': [0.0, 1.0] },
            'explorify:watchtower/plains': { 'minecraft:chests/village/village_plains_house': [1, 1.0] },
            'explorify:watchtower/savanna': { 'minecraft:chests/village/village_savanna_house': [1, 1.0] },
            'explorify:watchtower/taiga': { 'minecraft:chests/village/village_taiga_house': [1, 1.0] },
            'mvs:azelea_house': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [1.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:barn': { 'mvs:general': [0.0, 1.0], 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [0.5, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:beach_bar': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:bench': { 'minecraft:chests/village/village_plains_house': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0] },
            'mvs:big_oak_tree': { 'mvs:general': [0.0, 1.0] },
            'mvs:campsite': { 'mvs:abandoned': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:cartographer_tower': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0] },
            'mvs:deepslate_house': { 'mvs:houses_common': [0.0, 1.0] },
            'mvs:diorite_and_deepslate_house': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:diorite_tower': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [0.25, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:flower_hole': { 'mvs:houses_common': [0.0, 1.0] },
            'mvs:gallows': { 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:haystack': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:house': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [1.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:lil_house': { 'mvs:rare': [1.0, 1.0] },
            'mvs:medium_igloo_1': { 'mvs:houses_common': [0.0, 1.0] },
            'mvs:medium_igloo_2': { 'mvs:general': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:mud_brick_house_1': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 0.5], 'mvs:houses_rare': [0.5, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:out_house': { 'mvs:houses_common': [0.0, 1.0] },
            'mvs:pile': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:prismarine_house_1': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [0.5, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:prismarine_house_2': { 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [1.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:railway': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:rare_well': { 'mvs:houses_rare': [1.0, 1.0] },
            'mvs:shed': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:small_igloo': { 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:small_ruin': { 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:stone_pillars': { 'mvs:houses_rare': [1.0, 1.0] },
            'mvs:sunzi_gate': { 'mvs:houses_books': [0.0, 1.0] },
            'mvs:tall_house': { 'mvs:abandoned': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [1.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:warped_house': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:well': { 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:wheat_grain_bin': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:wooden_wheat_farm': { 'mvs:general': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'nova_structures:mangrove_witch_hut': { 'nova_structures:chests/mangrove_witchhud': [1.0, 1.0] },
            'nova_structures:remnant_big_remnant': { 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [0.5, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0], 'nova_structures:chests/dungeon_6': [0.0, 1.0], 'nova_structures:chests/dungeon_7': [0.0, 1.0] },
            'nova_structures:remnant_birch_graveyard': { 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0], 'nova_structures:chests/dungeon_7': [0.0, 1.0], 'nova_structures:chests/undead_crypts_grave': [0.0, 0.25] },
            'nova_structures:remnant_bunny_base': { 'nova_structures:chests/dungeon_1': [0.0, 1.0], 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [0.5, 1.0], 'nova_structures:chests/dungeon_6': [0.0, 1.0], 'nova_structures:chests/dungeon_7': [0.0, 1.0] },
            'nova_structures:remnant_classic_village': { 'minecraft:chests/village/village_weaponsmith': [0.0, 1.0] },
            'nova_structures:remnant_desert_remnant': { 'minecraft:archaeology/desert_pyramid': [0.0, 1.0], 'minecraft:archaeology/desert_well': [0.0, 1.0], 'nova_structures:chests/desert_ruins/desert_ruin_house': [0.0, 1.0], 'nova_structures:chests/desert_ruins/desert_ruin_lesser_treasure': [1.0, 1.0], 'nova_structures:archaelogy/desert_ruin_ruins': [0.0, 1.0], 'nova_structures:pots/pot_desert_ruin': [0.0, 1.0] },
            'nova_structures:remnant_forest_smith': { 'minecraft:chests/village/village_weaponsmith': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0] },
            'nova_structures:remnant_frog_ranch': { 'nova_structures:chests/dungeon_4': [1.0, 1.0] },
            'nova_structures:remnant_graveyard': { 'nova_structures:chests/undead_crypts_grave': [0.0, 0.25] },
            'nova_structures:remnant_miner_hut': { 'nova_structures:chests/ruin_loot_master': [0.0, 1.0] },
            'nova_structures:remnant_ruin_farmer': { 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0] },
            'nova_structures:remnant_ruin_smith': { 'minecraft:chests/village/village_weaponsmith': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [1.0, 1.0], 'nova_structures:chests/dungeon_6': [0.0, 1.0] },
            'nova_structures:remnant_sawmill': { 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [0.5, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0] },
            'nova_structures:remnant_school_remnant': { 'nova_structures:chests/dungeon_2': [0.0, 1.0] },
            'nova_structures:remnant_taiga_castle': { 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [0.5, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0], 'nova_structures:chests/dungeon_6': [0.0, 1.0] },
            'nova_structures:remnant_zombie_horse_ranch': { 'nova_structures:chests/dungeon_4': [1.0, 1.0] },
            'nova_structures:tavern_acacia': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_birch': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_cherry': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_dark_oak': { 'nova_structures:chests/food_supply': [0.0, 0.5], 'nova_structures:chests/ruin_loot_master': [0.0, 1.0] },
            'nova_structures:tavern_desert': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_jungle': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_mangrove': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_oak': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_snowy': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_spruce': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:tavern_swamp': { 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:village_birch': { 'minecraft:chests/village/village_butcher': [0.0, 0.15], 'minecraft:chests/village/village_cartographer': [0.0, 0.15], 'minecraft:chests/village/village_fisher': [0.0, 0.15], 'minecraft:chests/village/village_fletcher': [0.0, 0.15], 'minecraft:chests/village/village_mason': [0.0, 0.15], 'minecraft:chests/village/village_temple': [0.0, 0.15], 'minecraft:chests/village/village_toolsmith': [0.0, 0.15], 'minecraft:chests/village/village_weaponsmith': [0.0, 0.15] },
            'nova_structures:village_jungle': { 'minecraft:chests/village/village_butcher': [0.0, 0.15], 'minecraft:chests/village/village_cartographer': [0.0, 0.15], 'minecraft:chests/village/village_fisher': [0.0, 0.15], 'minecraft:chests/village/village_fletcher': [0.0, 0.15], 'minecraft:chests/village/village_jungle_house': [0.0, 0.15], 'minecraft:chests/village/village_mason': [0.0, 0.15], 'minecraft:chests/village/village_shepherd': [0.0, 0.15], 'minecraft:chests/village/village_temple': [0.0, 0.15], 'minecraft:chests/village/village_toolsmith': [0.0, 0.15], 'minecraft:chests/village/village_weaponsmith': [0.0, 0.15] },
            'nova_structures:village_swamp': { 'minecraft:chests/village/village_butcher': [0.0, 0.15], 'minecraft:chests/village/village_cartographer': [0.0, 0.15], 'minecraft:chests/village/village_fisher': [0.0, 0.15], 'minecraft:chests/village/village_fletcher': [0.0, 0.15], 'minecraft:chests/village/village_mason': [0.0, 0.15], 'minecraft:chests/village/village_shepherd': [0.0, 0.15], 'minecraft:chests/village/village_swamp_house': [0.0, 0.15], 'minecraft:chests/village/village_temple': [0.0, 0.15], 'minecraft:chests/village/village_toolsmith': [0.0, 0.15], 'minecraft:chests/village/village_weaponsmith': [0.0, 0.15] },
            'nova_structures:wild_ruin': { 'nova_structures:chests/ruin_loot_master': [0.0, 1.0] },
            'structory:abandoned_chapel': { 'structory:harvest/graveyard': [0.0, 0.5], 'structory:harvest/graveyard2': [0.0, 1.0], 'structory:library/high': [1.0, 1.0] },
            'structory:dense_forest_ruin': { 'structory:harvest/graveyard2': [0.0, 1.0], 'structory:harvest/manor2/treasure': [1.0, 1.0], 'structory:outcast/ruin/ruin': [0.0, 1.0] },
            'structory:firetower': { 'structory:library/high': [1.0, 1.0] },
            'structory:graveyard': { 'structory:harvest/graveyard': [0.0, 0.5], 'structory:harvest/graveyard2': [0.0, 0.5] },
            'structory:jungle_ruin': { 'structory:library/high': [1.0, 1.0] },
            'structory:outcast_villager_grassy': { 'structory:library/high': [1.0, 1.0] },
        },
    },
    create_build: {
        // Create-themed island-top builds (Create: Hangars, Structures Overhaul, Rustic Structures, Let The
        // Adventure Begin houses/windmills/railroad, Create: Structures Arise ground builds).
        // Andesite-to-copper workshop stores and first-airship parts; a hangar's shelf chests hold its airship
        // parts depot. The mods' own Create-flavoured loot is kept minus junk and minus the brass-age parts
        // they hand out in the first hour (strip_extra).
        vanilla: 'strip',
        ground: true,
        stripExtra: ['create:precision_mechanism', 'create:mechanical_arm', 'create:brass_hand', 'create:brass_funnel', 'create:smart_chute', 'create:empty_blaze_burner', 'create:potato_cannon', 'minecraft:blaze_rod', 'minecraft:ender_pearl', 'minecraft:echo_shard'],
        pools: [
            { name: 'workshop_stores', rolls: [2, 3], entries: [
                ['createages:andesite_mechanism', 2, 3, 12],
                ['createages:cured_rubber', 1, 3, 12],  // 32 kelp each
                ['createages:copper_mechanism', 1, 2, 8],  // tier-2 claim fuel
                ['createages:zinc_mechanism', 1, 2, 4],  // tier-3 claim fuel
                ['minecraft:kelp', 4, 8, 6],
                ['createages:andesite_template', 1, 1, 5],
                ['createages:copper_template', 1, 1, 4],  // spout / hose pulley smithing
                ['create:fluid_pipe', 3, 6, 6],
                ['create:iron_sheet', 3, 6, 7],
                ['create:copper_sheet', 3, 6, 7],
                ['create:zinc_ingot', 3, 6, 6],
                ['create:electron_tube', 1, 2, 4],
                ['createages:zinc_hand', 1, 1, 2],
                ['createbigcannons:cast_iron_ingot', 2, 4, 3],
                ['minecraft:gunpowder', 2, 4, 3],
            ] },
            { name: 'airship_starter', rolls: [1, 1], chance: 0.5, entries: [
                ['aeronautics:white_envelope', 8, 16, 8],
                ['aeronautics:adjustable_burner', 1, 1, 4],
                ['create:propeller', 1, 1, 3],
                ['aeronautics:andesite_propeller', 1, 1, 3],
                ['createpropulsion:stirling_engine', 1, 1, 3],
                ['simulated:physics_assembler', 1, 1, 3],
                ['simulated:steering_wheel', 1, 1, 3],
                ['create:belt_connector', 1, 1, 2],  // 6 cured rubber
            ] },
            // graft from design-treasure: a hangar is an airship parts depot. Its pulley chest rides the hangar's
            // winch, so it is not a Lootr chest (lootr-common.toml) and one player would empty it for everyone:
            // the depot is spread over the per-player shelf chests instead. A hangar keeps 5.4 of its 12 shelf
            // chests on average (its wall processor removes 55%), each rolls this at 0.5 x 0.926, so a hangar
            // still holds 2.5 depot parts per player, as the pulley chest's 2-3 rolls did.
            { name: 'hangar_depot', rolls: [1, 1], chance: 0.926, always: true, tables: ['igcah:chests/hangar/shelf'], entries: [
                ['aeronautics:white_envelope', 8, 16, 8],
                ['aeronautics:adjustable_burner', 1, 1, 6],
                ['aeronautics:andesite_propeller', 1, 1, 5],
                ['simulated:physics_assembler', 1, 1, 4],
                ['simulated:steering_wheel', 1, 1, 4],
                ['createpropulsion:stirling_engine', 1, 1, 4],
                ['aeronautics:wooden_propeller', 1, 1, 3],
                ['simulated:rope_winch', 1, 1, 3],
                ['simulated:rope_connector', 2, 4, 3],
                ['simulated:red_portable_engine', 1, 1, 2],
                ['simulated:throttle_lever', 1, 1, 2],
                ['simulated:altitude_sensor', 1, 1, 2],
                ['aeronautics:propeller_bearing', 1, 1, 2],
                ['createpropulsion:solid_fuel_thruster', 1, 1, 1],
                ['simulated:gimbal_sensor', 1, 1, 1],
            ] },
        ],
        jackpots: [
            { name: 'engineer_luck', chance: 0.04, entries: [
                ['create:deployer', 1, 1, 5],
                ['createpropulsion:solid_burner', 1, 1, 4],  // the only heat source
                ['createages:copper_machine', 1, 1, 3],
                ['create:belt_connector', 2, 3, 3],
                ['createages:andesite_machine', 1, 1, 4],
                ['createages:zinc_machine', 1, 1, 2],
                ['create:sticker', 1, 1, 1],  // loot-only: Create: Ages blanks its recipe (pending_verification)
            ] },
        ],
        fillerPools: [
            { name: 'workshop_scrap', rolls: [1, 1], chance: 0.8, entries: [
                ['create:cogwheel', 2, 4, 8],
                ['create:large_cogwheel', 1, 2, 5],
                ['create:shaft', 2, 6, 6],
                ['create:andesite_alloy', 2, 6, 8],
                ['create:zinc_nugget', 3, 9, 5],
                ['minecraft:kelp', 1, 3, 4],
                ['create:iron_sheet', 1, 2, 3],
                ['createages:cured_rubber', 1, 1, 2],
                ['createages:andesite_mechanism', 1, 1, 2],
                ['simulated:spring', 1, 2, 3],
                ['aeronautics:white_envelope', 2, 6, 4],
            ] },
        ],
        fillerJackpots: [
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'create_ltab:desert/basic_loot': [0.0, 1.0, ['create_ltab:sand_house']],
            'create_ltab:normal/basic3_loot': [0.0, 1.0, ['create_ltab:plains_small', 'create_ltab:railroad']],
            'create_ltab:normal/basic4_loot': [0.0, 1.0, ['create_ltab:plains_small']],
            'create_ltab:normal/trash_loot': [0.0, 1.0, ['create_ltab:big_windmill', 'create_ltab:dark_forest_house', 'create_ltab:ruins']],
            'create_rustic_structures:chests/loot_1': [0.15, 1.0, ['create_rustic_structures:rustic_barn']],
            'create_rustic_structures:chests/loot_3': [0.5, 1.0, ['create_rustic_structures:rustic_smithy']],
            'create_structures_overhaul:acacia_windmill': [1.0, 1.0, ['create_structures_overhaul:acaciawindmill']],
            'create_structures_overhaul:birch_windmill': [1.0, 1.0, ['create_structures_overhaul:birchwindmill']],
            'create_structures_overhaul:camp': [0.12, 1.0, ['create_structures_overhaul:camp']],
            'create_structures_overhaul:cherry_windmill': [1.0, 1.0, ['create_structures_overhaul:cherrywindmill']],
            'create_structures_overhaul:coppergreenhouse': [0.34, 1.0, ['create_structures_overhaul:greenhouse']],
            'create_structures_overhaul:copperstorage': [1.0, 1.0, ['create_structures_overhaul:storage']],
            'create_structures_overhaul:dark_spooky_house': [0.34, 1.0, ['create_structures_overhaul:dark_spooky_house']],
            'create_structures_overhaul:graveyard': [0.25, 1.0, ['create_structures_overhaul:graveyard']],
            'create_structures_overhaul:lightningrodtower': [1.0, 1.0, ['create_structures_overhaul:lightningrodtower']],
            'create_structures_overhaul:miner_house': [0.5, 1.0, ['create_structures_overhaul:miner_hut']],
            'create_structures_overhaul:spooky_house1': [0.25, 1.0, ['create_structures_overhaul:spooky_house1']],
            'create_structures_overhaul:spooky_house2': [1.0, 1.0, ['create_structures_overhaul:spooky_house2']],
            'create_structures_overhaul:spruce_windmill': [1.0, 1.0, ['create_structures_overhaul:sprucewindmill']],
            'create_structures_overhaul:tower': [0.1, 0.6, ['create_structures_overhaul:tower']],
            // one shared pulley chest: filler only. The 5.4 shelf chests share the hangar's key chest: 5.4 x 0.185 = 1.
            'igcah:chests/hangar/pulley': [0.0, 1.0, ['igcah:bamboo_hangar', 'igcah:birch_hangar', 'igcah:cherry_hangar', 'igcah:dark_oak_hangar', 'igcah:jungle_hangar', 'igcah:plains_hangar', 'igcah:savannah_hangar', 'igcah:taiga_hangar']],
            'igcah:chests/hangar/shelf': [0.185, 0.5, ['igcah:bamboo_hangar', 'igcah:birch_hangar', 'igcah:cherry_hangar', 'igcah:dark_oak_hangar', 'igcah:jungle_hangar', 'igcah:plains_hangar', 'igcah:savannah_hangar', 'igcah:taiga_hangar']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'create_ltab:big_windmill': { 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/legend_loot': [1.0, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0] },
            'create_ltab:birch_structures': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic2_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0], 'create_ltab:water/basic_loot': [0.0, 1.0] },
            'create_ltab:cherry_house': { 'create_ltab:normal/basic_loot': [1, 1.0] },
            'create_ltab:dark_forest_house': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:water/basic_loot': [0.0, 1.0] },
            'create_ltab:mangrove_structures': { 'create_ltab:normal/basic2_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:not__junos_house': { 'create_ltab:normal/legend_loot': [0.2, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0] },
            'create_ltab:oak_house': { 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/legend_loot': [0.5, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0] },
            'create_ltab:plains_small': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic2_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0], 'create_ltab:water/basic_loot': [0.0, 1.0] },
            'create_ltab:railroad': { 'create_ltab:normal/basic_loot': [0.34, 1.0] },
            'create_ltab:ruins': { 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:spruce_structures': { 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/rare_loot': [1, 1.0] },
            'create_ltab:the_bunker': { 'create_ltab:normal/basic2_loot': [1, 1.0] },
            'create_rustic_structures:rustic_barn': { 'create_rustic_structures:chests/loot_2': [0.0, 1.0] },
            'create_rustic_structures:rustic_windmill': { 'create_rustic_structures:chests/loot_2': [0.5, 1.0] },
            'create_structures_arise:create_copper_statue': { 'minecraft:chests/village/village_armorer': [0.0, 1.0], 'minecraft:chests/woodland_mansion': [1, 1.0] },
            'create_structures_arise:createhouse': { 'minecraft:chests/stronghold_library': [0.5, 1.0], 'minecraft:chests/village/village_armorer': [0.0, 1.0], 'minecraft:chests/village/village_tannery': [0.0, 1.0] },
            'create_structures_arise:createlittleman': { 'minecraft:chests/village/village_armorer': [1, 1.0] },
            'create_structures_arise:createlosttrainstation': { 'minecraft:chests/abandoned_mineshaft': [0.5, 1.0], 'minecraft:chests/village/village_taiga_house': [0.0, 1.0] },
            'create_structures_arise:createpickaxestatue': { 'minecraft:chests/abandoned_mineshaft': [1, 1.0], 'minecraft:chests/ruined_portal': [0.0, 1.0] },
            'create_structures_arise:createwitchhut': { 'minecraft:chests/village/village_weaponsmith': [1, 1.0] },
            'create_structures_arise:windmill': { 'minecraft:chests/abandoned_mineshaft': [0.0, 1.0], 'minecraft:chests/ruined_portal': [0.0, 1.0], 'minecraft:chests/village/village_armorer': [0.0, 1.0], 'minecraft:chests/woodland_mansion': [0.5, 1.0] },
            'create_structures_overhaul:dark_spooky_house': { 'create_structures_overhaul:oak_windmill': [0.0, 1] },
            'create_structures_overhaul:oakwindmill': { 'create_structures_overhaul:oak_windmill': [1.0, 1.0] },
        },
    },
    dungeon_mid: {
        // Guarded dungeons, castles and towers on the islands (LTAB castles/dungeons/grot/quarry, Structory
        // manor and taiga ruin, MVS cathedral/red tower/warped tower/castle ruins/mine, D&T bunker and big
        // ruins, CSA crimsite tower/tower of Ochrum/ruined castle). Copper-to-zinc stores, brass entry, and a
        // capped taste of raiding (shot, charges, gunpowder).
        vanilla: 'strip',
        ground: true,
        pools: [
            { name: 'copper_zinc_stores', rolls: [2, 4], entries: [
                ['createages:cured_rubber', 2, 4, 10],
                ['createages:copper_mechanism', 1, 3, 9],
                ['createages:zinc_mechanism', 2, 4, 8],
                ['create:brass_ingot', 3, 6, 8],
                ['create:brass_casing', 1, 3, 5],
                ['create:electron_tube', 2, 4, 6],
                ['create:fluid_pipe', 4, 8, 5],
                ['create:mechanical_pump', 1, 1, 3],
                ['createbigcannons:cast_iron_ingot', 4, 8, 4],
                ['createbigcannons:steel_ingot', 2, 4, 2],
                ['minecraft:obsidian', 2, 3, 4],
                ['minecraft:quartz', 4, 8, 3],
                ['createages:copper_template', 1, 1, 3],
                ['createages:andesite_machine', 1, 1, 3],
                ['create:belt_connector', 1, 1, 2],
            ] },
            { name: 'war_chest', rolls: [1, 1], entries: [
                ['createbigcannons:solid_shot', 1, 2, 4],
                ['createbigcannons:powder_charge', 1, 2, 4],
                ['createbigcannons:packed_gunpowder', 1, 2, 3],
                ['minecraft:gunpowder', 2, 4, 4],
                ['createbigcannons:impact_fuze', 1, 2, 2],
                ['createbigcannons:ap_autocannon_round', 4, 8, 3],
                ['cbc_compact_mount:compact_cannon_mount', 1, 1, 1],
                ['createpropulsion:solid_fuel_thruster', 1, 1, 2],
                ['aeronautics:adjustable_burner', 1, 1, 2],
                ['aeronautics:white_envelope', 12, 24, 3],
                [ammo('create_armorer:rbapb'), 4, 8, 1],
                [ammo('create_armorer:gas_pistol_ammo'), 8, 16, 1],
                [ammo('create_armorer:slap'), 6, 12, 1],
                [ammo('tacz:12g'), 3, 6, 1],
            ] },
        ],
        jackpots: [
            { name: 'dungeon_luck', chance: 0.05, entries: [
                ['create:deployer', 1, 1, 5],
                ['createpropulsion:solid_burner', 1, 1, 5],
                ['create:belt_connector', 2, 3, 4],
                ['createages:copper_machine', 1, 1, 3],
                ['createages:zinc_machine', 1, 1, 3],
                ['minecraft:pointed_dripstone', 1, 1, 2],
                ['minecraft:lava_bucket', 1, 1, 2],
                ['createages:brass_template', 1, 1, 1],
                ['createimmersivetacz:gun_barrel', 1, 1, 2],
                [gun('create_armorer:pistol_auto_stress', 'SEMI'), 1, 1, 1, [[ammo('create_armorer:gas_pistol_ammo'), 16, 24]]],  // the one ground gun: a light Create Armorer pistol kit (about 0.16% per key chest)
            ] },
        ],
        fillerPools: [
            { name: 'dungeon_salvage', rolls: [1, 1], entries: [
                ['create:zinc_nugget', 4, 9, 5],
                ['create:brass_nugget', 3, 6, 4],
                ['create:iron_sheet', 2, 4, 5],
                ['create:copper_sheet', 2, 4, 5],
                ['minecraft:kelp', 2, 6, 4],
                ['createages:cured_rubber', 1, 1, 4],
                ['minecraft:gunpowder', 1, 3, 4],
                ['createages:zinc_mechanism', 1, 1, 3],
                ['createbigcannons:cast_iron_ingot', 1, 3, 2],
            ] },
        ],
        fillerJackpots: [
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'create_ltab:evoker_trigger': [1.0, 1.0, ['create_ltab:kings_castle']],
            'create_ltab:snow/basic_loot': [0.0, 1.0, ['create_ltab:snow_fort']],
            'mvs:cathedral_base': [0.0, 0.2, ['mvs:cathedral']],
            'mvs:cathedral_common': [0.0, 0.2, ['mvs:cathedral']],
            'mvs:cathedral_rare': [0.03, 0.2, ['mvs:cathedral']],
            'mvs:jungle_tower': [0.5, 1.0, ['mvs:jungle_tower']],
            'mvs:pillager': [0.5, 1.0, ['mvs:small_pillager_tower']],
            'mvs:red_tower/common': [0.0, 0.3, ['mvs:red_tower']],
            'mvs:red_tower/treasure': [0.5, 1.0, ['mvs:red_tower']],
            'mvs:red_tower/uncommon': [0.0, 0.5, ['mvs:red_tower']],
            'nova_structures:chests/badland_miner_outpost': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/badland_miner_outpost_towers': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/bunker_altar': [1.0, 1.0, ['nova_structures:bunker']],
            'nova_structures:chests/desert_ruins/desert_ruin_grave': [0.0, 0.25, ['nova_structures:desert_ruins']],
            'nova_structures:chests/desert_ruins/desert_ruin_main_temple': [0.5, 1.0, ['nova_structures:desert_ruins']],
            'nova_structures:chests/illager_hideout_meat': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/illager_hideout_raw_ores': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/illager_hideout_utility': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/jungle_ruins/jungle_ruins_house': [0.0, 0.25, ['nova_structures:jungle_ruins']],
            'nova_structures:chests/jungle_ruins/jungle_ruins_main_temple': [0.1, 0.5, ['nova_structures:jungle_ruins']],
            'nova_structures:chests/jungle_ruins/jungle_ruins_main_temple_wild': [0.1, 0.5, ['nova_structures:jungle_ruins']],
            // decorated pots and suspicious sand: they keep their own stripped loot, see the header
            'nova_structures:archaelogy/desert_ruin_inside_temple': [0.0, 1.0, ['nova_structures:desert_ruins']],
            'nova_structures:pots/pot_jungle_ruin': [0.0, 1.0, ['nova_structures:jungle_ruins']],
            'nova_structures:chests/mining_supply': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/pillager_outpost_treasure': [0.2, 0.15, ['nova_structures:badlands_miner_outpost', 'nova_structures:illager_manor']],
            'nova_structures:chests/shrine/combat_treasure_1': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/combat_treasure_2': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/combat_treasure_3': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/combat_treasure_4': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/combat_treasure_5': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/shrine_lesser_ominous': [0.0, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/shrine_lesser_treasure': [0.2, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/shrine/vault_shrine_ominous': [0.0, 0.15, ['nova_structures:shrine_combat_tier_1', 'nova_structures:shrine_combat_tier_2', 'nova_structures:shrine_combat_tier_3', 'nova_structures:shrine_combat_tier_4', 'nova_structures:shrine_combat_tier_5']],
            'nova_structures:chests/water_supply': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'nova_structures:chests/witch_villa/potion_brewing': [0.0, 0.15, ['nova_structures:badlands_miner_outpost']],
            'structory:harvest/manor2/loot': [0.0, 0.5, ['structory:old_manor']],
            'structory:ruin/taiga/illager_high': [0.15, 1.0, ['structory:taiga_ruin_underground']],
            'structory:ruin/taiga/illager_low': [0.0, 1.0, ['structory:taiga_ruin_underground']],
            'structory:ruin/taiga/illager_treasure': [1.0, 1.0, ['structory:taiga_ruin_underground']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'create_ltab:dungeon_desert': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:dungeon_jungle': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:dungeon_plains': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:dungeon_snow': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0] },
            'create_ltab:grot': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [0.5, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:water/basic_loot': [0.0, 1.0] },
            'create_ltab:kings_castle': { 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/legend_loot': [0.2, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0] },
            'create_ltab:quarry': { 'create_ltab:core/basic_loot': [0.0, 1.0], 'create_ltab:core/legend_loot': [1.0, 1.0], 'create_ltab:core/rare_loot': [0.0, 1.0], 'create_ltab:water/basic_loot': [0.0, 1.0] },
            'create_ltab:snow_fort': { 'create_ltab:normal/rare_loot': [0.5, 1.0] },
            'create_ltab:thecastle': { 'create_ltab:normal/basic_loot': [0.0, 1.0], 'create_ltab:normal/legend_loot': [1.0, 1.0], 'create_ltab:normal/rare_loot': [0.0, 1.0] },
            'create_structures_arise:create_ruined_castle': { 'minecraft:chests/ancient_city': [1, 1.0], 'minecraft:chests/simple_dungeon': [0.0, 1.0] },
            'create_structures_arise:crimsite_tower': { 'minecraft:chests/pillager_outpost': [0.4, 1.0], 'minecraft:chests/village/village_armorer': [0.0, 1.0] },
            'create_structures_arise:towerofochrum': { 'minecraft:chests/shipwreck_treasure': [0.25, 1.0], 'minecraft:chests/village/village_weaponsmith': [0.0, 0.5] },
            'mvs:castle_ruins': { 'mvs:general': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [0.5, 1.0], 'mvs:houses_uncommon': [0.0, 0.5] },
            'mvs:large_warped_tower': { 'minecraft:chests/igloo_chest': [0.0, 1.0], 'mvs:general': [0.0, 1.0], 'mvs:houses_books': [0.0, 1.0], 'mvs:houses_common': [0.0, 0.3], 'mvs:houses_uncommon': [0.0, 0.3], 'mvs:rare': [0.12, 1.0] },
            'mvs:mine_with_campsite': { 'mvs:abandoned': [0.0, 1.0], 'mvs:general': [0.0, 1.0], 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0], 'mvs:rare': [0.25, 1.0] },
            'mvs:small_pillager_tower': { 'mvs:general': [0.0, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'nova_structures:badlands_miner_outpost': { 'nova_structures:chests/badland_miner_outpost_forge': [0.0, 0.15], 'nova_structures:chests/dungeon_2': [0.0, 0.15], 'nova_structures:chests/dungeon_4': [0.2, 0.15], 'nova_structures:chests/food_supply': [0.0, 0.5] },
            'nova_structures:bunker': { 'nova_structures:chests/badland_miner_outpost_forge': [0.0, 1.0], 'nova_structures:chests/dungeon_2': [0.0, 1.0], 'nova_structures:chests/dungeon_3': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [1.0, 1.0], 'nova_structures:chests/mangrove_witchhud': [1.0, 1.0], 'nova_structures:chests/ruin_loot_master': [0.0, 1.0], 'nova_structures:chests/undead_crypts_grave': [0.0, 0.25] },
            'nova_structures:desert_ruins': { 'minecraft:archaeology/desert_pyramid': [0.0, 1.0], 'minecraft:archaeology/desert_well': [0.0, 1.0], 'nova_structures:chests/desert_ruins/desert_ruin_house': [0.0, 0.25], 'nova_structures:chests/desert_ruins/desert_ruin_lesser_treasure': [0.0, 0.25], 'nova_structures:archaelogy/desert_ruin_ruins': [0.0, 1.0], 'nova_structures:pots/pot_desert_ruin': [0.0, 1.0] },
            'nova_structures:illager_manor': { 'minecraft:chests/illager_mansion/ancient_city_raid_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/evoker_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/generic': [0.0, 0.15], 'minecraft:chests/illager_mansion/kitchen': [0.0, 0.15], 'minecraft:chests/illager_mansion/library_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/map_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/pillager_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/ravager_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/secret_room': [0.0, 0.15], 'minecraft:chests/illager_mansion/smithing_room': [0.0, 0.15], 'minecraft:chests/illager_mansion/vindicator_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/witch_chest': [0.0, 0.15], 'minecraft:chests/illager_mansion/wool': [0.0, 0.15], 'nova_structures:chests/dungeon_6': [0.0, 0.15], 'nova_structures:chests/dungeon_7': [0.0, 0.15], 'nova_structures:chests/undead_crypts_grave': [0.0, 0.25] },
            'nova_structures:jungle_ruins': { 'minecraft:archaelogy/jungle_ruins': [0.0, 1.0], 'minecraft:chests/jungle_temple': [0.0, 1.0], 'nova_structures:chests/badland_miner_outpost_forge': [0.0, 1.0], 'nova_structures:chests/dungeon_1': [0.0, 1.0], 'nova_structures:chests/dungeon_4': [1.0, 1.0], 'nova_structures:chests/dungeon_5': [0.0, 1.0], 'nova_structures:chests/ruin_loot_master': [0.0, 1.0], 'nova_structures:chests/undead_crypts_grave': [0.0, 0.25] },
            'nova_structures:ruin_town': { 'nova_structures:chests/ruin_loot_master': [0.0, 0.15] },
            'structory:old_manor': { 'structory:harvest/graveyard': [0.0, 1.0], 'structory:harvest/graveyard2': [0.0, 1.0], 'structory:harvest/manor2/treasure': [1.0, 1.0], 'structory:library/high': [1.0, 1.0], 'structory:outcast/ruin/ruin': [0.0, 1.0] },
        },
    },
    sky_low: {
        // Small sky finds that float in the open-sky corridors at y~100-200, reachable with a first airship:
        // CSA airdrop, Ember's Floating Islands, small ShellBound ships (ship6/7/8; 2/4/10 have no chests),
        // MVS floating islands. Brass entry and airship parts, the first small amounts of Nether/End
        // material, and a themed pool per islet. Minor jackpots only.
        vanilla: 'replace',
        pools: [
            { name: 'brass_entry_and_airship_parts', rolls: [2, 3], entries: [
                ['create:precision_mechanism', 1, 2, 8],
                ['create:brass_ingot', 4, 8, 6],
                ['create:brass_sheet', 2, 4, 4],
                ['createages:copper_mechanism', 2, 3, 5],
                ['createages:zinc_mechanism', 2, 4, 6],
                ['createages:cured_rubber', 2, 4, 5],
                ['create:electron_tube', 2, 4, 5],
                ['createpropulsion:platinum_ingot', 2, 4, 4],
                ['simulated:gyroscopic_mechanism', 1, 1, 4],
                ['aeronautics:propeller_bearing', 1, 1, 4],
                ['createpropulsion:solid_fuel_thruster', 1, 1, 3],
            ] },
            { name: 'locked_materials_small', rolls: [1, 1], entries: [
                ['minecraft:end_stone', 2, 4, 5],
                ['minecraft:netherrack', 3, 6, 5],
                ['minecraft:blaze_powder', 1, 2, 4],
                ['minecraft:quartz', 4, 8, 3],
                ['minecraft:glowstone_dust', 2, 6, 2],
                ['minecraft:lava_bucket', 1, 1, 2],
                ['create:sturdy_sheet', 1, 1, 2],
                ['minecraft:obsidian', 2, 4, 3],
                ['minecraft:soul_sand', 1, 2, 2],
                ['minecraft:nether_wart', 1, 2, 2],
            ] },
            { name: 'aeronaut_kit', rolls: [1, 1], chance: 0.5, entries: [
                ['aeronautics:white_envelope', 16, 32, 6],
                ['aeronautics:andesite_propeller', 1, 1, 3],
                ['createpropulsion:stirling_engine', 1, 1, 3],
                ['aeronautics:adjustable_burner', 1, 1, 3],
                ['simulated:navigation_table', 1, 1, 1],
            ] },
            // graft from design-treasure: the airdrop and the pillager camp are supply drops
            { name: 'supply_drop', rolls: [1, 1], structures: ['create_structures_arise:createairdrop', 'floating_islands:pillager_camp'], entries: [
                ['createbigcannons:powder_charge', 2, 3, 8],
                ['createbigcannons:ap_autocannon_round', 8, 16, 6],
                ['createbigcannons:solid_shot', 1, 2, 6],
                ['cbc_at:he_item', 4, 8, 4],
                ['createbigcannons:flak_autocannon_round', 6, 12, 4],
                [ammo('create_armorer:slap'), 12, 24, 4],
                [ammo('create_armorer:rbapb'), 8, 16, 4],
                [ammo('tacz:12g'), 8, 12, 3],
                ['createbigcannons:ap_shot', 1, 1, 3],
                ['createbigcannons:proximity_fuze', 1, 1, 2],
                ['createimmersivetacz:gun_trigger', 1, 1, 1],
            ] },
            // graft from design-treasure: a drifting chunk of the Nether (0-1 container per islet)
            { name: 'nether_islet', rolls: [1, 2], structures: ['floating_islands:nether_island'], entries: [
                ['minecraft:netherrack', 8, 16, 8],
                ['minecraft:soul_sand', 2, 4, 5],
                ['minecraft:blaze_powder', 2, 4, 5],
                ['minecraft:quartz', 6, 12, 4],
                ['minecraft:magma_block', 2, 4, 4],
                ['minecraft:glowstone_dust', 4, 8, 3],
                ['create:cinder_flour', 2, 4, 2],
                ['minecraft:blaze_rod', 1, 1, 1],
            ] },
            { name: 'haunted_islet', rolls: [1, 1], structures: ['floating_islands:cemetery_island', 'floating_islands:spider_ruin'], entries: [
                ['minecraft:soul_sand', 1, 3, 6],
                ['minecraft:soul_soil', 1, 2, 4],
                ['minecraft:nether_wart', 1, 2, 3],
                ['create_connected:fan_haunting_catalyst', 1, 1, 1],
            ] },
            { name: 'alchemist_islet', rolls: [1, 1], structures: ['floating_islands:witch_island', 'floating_islands:hut_with_waystone'], entries: [
                ['minecraft:nether_wart', 2, 4, 6],
                ['minecraft:blaze_powder', 2, 4, 5],
                ['minecraft:glowstone_dust', 4, 8, 3],
                ['minecraft:brewing_stand', 1, 1, 2],
                ['minecraft:magma_block', 1, 2, 2],
            ] },
            { name: 'steampunk_islet', rolls: [1, 1], structures: ['floating_islands:steampunk_island'], entries: [
                ['simulated:engine_assembly', 1, 2, 4],
                ['simulated:red_portable_engine', 1, 1, 3],
                ['createpropulsion:stirling_engine', 1, 1, 3],
                ['create:precision_mechanism', 1, 2, 3],
                ['simulated:spring', 2, 6, 3],
                ['createpropulsion:platinum_sheet', 1, 3, 2],
                ['aeronautics:propeller_bearing', 1, 1, 2],
            ] },
        ],
        jackpots: [
            // minor war-winners only; no crushing wheels, blaze burners, protection blocks or cannon parts below y241
            { name: 'drifter_minor', chance: 0.03, entries: [
                ['createages:brass_template', 1, 1, 4],
                ['create:mechanical_crafter', 1, 3, 4],
                ['aeronautics:levitite', 2, 3, 3],  // war-winner (minor): End-locked lift
                ['aeronautics:levitite_blend_bucket', 1, 1, 2],  // war-winner (minor): about one levitite block
                ['createages:brass_machine', 1, 1, 2],  // war-winner (minor): tier-4 claim fuel
                ['minecraft:blaze_rod', 1, 1, 2],
                ['createpropulsion:thruster', 1, 1, 1],
                ['simulated:docking_connector', 1, 1, 1],
                [gun('create_armorer:pistol_revolver_torque', 'SEMI'), 1, 1, 1, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:smg_auto_crank', 'AUTO'), 1, 1, 1, [[ammo('create_armorer:gas_pistol_ammo'), 24, 32]]],
            ] },
        ],
        fillerPools: [
            { name: 'drift_salvage', rolls: [1, 1], chance: 0.8, entries: [
                ['createages:cured_rubber', 1, 3, 5],
                ['createages:copper_mechanism', 1, 1, 4],
                ['createpropulsion:platinum_nugget', 3, 9, 3],
                ['minecraft:netherrack', 1, 3, 3],
                ['minecraft:blaze_powder', 1, 1, 2],
                ['aeronautics:white_envelope', 4, 8, 3],
                ['create:brass_nugget', 4, 9, 4],
                ['createages:zinc_mechanism', 1, 1, 3],
                ['minecraft:gunpowder', 1, 3, 3],
                ['minecraft:end_stone', 1, 1, 1],
            ] },
        ],
        fillerJackpots: [
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'shellbound_for_airship:chests/ship6': [1.0, 1.0, ['shellbound_for_airship:airship_ship6']],
            'shellbound_for_airship:chests/ship6_lower': [0.0, 1.0, ['shellbound_for_airship:airship_ship6']],
            'shellbound_for_airship:chests/ship7': [1.0, 1.0, ['shellbound_for_airship:airship_ship7']],
            'shellbound_for_airship:chests/ship8': [1.0, 1.0, ['shellbound_for_airship:airship_ship8']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'create_structures_arise:createairdrop': { 'minecraft:chests/simple_dungeon': [1, 1.0] },
            'floating_islands:cemetery_island': { 'minecraft:chests/simple_dungeon': [0.34, 1.0] },
            'floating_islands:cherry_island_with_shrine': { 'minecraft:chests/shipwreck_treasure': [0.34, 1.0] },
            'floating_islands:floating_rocks': { 'minecraft:chests/village/village_weaponsmith': [1, 1.0] },
            'floating_islands:hut_with_waystone': { 'minecraft:chests/simple_dungeon': [1, 1.0] },
            'floating_islands:nether_island': { 'minecraft:chests/nether_bridge': [1, 1.0] },
            'floating_islands:paradise_island': { 'minecraft:chests/simple_dungeon': [1, 1.0] },
            'floating_islands:pillager_camp': { 'minecraft:chests/pillager_outpost': [0.34, 1.0], 'minecraft:chests/shipwreck_supply': [0.0, 1.0] },
            'floating_islands:spider_ruin': { 'minecraft:chests/shipwreck_supply': [0.0, 1.0], 'minecraft:chests/simple_dungeon': [0.34, 1.0] },
            'floating_islands:steampunk_island': { 'minecraft:chests/jungle_temple': [0.05, 0.5], 'minecraft:chests/jungle_temple_dispenser': [0.0, 1.0], 'minecraft:chests/shipwreck_supply': [0.0, 1.0], 'minecraft:chests/simple_dungeon': [0.4, 1.0] },
            'floating_islands:tower_island': { 'minecraft:chests/simple_dungeon': [0.5, 1.0] },
            'floating_islands:villager_island': { 'minecraft:chests/shipwreck_supply': [0.5, 1.0] },
            'floating_islands:witch_island': { 'minecraft:chests/simple_dungeon': [1, 1.0] },
            'mvs:floating_islands': { 'mvs:houses_common': [0.0, 1.0], 'mvs:houses_rare': [1, 1.0], 'mvs:houses_uncommon': [0.0, 1.0] },
            'mvs:large_floating_island': { 'minecraft:chests/shipwreck_treasure': [0.5, 1.0], 'minecraft:chests/stronghold_crossing': [0.0, 1.0], 'minecraft:chests/stronghold_library': [0.0, 1.0] },
        },
    },
    sky_high: {
        // Big sky structures above every island top (start y>=241, cmp:sky_void only), reachable only by an
        // airship that climbs past y241: CSA pillager steampunk airship and mini sky village, sky whales
        // (frozen_whale, whalearena, whaleship; whalelight has no chest; the 96-tall whale is dropped), big
        // ShellBound ships (ship3/5/9 carry one chest each; ship1 has none). Brass-age core, End/Nether
        // material in small stacks, Armorer ammo and gun parts. Single-chest ships get a captain's cache.
        // Minor jackpots at 5% per key chest, majors at 0.6%.
        vanilla: 'replace',
        pools: [
            { name: 'brass_age_core', rolls: [2, 4], entries: [
                ['create:precision_mechanism', 2, 3, 9],
                ['create:mechanical_crafter', 1, 2, 5],
                ['createages:brass_template', 1, 1, 5],
                ['createpropulsion:platinum_sheet', 2, 4, 4],
                ['simulated:gyroscopic_mechanism', 1, 2, 5],
                ['create:sturdy_sheet', 1, 3, 4],
                ['create:brass_casing', 3, 6, 4],
                ['create:electron_tube', 4, 8, 4],
                ['createages:zinc_mechanism', 3, 5, 4],  // tier-3 claim fuel
                ['createages:copper_mechanism', 2, 4, 3],
                ['aeronautics:smart_propeller', 1, 1, 2],
                ['simulated:navigation_table', 1, 1, 2],
            ] },
            { name: 'locked_materials', rolls: [1, 2], entries: [
                ['minecraft:end_stone', 4, 8, 6],
                ['aeronautics:end_stone_powder', 2, 4, 3],
                ['minecraft:netherrack', 6, 12, 5],
                ['minecraft:blaze_powder', 2, 4, 4],
                ['minecraft:blaze_rod', 1, 1, 2],
                ['minecraft:nether_wart', 1, 2, 2],
                ['create:blaze_cake', 1, 2, 2],
                ['minecraft:lava_bucket', 1, 1, 2],
                ['minecraft:soul_soil', 1, 2, 1],
                ['minecraft:shulker_shell', 1, 1, 1],
            ] },
            { name: 'armory', rolls: [1, 1], chance: 0.5, entries: [
                [ammo('create_armorer:rbapb'), 16, 32, 3],
                [ammo('create_armorer:gas_pistol_ammo'), 24, 48, 3],
                [ammo('tacz:12g'), 12, 24, 3],
                [ammo('create_armorer:slap'), 20, 40, 2],
                ['createimmersivetacz:gun_barrel', 1, 1, 2],
                ['createimmersivetacz:gun_trigger', 1, 1, 2],
                ['createimmersivetacz:firing_mechanism', 1, 1, 1],
                ['createbigcannons:packed_gunpowder', 2, 4, 3],
                ['createbigcannons:powder_charge', 2, 3, 3],
                ['createbigcannons:impact_fuze', 2, 4, 2],
                ['createbigcannons:he_shell', 1, 1, 1],  // unfuzed; impact fuzes sit in the same pool
            ] },
            // graft from design-treasure: a whale or big ShellBound ship has ONE chest, so it carries the captain's cache
            { name: 'captains_cache', rolls: [2, 2], structures: ['sky_whale_ship:frozen_whale', 'sky_whale_ship:whalearena', 'sky_whale_ship:whaleship', 'shellbound_for_airship:airship_ship3', 'shellbound_for_airship:airship_ship5', 'shellbound_for_airship:airship_ship9'], entries: [
                ['create:precision_mechanism', 2, 3, 8],
                ['create:mechanical_crafter', 1, 2, 5],
                ['minecraft:end_stone', 2, 4, 6],
                ['minecraft:netherrack', 3, 6, 6],
                ['minecraft:blaze_rod', 1, 1, 5],
                ['createages:brass_template', 1, 1, 4],
                ['simulated:gyroscopic_mechanism', 1, 2, 4],
                ['minecraft:shulker_shell', 1, 1, 3],
                ['createpropulsion:platinum_ingot', 4, 8, 3],
                ['create:sturdy_sheet', 2, 3, 3],
                ['createbigcannons:he_shell', 1, 1, 2],
            ] },
            // graft from design-treasure: the CSA airship armory (its 5 weaponsmith key chests)
            { name: 'airship_armory', rolls: [1, 1], chance: 0.7, tables: ['minecraft:chests/village/village_weaponsmith'], structures: ['create_structures_arise:pillagersteampunkairship'], entries: [
                ['createbigcannons:powder_charge', 2, 3, 8],
                ['createbigcannons:ap_shot', 1, 2, 5],
                ['cbc_at:hei_item', 4, 8, 4],
                ['cbc_at:ha_he_item', 2, 4, 4],
                ['createbigcannons:proximity_fuze', 1, 2, 4],
                [ammo('create_armorer:slap'), 20, 40, 4],
                [ammo('create_armorer:rbapb'), 12, 24, 3],
                ['createbigcannons:he_shell', 1, 1, 2],
                ['create_radar:guided_fuze', 1, 2, 2],
                ['createimmersivetacz:gun_trigger', 1, 1, 2],
                ['createimmersivetacz:firing_mechanism', 1, 1, 1],
            ] },
        ],
        jackpots: [
            // per key chest per player; containers with a primary_chance p roll it at p x 5%
            { name: 'sky_minor', chance: 0.05, entries: [
                ['createages:brass_machine', 1, 2, 25],  // war-winner (minor): tier-4 claim fuel, 1-2 only
                ['aeronautics:levitite', 3, 5, 20],  // war-winner (minor)
                ['aeronautics:levitite_blend_bucket', 2, 2, 8],  // war-winner (minor): about 2 levitite blocks
                ['minecraft:netherite_scrap', 1, 2, 8],  // 8 nethersteel ingots each
                ['createbigcannons:cast_iron_cannon_barrel', 1, 1, 5],  // war-winner (minor): one finished cannon part
                ['createbigcannons:cast_iron_cannon_chamber', 1, 1, 4],  // war-winner (minor)
                ['createbigcannons:cast_iron_autocannon_barrel', 1, 1, 4],  // war-winner (minor)
                ['createbigcannons:cast_iron_autocannon_breech', 1, 1, 3],  // war-winner (minor)
                ['createpropulsion:ion_thruster', 1, 1, 3],
                [gun('create_armorer:pistol_revolver_torque', 'SEMI'), 1, 1, 5, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:shotgun_pump_bearing', 'SEMI'), 1, 1, 5, [[ammo('tacz:12g'), 6, 10]]],
                [gun('create_armorer:smg_auto_crank', 'AUTO'), 1, 1, 4, [[ammo('create_armorer:gas_pistol_ammo'), 24, 32]]],
                [gun('create_armorer:sniper_semi_m1', 'SEMI'), 1, 1, 4, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:rifle_assult_crane', 'AUTO'), 1, 1, 3, [[ammo('create_armorer:slap'), 20, 30]]],
                [gun('create_armorer:sniper_semi_clockwork', 'SEMI'), 1, 1, 3, [[ammo('create_armorer:rbapb'), 8, 12]]],
            ] },
            // per key chest per player; a 5-player team has about 3% per single-chest ship
            { name: 'sky_major', chance: 0.006, entries: [
                ['create:crushing_wheel', 2, 2, 25],  // war-winner (major): ONE pair, never more; skips ~21 crafters
                ['create:blaze_burner', 1, 1, 18],  // war-winner (major): Nether-locked; the only path to a CBC cannon welder
                ['cmpwar:protection_block', 1, 1, 15],  // war-winner (major): spare claim core (blocksPerTeam=1, so a replacement, not a second claim)
                ['createbigcannons:cast_iron_sliding_breech', 1, 1, 20, [['createbigcannons:cast_iron_cannon_chamber', 2, 2], ['createbigcannons:cast_iron_cannon_barrel', 2, 2]]],  // war-winner (major): CAST IRON CANNON KIT, breech + 2 chambers + 2 barrels
                ['createbigcannons:steel_sliding_breech', 1, 1, 7, [['createbigcannons:steel_cannon_chamber', 2, 2], ['createbigcannons:steel_cannon_barrel', 3, 3]]],  // war-winner (major): STEEL CANNON KIT, breech + 2 chambers + 3 barrels
            ] },
        ],
        fillerPools: [
            { name: 'sky_stores', rolls: [1, 2], entries: [
                ['create:brass_ingot', 2, 4, 5],
                ['create:brass_nugget', 6, 12, 3],
                ['createages:zinc_mechanism', 1, 2, 4],
                ['createages:copper_mechanism', 1, 1, 3],
                ['createages:cured_rubber', 1, 2, 4],
                ['create:electron_tube', 1, 2, 3],
                ['minecraft:netherrack', 2, 4, 3],
                ['minecraft:end_stone', 1, 2, 2],
                ['minecraft:gunpowder', 2, 4, 3],
                [ammo('create_armorer:rbapb'), 6, 12, 1],
                [ammo('create_armorer:gas_pistol_ammo'), 8, 16, 1],
                ['createpropulsion:platinum_nugget', 3, 6, 2],
            ] },
            // graft from design-treasure: the CSA airship crew armory (12 pillager_outpost chests)
            { name: 'airship_armory_stores', rolls: [1, 1], chance: 0.5, tables: ['minecraft:chests/pillager_outpost'], structures: ['create_structures_arise:pillagersteampunkairship'], entries: [
                ['createbigcannons:powder_charge', 1, 2, 8],
                ['createbigcannons:ap_shot', 1, 1, 5],
                ['cbc_at:hei_item', 2, 6, 4],
                ['cbc_at:ha_he_item', 1, 3, 4],
                ['createbigcannons:impact_fuze', 1, 3, 4],
                [ammo('create_armorer:slap'), 10, 20, 4],
                [ammo('create_armorer:rbapb'), 8, 16, 3],
                ['create_radar:guided_fuze', 1, 1, 2],
            ] },
            // graft from design-treasure: the CSA airship chart room (15 library chests)
            { name: 'chart_room', rolls: [1, 1], chance: 0.4, tables: ['minecraft:chests/stronghold_library'], structures: ['create_structures_arise:pillagersteampunkairship'], entries: [
                ['create:electron_tube', 2, 6, 6],
                ['create:precision_mechanism', 1, 1, 5],
                ['simulated:gimbal_sensor', 1, 1, 3],
                ['simulated:altitude_sensor', 1, 1, 3],
                ['simulated:navigation_table', 1, 1, 2],
                ['create_radar:plane_radar', 1, 1, 2],
                ['create_radar:radar_bearing', 1, 1, 1],
            ] },
        ],
        fillerJackpots: [
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'shellbound_for_airship:chests/ship3': [1.0, 1.0, ['shellbound_for_airship:airship_ship3']],
            'shellbound_for_airship:chests/ship5': [1.0, 1.0, ['shellbound_for_airship:airship_ship5']],
            'shellbound_for_airship:chests/ship9': [1.0, 1.0, ['shellbound_for_airship:airship_ship9']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'create_structures_arise:createminiskyvillage': { 'minecraft:chests/simple_dungeon': [0.2, 1.0] },
            'create_structures_arise:pillagersteampunkairship': { 'minecraft:chests/pillager_outpost': [0.0, 0.3], 'minecraft:chests/simple_dungeon': [0.0, 0.3], 'minecraft:chests/stronghold_library': [0.0, 0.3], 'minecraft:chests/village/village_weaponsmith': [0.35, 0.3] },
            'sky_whale_ship:frozen_whale': { 'minecraft:chests/abandoned_mineshaft': [1, 1.0] },
            'sky_whale_ship:whalearena': { 'minecraft:chests/ancient_city': [1, 1.0] },
            'sky_whale_ship:whaleship': { 'minecraft:chests/stronghold_library': [1, 1.0] },
        },
    },
    sky_jackpot: {
        // The rarest, hardest airship-only targets: When Dungeons Arise heavenly challenger/conqueror/rider
        // (every room) and the Trial Airship's vault chests. The brass age in bulk, the most End/Nether material,
        // and the main source of war-winners: major jackpots (crushing-wheel pair, blaze burner, spare
        // protection block, cast-iron or steel cannon kit, explosive Armorer guns) and minor ones.
        vanilla: 'replace',
        pools: [
            { name: 'fortress_hoard', rolls: [2, 3], entries: [
                ['create:precision_mechanism', 2, 4, 8],
                ['create:mechanical_crafter', 1, 3, 6],
                ['createages:brass_template', 1, 1, 5],
                ['createpropulsion:platinum_ingot', 4, 8, 4],
                ['create:sturdy_sheet', 2, 4, 5],
                ['simulated:gyroscopic_mechanism', 2, 3, 4],
                ['aeronautics:end_stone_powder', 2, 4, 4],
                ['createages:zinc_mechanism', 4, 8, 4],  // tier-3 claim fuel
                ['aeronautics:smart_propeller', 1, 1, 2],
                ['aeronautics:gyroscopic_propeller_bearing', 1, 1, 2],
                ['simulated:docking_connector', 1, 1, 2],
                ['createpropulsion:thruster', 1, 1, 2],
                ['createpropulsion:ion_thruster', 1, 1, 1],
            ] },
            { name: 'locked_hoard', rolls: [1, 1], entries: [
                ['minecraft:end_stone', 4, 8, 6],
                ['minecraft:netherrack', 6, 12, 5],
                ['minecraft:blaze_rod', 1, 2, 3],
                ['minecraft:nether_wart', 2, 4, 2],
                ['minecraft:shulker_shell', 1, 1, 2],
                ['minecraft:soul_soil', 1, 2, 2],
                ['create:blaze_cake', 1, 2, 2],
                ['minecraft:lava_bucket', 1, 1, 1],
            ] },
            { name: 'arsenal', rolls: [1, 1], entries: [
                ['createbigcannons:he_shell', 1, 1, 4],  // HE shell; replaces the HESH and anti-air HE shells of CBC Military Supplement, which do not fire under CBC 5.11.7
                ['createbigcannons:ap_shell', 1, 1, 1],
                ['createbigcannons:powder_charge', 2, 4, 3],
                ['createbigcannons:packed_gunpowder', 2, 4, 3],
                [ammo('create_armorer:rbapb'), 24, 48, 3],
                [ammo('create_armorer:gas_pistol_ammo'), 32, 64, 3],
                [ammo('tacz:12g'), 16, 32, 3],
                [ammo('create_armorer:slap'), 32, 64, 2],
                ['createimmersivetacz:gun_trigger', 1, 1, 2],
                ['createimmersivetacz:firing_mechanism', 1, 1, 2],
                ['createbigcannons:proximity_fuze', 1, 2, 2],
            ] },
        ],
        jackpots: [
            // per key chest per player. Heavenly treasure chests have primary_chance 0.4 (challenger, 5 chests) or 1 (conqueror/rider, 2 chests), so every fortress is 2 key-chest equivalents: 14% minor per player per fortress
            { name: 'fortress_minor', chance: 0.07, entries: [
                ['createages:brass_machine', 1, 2, 25],  // war-winner (minor)
                ['aeronautics:levitite', 4, 8, 20],  // war-winner (minor)
                ['aeronautics:levitite_blend_bucket', 2, 2, 6],  // war-winner (minor)
                ['aeronautics:pearlescent_levitite', 2, 3, 5],  // war-winner (minor)
                ['minecraft:netherite_scrap', 1, 2, 10],
                ['createbigcannons:cast_iron_cannon_barrel', 1, 1, 5],  // war-winner (minor)
                ['createbigcannons:cast_iron_cannon_chamber', 1, 1, 4],  // war-winner (minor)
                ['createbigcannons:cast_iron_autocannon_barrel', 1, 1, 4],  // war-winner (minor)
                ['createbigcannons:cast_iron_autocannon_breech', 1, 1, 3],  // war-winner (minor)
                ['createbigcannons:cast_iron_autocannon_recoil_spring', 1, 1, 2],  // war-winner (minor)
                ['createpropulsion:vector_thruster', 1, 1, 2],
                [gun('create_armorer:pistol_revolver_torque', 'SEMI'), 1, 1, 4, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:shotgun_pump_bearing', 'SEMI'), 1, 1, 4, [[ammo('tacz:12g'), 6, 10]]],
                [gun('create_armorer:smg_auto_crank', 'AUTO'), 1, 1, 3, [[ammo('create_armorer:gas_pistol_ammo'), 24, 32]]],
                [gun('create_armorer:sniper_semi_m1', 'SEMI'), 1, 1, 3, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:rifle_assult_crane', 'AUTO'), 1, 1, 3, [[ammo('create_armorer:slap'), 20, 30]]],
                [gun('create_armorer:sniper_semi_clockwork', 'SEMI'), 1, 1, 3, [[ammo('create_armorer:rbapb'), 8, 12]]],
                [gun('create_armorer:rifle_assult_roller', 'AUTO'), 1, 1, 3, [[ammo('create_armorer:slap'), 20, 30]]],
                [gun('create_armorer:mg_platemag_flywheel', 'AUTO'), 1, 1, 2, [[ammo('create_armorer:slap'), 40, 50]]],  // Create Armorer "Flywheel" LMG kit: its recipe DOES load (the live boot recipe dump has createimmersivetacz:guns/lmg), so it is not loot-exclusive
            ] },
            // per key chest per player: 7% major per player per fortress, about 30% for a 5-player team
            { name: 'fortress_major', chance: 0.035, entries: [
                ['create:crushing_wheel', 2, 2, 25],  // war-winner (major): ONE pair, never more; skips ~21 crafters
                ['create:blaze_burner', 1, 1, 18],  // war-winner (major): Nether-locked; the only path to a CBC cannon welder
                ['cmpwar:protection_block', 1, 1, 15],  // war-winner (major): spare claim core (blocksPerTeam=1, so a replacement, not a second claim)
                ['createbigcannons:cast_iron_sliding_breech', 1, 1, 20, [['createbigcannons:cast_iron_cannon_chamber', 2, 2], ['createbigcannons:cast_iron_cannon_barrel', 2, 2]]],  // war-winner (major): CAST IRON CANNON KIT, breech + 2 chambers + 2 barrels
                ['createbigcannons:steel_sliding_breech', 1, 1, 7, [['createbigcannons:steel_cannon_chamber', 2, 2], ['createbigcannons:steel_cannon_barrel', 3, 3]]],  // war-winner (major): STEEL CANNON KIT, breech + 2 chambers + 3 barrels
                [gun('create_armorer:gl_revolver_devastator', 'SEMI'), 1, 1, 8, [[ammo('create_armorer:gernade'), 8, 12]]],  // war-winner (major, PvP): explosive Armorer gun kit; TaCZ blasts cannot hit claims
                [gun('create_armorer:cannon_40mm_salamander', 'SEMI'), 1, 1, 7, [[ammo('create_armorer:40mmhe'), 4, 6]]],  // war-winner (major, PvP): explosive Armorer field gun kit
            ] },
        ],
        fillerPools: [
            { name: 'fortress_stores', rolls: [1, 2], tables: ['dungeons_arise:chests/heavenly_challenger/heavenly_challenger_theater', 'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_normal', 'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_supply', 'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_treasure', 'dungeons_arise:chests/heavenly_conqueror/heavenly_conqueror_barrels', 'dungeons_arise:chests/heavenly_conqueror/heavenly_conqueror_normal', 'dungeons_arise:chests/heavenly_rider/heavenly_rider_barrels', 'dungeons_arise:chests/heavenly_rider/heavenly_rider_normal'], entries: [
                ['create:precision_mechanism', 1, 1, 3],
                ['create:brass_ingot', 3, 6, 5],
                ['createages:zinc_mechanism', 1, 3, 4],
                ['createages:copper_mechanism', 1, 2, 3],
                ['minecraft:netherrack', 2, 4, 4],
                ['minecraft:end_stone', 1, 2, 3],
                ['minecraft:blaze_powder', 1, 2, 3],
                ['createpropulsion:platinum_nugget', 4, 9, 3],
                [ammo('create_armorer:rbapb'), 8, 16, 2],
                [ammo('tacz:12g'), 6, 12, 2],
                ['minecraft:gunpowder', 2, 4, 4],
            ] },
            // every Trial Airship vault chest gives this (they were vaults that each took a key; the pack turns them
            // into per-player Lootr chests with the same tables and odds); the ominous ones add the key pools at 40%
            { name: 'trial_vault', rolls: [1, 1], tables: ['minecraft:chests/trial_chambers/reward', 'minecraft:chests/trial_chambers/reward_ominous'], always: true, entries: [
                ['minecraft:end_stone', 1, 3, 7],
                ['minecraft:netherrack', 2, 5, 7],
                ['create:precision_mechanism', 1, 2, 6],
                ['minecraft:blaze_rod', 1, 1, 4],
                ['minecraft:soul_sand', 1, 3, 4],
                ['simulated:gyroscopic_mechanism', 1, 1, 4],
                ['create:sturdy_sheet', 1, 2, 4],
                ['createbigcannons:powder_charge', 1, 2, 4],
                ['createages:zinc_mechanism', 2, 4, 5],
                ['minecraft:shulker_shell', 1, 1, 2],
                ['create:mechanical_crafter', 1, 1, 2],
                ['createages:brass_template', 1, 1, 1],
            ] },
        ],
        fillerJackpots: [
            // heavenly filler rooms and normal trial vault chests: small, non-decisive
            { name: 'fortress_filler_minor', chance: 0.01, entries: [
                ['create:mechanical_crafter', 3, 3, 3],
                ['aeronautics:levitite', 1, 2, 3],  // war-winner (minor), small
                ['minecraft:netherite_scrap', 1, 1, 2],
                ['minecraft:blaze_rod', 1, 1, 2],
                ['createages:brass_machine', 1, 1, 1],
            ] },
        ],
        // Tables only these structures use: edited by id. [primary chance, filler chance, used by]
        tables: {
            'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_normal': [0.0, 1.0, ['dungeons_arise:heavenly_challenger']],
            'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_supply': [0.0, 1.0, ['dungeons_arise:heavenly_challenger']],
            'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_theater': [0.0, 1.0, ['dungeons_arise:heavenly_challenger']],
            'dungeons_arise:chests/heavenly_challenger/heavenly_challenger_treasure': [0.4, 1.0, ['dungeons_arise:heavenly_challenger']],
            'dungeons_arise:chests/heavenly_conqueror/heavenly_conqueror_barrels': [0.0, 0.5, ['dungeons_arise:heavenly_conqueror']],
            'dungeons_arise:chests/heavenly_conqueror/heavenly_conqueror_normal': [0.0, 1.0, ['dungeons_arise:heavenly_conqueror']],
            'dungeons_arise:chests/heavenly_conqueror/heavenly_conqueror_treasure': [1.0, 1.0, ['dungeons_arise:heavenly_conqueror']],
            'dungeons_arise:chests/heavenly_rider/heavenly_rider_barrels': [0.0, 0.5, ['dungeons_arise:heavenly_rider']],
            'dungeons_arise:chests/heavenly_rider/heavenly_rider_normal': [0.0, 1.0, ['dungeons_arise:heavenly_rider']],
            'dungeons_arise:chests/heavenly_rider/heavenly_rider_treasure': [1.0, 1.0, ['dungeons_arise:heavenly_rider']],
        },
        // Vanilla tables and tables shared with another tier: matched together with the structure.
        // structure: { table: [primary chance, filler chance] }
        structures: {
            'lethal:airship': { 'minecraft:chests/trial_chambers/reward': [0.03, 1.0], 'minecraft:chests/trial_chambers/reward_ominous': [0.4, 1.0] },
        },
    },
}

// ShellBound trial spawners eject these every cooldown (with no hostile mobs they never finish a trial,
// but the data stays clean): strip them, add nothing.
const SPAWNER_TABLES = ['shellbound_for_airship:spawners/ship1', 'shellbound_for_airship:spawners/ship1_ominous', 'shellbound_for_airship:spawners/ship5', 'shellbound_for_airship:spawners/ship5_ominous', 'shellbound_for_airship:spawners/ship9', 'shellbound_for_airship:spawners/ship9_ominous']
const SPAWNER_STRIP = ['minecraft:diamond', 'minecraft:emerald', 'minecraft:diamond_sword', 'minecraft:experience_bottle']

// Removed from the kept loot of the strip tiers.
const JUNK = [
    'aeronautics:music_disc_cloud_skipper', 'create:empty_blaze_burner', 'minecraft:amethyst_block',
    'minecraft:amethyst_shard', 'minecraft:angler_pottery_sherd', 'minecraft:anvil',
    'minecraft:archer_pottery_sherd', 'minecraft:arms_up_pottery_sherd', 'minecraft:arrow',
    'minecraft:beetroot_seeds', 'minecraft:blade_pottery_sherd',
    'minecraft:bolt_armor_trim_smithing_template', 'minecraft:bone', 'minecraft:book', 'minecraft:bookshelf',
    'minecraft:bow', 'minecraft:bowl', 'minecraft:brewer_pottery_sherd', 'minecraft:brick',
    'minecraft:brush', 'minecraft:bundle', 'minecraft:burn_pottery_sherd', 'minecraft:cake',
    'minecraft:cartography_table', 'minecraft:carved_pumpkin', 'minecraft:chainmail_boots',
    'minecraft:chainmail_chestplate', 'minecraft:chainmail_helmet', 'minecraft:chainmail_leggings',
    'minecraft:chicken_spawn_egg', 'minecraft:chiseled_bookshelf', 'minecraft:clay_ball', 'minecraft:clock',
    'minecraft:coast_armor_trim_smithing_template', 'minecraft:cobweb', 'minecraft:compass',
    'minecraft:creeper_banner_pattern', 'minecraft:crossbow', 'minecraft:danger_pottery_sherd',
    'minecraft:dead_bush', 'minecraft:diamond_axe', 'minecraft:diamond_block', 'minecraft:diamond_boots',
    'minecraft:diamond_chestplate', 'minecraft:diamond_helmet', 'minecraft:diamond_hoe',
    'minecraft:diamond_horse_armor', 'minecraft:diamond_leggings', 'minecraft:diamond_pickaxe',
    'minecraft:diamond_shovel', 'minecraft:diamond_sword', 'minecraft:disc_fragment_5',
    'minecraft:dragon_head', 'minecraft:dune_armor_trim_smithing_template', 'minecraft:echo_shard',
    'minecraft:egg', 'minecraft:emerald', 'minecraft:emerald_block', 'minecraft:enchanted_book',
    'minecraft:enchanting_table', 'minecraft:ender_pearl', 'minecraft:experience_bottle',
    'minecraft:explorer_pottery_sherd', 'minecraft:eye_armor_trim_smithing_template', 'minecraft:feather',
    'minecraft:fermented_spider_eye', 'minecraft:fire_charge', 'minecraft:firework_rocket',
    'minecraft:fishing_rod', 'minecraft:flow_armor_trim_smithing_template', 'minecraft:flow_banner_pattern',
    'minecraft:flow_pottery_sherd', 'minecraft:flower_banner_pattern', 'minecraft:flower_pot',
    'minecraft:friend_pottery_sherd', 'minecraft:frogspawn', 'minecraft:ghast_tear',
    'minecraft:gilded_blackstone', 'minecraft:glass_bottle', 'minecraft:glistering_melon_slice',
    'minecraft:globe_banner_pattern', 'minecraft:glow_ink_sac', 'minecraft:goat_horn',
    'minecraft:gold_nugget', 'minecraft:golden_apple', 'minecraft:golden_axe', 'minecraft:golden_boots',
    'minecraft:golden_chestplate', 'minecraft:golden_helmet', 'minecraft:golden_hoe',
    'minecraft:golden_horse_armor', 'minecraft:golden_leggings', 'minecraft:golden_pickaxe',
    'minecraft:golden_shovel', 'minecraft:golden_sword', 'minecraft:grindstone',
    'minecraft:guster_banner_pattern', 'minecraft:guster_pottery_sherd', 'minecraft:heart_pottery_sherd',
    'minecraft:heartbreak_pottery_sherd', 'minecraft:host_armor_trim_smithing_template',
    'minecraft:howl_pottery_sherd', 'minecraft:ink_sac', 'minecraft:iron_axe', 'minecraft:iron_boots',
    'minecraft:iron_chestplate', 'minecraft:iron_helmet', 'minecraft:iron_hoe', 'minecraft:iron_horse_armor',
    'minecraft:iron_leggings', 'minecraft:iron_pickaxe', 'minecraft:iron_shovel', 'minecraft:iron_sword',
    'minecraft:lapis_lazuli', 'minecraft:lead', 'minecraft:leather', 'minecraft:leather_boots',
    'minecraft:leather_chestplate', 'minecraft:leather_helmet', 'minecraft:leather_horse_armor',
    'minecraft:leather_leggings', 'minecraft:lectern', 'minecraft:lingering_potion', 'minecraft:map',
    'minecraft:melon_seeds', 'minecraft:miner_pottery_sherd', 'minecraft:mojang_banner_pattern',
    'minecraft:moss_block', 'minecraft:mourner_pottery_sherd', 'minecraft:music_disc_11',
    'minecraft:music_disc_13', 'minecraft:music_disc_5', 'minecraft:music_disc_blocks',
    'minecraft:music_disc_cat', 'minecraft:music_disc_chirp', 'minecraft:music_disc_creator',
    'minecraft:music_disc_creator_music_box', 'minecraft:music_disc_far', 'minecraft:music_disc_mall',
    'minecraft:music_disc_mellohi', 'minecraft:music_disc_otherside', 'minecraft:music_disc_pigstep',
    'minecraft:music_disc_precipice', 'minecraft:music_disc_relic', 'minecraft:music_disc_stal',
    'minecraft:music_disc_strad', 'minecraft:music_disc_wait', 'minecraft:music_disc_ward',
    'minecraft:name_tag', 'minecraft:nautilus_shell', 'minecraft:ochre_froglight',
    'minecraft:pearlescent_froglight', 'minecraft:phantom_membrane', 'minecraft:piglin_banner_pattern',
    'minecraft:plenty_pottery_sherd', 'minecraft:poisonous_potato', 'minecraft:potion',
    'minecraft:prismarine_crystals', 'minecraft:prismarine_shard', 'minecraft:prize_pottery_sherd',
    'minecraft:pufferfish', 'minecraft:pumpkin_seeds', 'minecraft:rabbit_foot', 'minecraft:rabbit_hide',
    'minecraft:rail', 'minecraft:raiser_armor_trim_smithing_template', 'minecraft:recovery_compass',
    'minecraft:rib_armor_trim_smithing_template', 'minecraft:rose_bush', 'minecraft:rotten_flesh',
    'minecraft:saddle', 'minecraft:scrape_pottery_sherd', 'minecraft:sea_lantern', 'minecraft:sea_pickle',
    'minecraft:sentry_armor_trim_smithing_template', 'minecraft:shaper_armor_trim_smithing_template',
    'minecraft:sheaf_pottery_sherd', 'minecraft:shelter_pottery_sherd', 'minecraft:shield',
    'minecraft:silence_armor_trim_smithing_template', 'minecraft:skull_banner_pattern',
    'minecraft:skull_pottery_sherd', 'minecraft:smithing_table', 'minecraft:sniffer_egg',
    'minecraft:snort_pottery_sherd', 'minecraft:snout_armor_trim_smithing_template', 'minecraft:snow_block',
    'minecraft:snowball', 'minecraft:spectral_arrow', 'minecraft:spider_eye', 'minecraft:spider_spawn_egg',
    'minecraft:spire_armor_trim_smithing_template', 'minecraft:splash_potion', 'minecraft:sponge',
    'minecraft:spyglass', 'minecraft:stick', 'minecraft:stone_axe', 'minecraft:stone_hoe',
    'minecraft:stone_pickaxe', 'minecraft:stone_shovel', 'minecraft:stone_sword', 'minecraft:string',
    'minecraft:suspicious_stew', 'minecraft:tide_armor_trim_smithing_template', 'minecraft:tipped_arrow',
    'minecraft:tripwire_hook', 'minecraft:tropical_fish', 'minecraft:verdant_froglight',
    'minecraft:vex_armor_trim_smithing_template', 'minecraft:ward_armor_trim_smithing_template',
    'minecraft:wayfinder_armor_trim_smithing_template', 'minecraft:wet_sponge', 'minecraft:wheat_seeds',
    'minecraft:wild_armor_trim_smithing_template', 'minecraft:wither_rose', 'minecraft:wooden_axe',
    'minecraft:wooden_hoe', 'minecraft:wooden_pickaxe', 'minecraft:wooden_shovel', 'minecraft:wooden_sword',
    'minecraft:writable_book',
]

// The only vanilla items the ground tiers keep from the mods' own loot: metals, redstone, fuel, obsidian,
// the farm starters the pools hand out, and the redstone parts contraptions use. Their food, saplings,
// flowers, wool, planks, torches and nuggets are dropped, so a ground container is mostly Create.
const GROUND_VANILLA = [
    'minecraft:bamboo', 'minecraft:bucket', 'minecraft:charcoal', 'minecraft:coal', 'minecraft:coal_block',
    'minecraft:comparator', 'minecraft:copper_block', 'minecraft:copper_ingot', 'minecraft:diamond',
    'minecraft:gold_ingot', 'minecraft:gunpowder', 'minecraft:hopper', 'minecraft:iron_block',
    'minecraft:iron_ingot', 'minecraft:kelp', 'minecraft:lava_bucket', 'minecraft:observer',
    'minecraft:obsidian', 'minecraft:piston', 'minecraft:pointed_dripstone', 'minecraft:quartz',
    'minecraft:raw_copper', 'minecraft:raw_gold', 'minecraft:raw_iron', 'minecraft:redstone',
    'minecraft:redstone_block', 'minecraft:repeater', 'minecraft:slime_ball', 'minecraft:slime_block',
    'minecraft:sticky_piston', 'minecraft:sugar_cane', 'minecraft:water_bucket',
]

// Nether and End material, levitite, blaze burners: removed from the kept loot of the ground tiers.
const OUTSIDE_SKY = [
    'aeronautics:end_stone_powder', 'aeronautics:levitite', 'aeronautics:levitite_blend_bucket',
    'aeronautics:pearlescent_levitite', 'create:blaze_burner', 'create:blaze_cake', 'create:blaze_cake_base',
    'create:cinder_flour', 'create:empty_blaze_burner', 'create_connected:fan_haunting_catalyst',
    'createbigcannons:bronze_block', 'createbigcannons:bronze_ingot', 'createbigcannons:nethersteel_ingot',
    'createbigcannons:nethersteel_nugget', 'minecraft:ancient_debris', 'minecraft:basalt',
    'minecraft:blackstone', 'minecraft:blaze_powder', 'minecraft:blaze_rod', 'minecraft:breeze_rod',
    'minecraft:brewing_stand', 'minecraft:chiseled_nether_bricks', 'minecraft:chorus_flower',
    'minecraft:chorus_fruit', 'minecraft:crimson_fungus', 'minecraft:crimson_nylium',
    'minecraft:crimson_planks', 'minecraft:crimson_roots', 'minecraft:crimson_stem',
    'minecraft:crying_obsidian', 'minecraft:diamond_block', 'minecraft:dragon_breath',
    'minecraft:echo_shard', 'minecraft:emerald_block', 'minecraft:end_rod', 'minecraft:end_stone',
    'minecraft:end_stone_bricks', 'minecraft:ghast_tear', 'minecraft:gilded_blackstone',
    'minecraft:gold_block', 'minecraft:lodestone', 'minecraft:magma_block', 'minecraft:magma_cream',
    'minecraft:nether_brick', 'minecraft:nether_bricks', 'minecraft:nether_wart',
    'minecraft:nether_wart_block', 'minecraft:netherite_scrap', 'minecraft:netherrack',
    'minecraft:popped_chorus_fruit', 'minecraft:purpur_block', 'minecraft:quartz_block',
    'minecraft:red_nether_bricks', 'minecraft:shroomlight', 'minecraft:shulker_shell',
    'minecraft:soul_campfire', 'minecraft:soul_lantern', 'minecraft:soul_sand', 'minecraft:soul_soil',
    'minecraft:soul_torch', 'minecraft:stripped_warped_stem', 'minecraft:warped_fungus',
    'minecraft:warped_fungus_on_a_stick', 'minecraft:warped_nylium', 'minecraft:warped_planks',
    'minecraft:warped_roots', 'minecraft:warped_stem', 'minecraft:warped_wart_block',
    'minecraft:weeping_vines', 'minecraft:wind_charge',
]

// Never in the loot of these structures (chests, pots, suspicious sand) nor in the ShellBound spawner
// ejections, and, except VANILLA_MAY_KEEP, nowhere else in the world either.
const NEVER_IN_LOOT = [
    'aeronautics_utility_objects:creative_hydraulic_rod', 'cbc_at:creative_heavy_autocannon_ammo_box',
    'cbc_at:twin_autocannon_barrel_mould', 'cbcmoreshells:airdropped_shrapnel_torpedo',
    'cbcmoreshells:airdropped_torpedo', 'cbcmoreshells:ammo_rack', 'cbcmoreshells:antiair_machine_gun_round',
    'cbcmoreshells:antiair_shrapnel_shell', 'cbcmoreshells:antiblast_panel',
    'cbcmoreshells:ap_super_heavy_shot', 'cbcmoreshells:apbc_shell', 'cbcmoreshells:apbc_shot',
    'cbcmoreshells:apfsds_shot', 'cbcmoreshells:apfsds_shot_projectile', 'cbcmoreshells:aphe_bouncing_bomb',
    'cbcmoreshells:aphe_cannon_rocket', 'cbcmoreshells:aphe_loitering_rocket', 'cbcmoreshells:aphe_rocket',
    'cbcmoreshells:assassin_combat_command', 'cbcmoreshells:assembled_early_torpedo_component',
    'cbcmoreshells:assembled_gambler_medium_range_torpedo_component',
    'cbcmoreshells:assembled_highspeed_long_range_torpedo_component',
    'cbcmoreshells:assembled_highspeed_torpedo_component',
    'cbcmoreshells:assembled_light_high_speed_torpedo_component',
    'cbcmoreshells:assembled_long_range_torpedo_component',
    'cbcmoreshells:assembled_medium_range_deepwater_torpedo_component',
    'cbcmoreshells:assembled_medium_range_torpedo_component',
    'cbcmoreshells:assembled_primary_torpedo_component',
    'cbcmoreshells:assembled_reductive_highspeed_torpedo_component',
    'cbcmoreshells:assembled_reductive_long_range_torpedo_component',
    'cbcmoreshells:assembled_reductive_medium_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_long_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_medium_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_reductive_medium_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_reductive_short_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_short_range_torpedo_component',
    'cbcmoreshells:assembled_reinforced_torpedo_head',
    'cbcmoreshells:assembled_short_range_torpedo_component',
    'cbcmoreshells:assembled_slow_long_range_torpedo_component', 'cbcmoreshells:assembled_torpedo_head',
    'cbcmoreshells:assembled_ultraspeed_torpedo_component', 'cbcmoreshells:baguette_shot',
    'cbcmoreshells:baguette_shot_projectile', 'cbcmoreshells:baked_apfsds_shot',
    'cbcmoreshells:baked_apfsds_shot_projectile', 'cbcmoreshells:base_combat_command',
    'cbcmoreshells:beef_noodle', 'cbcmoreshells:berserker_combat_command',
    'cbcmoreshells:brass_dual_cannon_barrel', 'cbcmoreshells:brass_dual_cannon_chamber',
    'cbcmoreshells:brass_dual_cannon_charger', 'cbcmoreshells:brass_dual_cannon_quickfiring_breech',
    'cbcmoreshells:brass_single_cannon_barrel', 'cbcmoreshells:brass_single_cannon_chamber',
    'cbcmoreshells:brass_single_cannon_magazine_breech',
    'cbcmoreshells:brass_single_cannon_quickfiring_breech', 'cbcmoreshells:bronze_dual_cannon_barrel',
    'cbcmoreshells:bronze_dual_cannon_chamber', 'cbcmoreshells:bronze_dual_cannon_quickfiring_breech',
    'cbcmoreshells:bubble_drink', 'cbcmoreshells:cannon_torpedo',
    'cbcmoreshells:cast_iron_dual_cannon_barrel', 'cbcmoreshells:cast_iron_dual_cannon_chamber',
    'cbcmoreshells:cast_iron_dual_cannon_quickfiring_breech', 'cbcmoreshells:combat_command_info',
    'cbcmoreshells:command_deployer', 'cbcmoreshells:command_displayer',
    'cbcmoreshells:damage_combat_command', 'cbcmoreshells:deepwater_shrapnel_torpedo',
    'cbcmoreshells:depth_charge', 'cbcmoreshells:dual_aphe_rocket', 'cbcmoreshells:dual_he_rocket',
    'cbcmoreshells:early_torpedo', 'cbcmoreshells:early_torpedo_component',
    'cbcmoreshells:early_torpedo_mold', 'cbcmoreshells:extended_antiair_he_shell',
    'cbcmoreshells:extended_ap_shot', 'cbcmoreshells:fire_extinguisher',
    'cbcmoreshells:gambler_combat_command', 'cbcmoreshells:gambler_medium_range_torpedo',
    'cbcmoreshells:gambler_medium_range_torpedo_component',
    'cbcmoreshells:gambler_medium_range_torpedo_mold', 'cbcmoreshells:he_bouncing_bomb',
    'cbcmoreshells:he_cannon_rocket', 'cbcmoreshells:he_loitering_rocket', 'cbcmoreshells:he_rocket',
    'cbcmoreshells:highspeed_long_range_torpedo', 'cbcmoreshells:highspeed_long_range_torpedo_component',
    'cbcmoreshells:highspeed_long_range_torpedo_mold', 'cbcmoreshells:highspeed_torpedo',
    'cbcmoreshells:highspeed_torpedo_component', 'cbcmoreshells:highspeed_torpedo_mold',
    'cbcmoreshells:incendiary_he_shell', 'cbcmoreshells:inferior_he_shell',
    'cbcmoreshells:large_brass_dual_cannon_barrel', 'cbcmoreshells:large_brass_dual_cannon_chamber',
    'cbcmoreshells:large_brass_dual_cannon_charger',
    'cbcmoreshells:large_brass_dual_cannon_quickfiring_breech',
    'cbcmoreshells:large_brass_single_cannon_barrel', 'cbcmoreshells:large_brass_single_cannon_chamber',
    'cbcmoreshells:large_brass_single_cannon_chamber_shielded',
    'cbcmoreshells:large_brass_single_cannon_magazine_breech',
    'cbcmoreshells:large_brass_single_cannon_quickfiring_breech',
    'cbcmoreshells:large_slate_alloy_single_cannon_barrel',
    'cbcmoreshells:large_slate_alloy_single_cannon_chamber',
    'cbcmoreshells:large_slate_alloy_single_cannon_chamber_shielded',
    'cbcmoreshells:large_slate_alloy_single_cannon_quickfiring_breech',
    'cbcmoreshells:large_steel_dual_cannon_barrel', 'cbcmoreshells:large_steel_dual_cannon_chamber',
    'cbcmoreshells:large_steel_dual_cannon_charger',
    'cbcmoreshells:large_steel_dual_cannon_quickfiring_breech',
    'cbcmoreshells:large_steel_single_cannon_barrel', 'cbcmoreshells:large_steel_single_cannon_chamber',
    'cbcmoreshells:large_steel_single_cannon_chamber_shielded',
    'cbcmoreshells:large_steel_single_cannon_quickfiring_breech', 'cbcmoreshells:light_high_speed_torpedo',
    'cbcmoreshells:light_high_speed_torpedo_component', 'cbcmoreshells:light_high_speed_torpedo_mold',
    'cbcmoreshells:long_range_shrapnel_torpedo', 'cbcmoreshells:long_range_torpedo',
    'cbcmoreshells:long_range_torpedo_component', 'cbcmoreshells:long_range_torpedo_mold',
    'cbcmoreshells:loot_barrel', 'cbcmoreshells:medium_range_deepwater_torpedo',
    'cbcmoreshells:medium_range_deepwater_torpedo_component',
    'cbcmoreshells:medium_range_deepwater_torpedo_mold',
    'cbcmoreshells:medium_range_deepwater_torpedo_typeb', 'cbcmoreshells:medium_range_torpedo',
    'cbcmoreshells:medium_range_torpedo_component', 'cbcmoreshells:medium_range_torpedo_mold',
    'cbcmoreshells:medium_range_torpedo_typeb', 'cbcmoreshells:military_slate_alloy_dual_cannon_barrel',
    'cbcmoreshells:military_slate_alloy_dual_cannon_chamber',
    'cbcmoreshells:military_slate_alloy_dual_cannon_quickfiring_breech',
    'cbcmoreshells:military_slate_alloy_single_cannon_barrel',
    'cbcmoreshells:military_slate_alloy_single_cannon_chamber',
    'cbcmoreshells:military_slate_alloy_single_cannon_magazine_breech',
    'cbcmoreshells:military_slate_alloy_single_cannon_quickfiring_breech',
    'cbcmoreshells:myopia_combat_command', 'cbcmoreshells:nether_steel_dual_cannon_barrel',
    'cbcmoreshells:nether_steel_dual_cannon_chamber',
    'cbcmoreshells:nether_steel_dual_cannon_quickfiring_breech',
    'cbcmoreshells:nethersteel_quickfiring_breech', 'cbcmoreshells:nethersteel_sliding_breech',
    'cbcmoreshells:normal_antiair_he_shell', 'cbcmoreshells:normal_ap_shell', 'cbcmoreshells:normal_ap_shot',
    'cbcmoreshells:normal_apbc_shell', 'cbcmoreshells:normal_he_shell',
    'cbcmoreshells:normal_incendiary_he_shell', 'cbcmoreshells:normal_sap_shell',
    'cbcmoreshells:primary_torpedo', 'cbcmoreshells:primary_torpedo_component',
    'cbcmoreshells:primary_torpedo_mold', 'cbcmoreshells:racked_torpedo',
    'cbcmoreshells:range_combat_command', 'cbcmoreshells:reductive_highspeed_torpedo',
    'cbcmoreshells:reductive_highspeed_torpedo_component', 'cbcmoreshells:reductive_highspeed_torpedo_mold',
    'cbcmoreshells:reductive_long_range_torpedo', 'cbcmoreshells:reductive_long_range_torpedo_component',
    'cbcmoreshells:reductive_long_range_torpedo_mold', 'cbcmoreshells:reductive_medium_range_torpedo',
    'cbcmoreshells:reductive_medium_range_torpedo_component',
    'cbcmoreshells:reductive_medium_range_torpedo_mold', 'cbcmoreshells:reinforced_long_range_torpedo',
    'cbcmoreshells:reinforced_long_range_torpedo_component',
    'cbcmoreshells:reinforced_long_range_torpedo_mold', 'cbcmoreshells:reinforced_medium_range_torpedo',
    'cbcmoreshells:reinforced_medium_range_torpedo_component',
    'cbcmoreshells:reinforced_medium_range_torpedo_mold',
    'cbcmoreshells:reinforced_reductive_medium_range_torpedo',
    'cbcmoreshells:reinforced_reductive_medium_range_torpedo_component',
    'cbcmoreshells:reinforced_reductive_medium_range_torpedo_mold',
    'cbcmoreshells:reinforced_reductive_short_range_torpedo',
    'cbcmoreshells:reinforced_reductive_short_range_torpedo_component',
    'cbcmoreshells:reinforced_reductive_short_range_torpedo_mold',
    'cbcmoreshells:reinforced_short_range_torpedo', 'cbcmoreshells:reinforced_short_range_torpedo_component',
    'cbcmoreshells:reinforced_short_range_torpedo_mold', 'cbcmoreshells:reinforced_torpedo_head',
    'cbcmoreshells:reload_combat_command', 'cbcmoreshells:rocket_bracket',
    'cbcmoreshells:rosequartz_brass_dual_cannon_barrel',
    'cbcmoreshells:rosequartz_brass_dual_cannon_chamber',
    'cbcmoreshells:rosequartz_brass_dual_cannon_quickfiring_breech', 'cbcmoreshells:sap_shell',
    'cbcmoreshells:sensitive_impact_fuze', 'cbcmoreshells:sharpnel_torpedo',
    'cbcmoreshells:shelless_ap_shot', 'cbcmoreshells:shelless_he_shell',
    'cbcmoreshells:shelless_incendiary_he_shell', 'cbcmoreshells:shelless_sap_shell',
    'cbcmoreshells:ship_proximity_fuze', 'cbcmoreshells:short_range_torpedo',
    'cbcmoreshells:short_range_torpedo_component', 'cbcmoreshells:short_range_torpedo_mold',
    'cbcmoreshells:slate_alloy_dual_cannon_barrel', 'cbcmoreshells:slate_alloy_dual_cannon_chamber',
    'cbcmoreshells:slate_alloy_dual_cannon_charger',
    'cbcmoreshells:slate_alloy_dual_cannon_quickfiring_breech',
    'cbcmoreshells:slate_alloy_single_cannon_barrel', 'cbcmoreshells:slate_alloy_single_cannon_chamber',
    'cbcmoreshells:slate_alloy_single_cannon_magazine_breech',
    'cbcmoreshells:slate_alloy_single_cannon_quickfiring_breech', 'cbcmoreshells:slow_long_range_torpedo',
    'cbcmoreshells:slow_long_range_torpedo_component', 'cbcmoreshells:slow_long_range_torpedo_mold',
    'cbcmoreshells:sniper_combat_command', 'cbcmoreshells:spread_combat_command',
    'cbcmoreshells:steel_ammo_rack', 'cbcmoreshells:steel_dual_cannon_barrel',
    'cbcmoreshells:steel_dual_cannon_chamber', 'cbcmoreshells:steel_dual_cannon_charger',
    'cbcmoreshells:steel_dual_cannon_quickfiring_breech', 'cbcmoreshells:steel_projectile_rack_barrel',
    'cbcmoreshells:steel_projectile_rack_chamber', 'cbcmoreshells:steel_projectile_rack_quickfiring_breech',
    'cbcmoreshells:steel_projectile_rack_stabilizer', 'cbcmoreshells:steel_single_cannon_barrel',
    'cbcmoreshells:steel_single_cannon_chamber', 'cbcmoreshells:steel_single_cannon_magazine_breech',
    'cbcmoreshells:steel_single_cannon_quickfiring_breech', 'cbcmoreshells:steel_torpedo_quickfiring_breech',
    'cbcmoreshells:steel_torpedo_sliding_breechblock', 'cbcmoreshells:steel_torpedo_tube_barrel',
    'cbcmoreshells:steel_torpedo_tube_chamber', 'cbcmoreshells:torpedo_detection_device',
    'cbcmoreshells:torpedo_head', 'cbcmoreshells:tough_steel_dual_cannon_barrel',
    'cbcmoreshells:tough_steel_dual_cannon_chamber',
    'cbcmoreshells:tough_steel_dual_cannon_quickfiring_breech', 'cbcmoreshells:ultraspeed_torpedo',
    'cbcmoreshells:ultraspeed_torpedo_component', 'cbcmoreshells:ultraspeed_torpedo_mold',
    'cbcmoreshells:wide_brass_dual_cannon_barrel', 'cbcmoreshells:wide_brass_dual_cannon_chamber',
    'cbcmoreshells:wide_brass_dual_cannon_charger',
    'cbcmoreshells:wide_brass_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_brass_single_cannon_barrel', 'cbcmoreshells:wide_brass_single_cannon_chamber',
    'cbcmoreshells:wide_brass_single_cannon_chamber_shielded',
    'cbcmoreshells:wide_brass_single_cannon_magazine_breech',
    'cbcmoreshells:wide_brass_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_bronze_single_cannon_barrel', 'cbcmoreshells:wide_bronze_single_cannon_chamber',
    'cbcmoreshells:wide_bronze_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_cast_iron_single_cannon_barrel',
    'cbcmoreshells:wide_cast_iron_single_cannon_chamber',
    'cbcmoreshells:wide_cast_iron_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_military_slate_alloy_dual_cannon_barrel',
    'cbcmoreshells:wide_military_slate_alloy_dual_cannon_chamber',
    'cbcmoreshells:wide_military_slate_alloy_dual_cannon_chamber_shielded',
    'cbcmoreshells:wide_military_slate_alloy_dual_cannon_charger',
    'cbcmoreshells:wide_military_slate_alloy_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_military_slate_alloy_single_cannon_barrel',
    'cbcmoreshells:wide_military_slate_alloy_single_cannon_chamber',
    'cbcmoreshells:wide_military_slate_alloy_single_cannon_chamber_shielded',
    'cbcmoreshells:wide_military_slate_alloy_single_cannon_magazine_breech',
    'cbcmoreshells:wide_military_slate_alloy_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_nether_steel_dual_cannon_barrel',
    'cbcmoreshells:wide_nether_steel_dual_cannon_chamber',
    'cbcmoreshells:wide_nether_steel_dual_cannon_charger',
    'cbcmoreshells:wide_nether_steel_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_rosequartz_brass_dual_cannon_barrel',
    'cbcmoreshells:wide_rosequartz_brass_dual_cannon_chamber',
    'cbcmoreshells:wide_rosequartz_brass_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_slate_alloy_dual_cannon_barrel',
    'cbcmoreshells:wide_slate_alloy_dual_cannon_chamber',
    'cbcmoreshells:wide_slate_alloy_dual_cannon_chamber_shielded',
    'cbcmoreshells:wide_slate_alloy_dual_cannon_charger',
    'cbcmoreshells:wide_slate_alloy_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_slate_alloy_single_cannon_barrel',
    'cbcmoreshells:wide_slate_alloy_single_cannon_chamber',
    'cbcmoreshells:wide_slate_alloy_single_cannon_chamber_shielded',
    'cbcmoreshells:wide_slate_alloy_single_cannon_magazine_breech',
    'cbcmoreshells:wide_slate_alloy_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_steel_dual_cannon_barrel', 'cbcmoreshells:wide_steel_dual_cannon_chamber',
    'cbcmoreshells:wide_steel_dual_cannon_charger',
    'cbcmoreshells:wide_steel_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_steel_single_cannon_barrel', 'cbcmoreshells:wide_steel_single_cannon_chamber',
    'cbcmoreshells:wide_steel_single_cannon_magazine',
    'cbcmoreshells:wide_steel_single_cannon_magazine_breech',
    'cbcmoreshells:wide_steel_single_cannon_quickfiring_breech',
    'cbcmoreshells:wide_tough_steel_dual_cannon_barrel',
    'cbcmoreshells:wide_tough_steel_dual_cannon_chamber',
    'cbcmoreshells:wide_tough_steel_dual_cannon_quickfiring_breech',
    'cbcmoreshells:wide_tough_steel_single_cannon_barrel',
    'cbcmoreshells:wide_tough_steel_single_cannon_chamber',
    'cbcmoreshells:wide_tough_steel_single_cannon_chamber_shielded',
    'cbcmoreshells:wide_tough_steel_single_cannon_quickfiring_breech', 'create:creative_blaze_cake',
    'create:creative_crate', 'create:creative_fluid_tank', 'create:creative_motor',
    'create:handheld_worldshaper', 'create_radar:creative_radar_plate', 'createages:ae2_bundle',
    'createages:mechanism_bundle', 'createages:port_station', 'createages:rarity_bundle',
    'createages:resource_bundle', 'createbigcannons:bronze_block', 'createbigcannons:bronze_cannon_barrel',
    'createbigcannons:bronze_cannon_chamber', 'createbigcannons:bronze_cannon_end',
    'createbigcannons:bronze_ingot', 'createbigcannons:bronze_quickfiring_breech',
    'createbigcannons:bronze_sliding_breech', 'createbigcannons:built_up_nethersteel_cannon_barrel',
    'createbigcannons:built_up_nethersteel_cannon_chamber', 'createbigcannons:cannon_crafting_wand',
    'createbigcannons:creative_autocannon_ammo_container', 'createbigcannons:nethersteel_block',
    'createbigcannons:nethersteel_cannon_barrel', 'createbigcannons:nethersteel_cannon_chamber',
    'createbigcannons:nethersteel_ingot', 'createbigcannons:nethersteel_screw_breech',
    'createbigcannons:thick_nethersteel_cannon_chamber', 'createpropulsion:assembler_stick',
    'createpropulsion:auto_glue', 'createpropulsion:contraption_remover',
    'createpropulsion:creative_thruster', 'createpropulsion:creative_vector_thruster',
    'createpropulsion:glued_contraption_cloner', 'createpropulsion:glued_contraption_mover',
    'minecraft:allay_spawn_egg', 'minecraft:ancient_debris', 'minecraft:armadillo_spawn_egg',
    'minecraft:axolotl_spawn_egg', 'minecraft:bat_spawn_egg', 'minecraft:beacon', 'minecraft:bee_spawn_egg',
    'minecraft:blaze_spawn_egg', 'minecraft:bogged_spawn_egg', 'minecraft:breeze_rod',
    'minecraft:breeze_spawn_egg', 'minecraft:camel_spawn_egg', 'minecraft:cat_spawn_egg',
    'minecraft:cave_spider_spawn_egg', 'minecraft:chicken_spawn_egg', 'minecraft:chorus_fruit',
    'minecraft:cod_spawn_egg', 'minecraft:command_block', 'minecraft:conduit', 'minecraft:cow_spawn_egg',
    'minecraft:creeper_spawn_egg', 'minecraft:dolphin_spawn_egg', 'minecraft:donkey_spawn_egg',
    'minecraft:dragon_breath', 'minecraft:dragon_egg', 'minecraft:dragon_head',
    'minecraft:drowned_spawn_egg', 'minecraft:elder_guardian_spawn_egg', 'minecraft:elytra',
    'minecraft:enchanted_golden_apple', 'minecraft:end_crystal', 'minecraft:ender_chest',
    'minecraft:ender_dragon_spawn_egg', 'minecraft:ender_pearl', 'minecraft:enderman_spawn_egg',
    'minecraft:endermite_spawn_egg', 'minecraft:evoker_spawn_egg', 'minecraft:firework_rocket',
    'minecraft:fox_spawn_egg', 'minecraft:frog_spawn_egg', 'minecraft:ghast_spawn_egg',
    'minecraft:glow_squid_spawn_egg', 'minecraft:goat_spawn_egg', 'minecraft:guardian_spawn_egg',
    'minecraft:heart_of_the_sea', 'minecraft:heavy_core', 'minecraft:hoglin_spawn_egg',
    'minecraft:horse_spawn_egg', 'minecraft:husk_spawn_egg', 'minecraft:iron_golem_spawn_egg',
    'minecraft:llama_spawn_egg', 'minecraft:mace', 'minecraft:magma_cube_spawn_egg',
    'minecraft:mooshroom_spawn_egg', 'minecraft:mule_spawn_egg', 'minecraft:nether_star',
    'minecraft:netherite_axe', 'minecraft:netherite_block', 'minecraft:netherite_boots',
    'minecraft:netherite_chestplate', 'minecraft:netherite_helmet', 'minecraft:netherite_hoe',
    'minecraft:netherite_ingot', 'minecraft:netherite_leggings', 'minecraft:netherite_pickaxe',
    'minecraft:netherite_shovel', 'minecraft:netherite_sword',
    'minecraft:netherite_upgrade_smithing_template', 'minecraft:ocelot_spawn_egg',
    'minecraft:panda_spawn_egg', 'minecraft:parrot_spawn_egg', 'minecraft:phantom_spawn_egg',
    'minecraft:pig_spawn_egg', 'minecraft:piglin_brute_spawn_egg', 'minecraft:piglin_spawn_egg',
    'minecraft:pillager_spawn_egg', 'minecraft:polar_bear_spawn_egg', 'minecraft:pufferfish_spawn_egg',
    'minecraft:rabbit_spawn_egg', 'minecraft:ravager_spawn_egg', 'minecraft:salmon_spawn_egg',
    'minecraft:sheep_spawn_egg', 'minecraft:shulker_box', 'minecraft:shulker_spawn_egg',
    'minecraft:silverfish_spawn_egg', 'minecraft:skeleton_horse_spawn_egg', 'minecraft:skeleton_spawn_egg',
    'minecraft:slime_spawn_egg', 'minecraft:sniffer_spawn_egg', 'minecraft:snow_golem_spawn_egg',
    'minecraft:spawner', 'minecraft:spider_spawn_egg', 'minecraft:squid_spawn_egg',
    'minecraft:stray_spawn_egg', 'minecraft:strider_spawn_egg', 'minecraft:tadpole_spawn_egg',
    'minecraft:tnt', 'minecraft:tnt_minecart', 'minecraft:totem_of_undying',
    'minecraft:trader_llama_spawn_egg', 'minecraft:trial_spawner', 'minecraft:trident',
    'minecraft:tropical_fish_spawn_egg', 'minecraft:turtle_spawn_egg', 'minecraft:vault',
    'minecraft:vex_spawn_egg', 'minecraft:villager_spawn_egg', 'minecraft:vindicator_spawn_egg',
    'minecraft:wandering_trader_spawn_egg', 'minecraft:warden_spawn_egg', 'minecraft:wind_charge',
    'minecraft:witch_spawn_egg', 'minecraft:wither_skeleton_skull', 'minecraft:wither_skeleton_spawn_egg',
    'minecraft:wither_spawn_egg', 'minecraft:wolf_spawn_egg', 'minecraft:zoglin_spawn_egg',
    'minecraft:zombie_horse_spawn_egg', 'minecraft:zombie_spawn_egg', 'minecraft:zombie_villager_spawn_egg',
    'minecraft:zombified_piglin_spawn_egg', 'simulated:creative_physics_staff', 'tacz:gun_smith_table',
    'tacz:workbench_a', 'tacz:workbench_b', 'tacz:workbench_c',
]
// TaCZ variants by id. Any gun or attachment outside the Create Armorer pack, and any ammo other than
// Create Armorer ammo and tacz:12g, is removed as well (TACZ_ALLOWED in the engine), so no other gun pack leaks.
const NEVER_TACZ = [
    'tacz:ammo{AmmoId:create_armorer:melee_weapon}', 'tacz:ammo{AmmoId:tacz:22wmr}',
    'tacz:ammo{AmmoId:tacz:308}', 'tacz:ammo{AmmoId:tacz:30_06}', 'tacz:ammo{AmmoId:tacz:338}',
    'tacz:ammo{AmmoId:tacz:357mag}', 'tacz:ammo{AmmoId:tacz:40mm}', 'tacz:ammo{AmmoId:tacz:45_70}',
    'tacz:ammo{AmmoId:tacz:45acp}', 'tacz:ammo{AmmoId:tacz:46x30}', 'tacz:ammo{AmmoId:tacz:500mag}',
    'tacz:ammo{AmmoId:tacz:50ae}', 'tacz:ammo{AmmoId:tacz:50bmg}', 'tacz:ammo{AmmoId:tacz:545x39}',
    'tacz:ammo{AmmoId:tacz:556x45}', 'tacz:ammo{AmmoId:tacz:57x28}', 'tacz:ammo{AmmoId:tacz:58x42}',
    'tacz:ammo{AmmoId:tacz:68x51fury}', 'tacz:ammo{AmmoId:tacz:762x25}', 'tacz:ammo{AmmoId:tacz:762x39}',
    'tacz:ammo{AmmoId:tacz:762x54}', 'tacz:ammo{AmmoId:tacz:792x57}', 'tacz:ammo{AmmoId:tacz:9mm}',
    'tacz:ammo{AmmoId:tacz:rpg_rocket}', 'tacz:attachment{AttachmentId:create_armorer:extended_mag_ca_3}',
    'tacz:attachment{AttachmentId:tacz:ammo_mod_fmj}', 'tacz:attachment{AttachmentId:tacz:ammo_mod_he}',
    'tacz:attachment{AttachmentId:tacz:ammo_mod_hp}', 'tacz:attachment{AttachmentId:tacz:ammo_mod_i}',
    'tacz:attachment{AttachmentId:tacz:ammo_mod_slug}', 'tacz:attachment{AttachmentId:tacz:bayonet_6h3}',
    'tacz:attachment{AttachmentId:tacz:bayonet_m9}',
    'tacz:attachment{AttachmentId:tacz:deagle_golden_long_barrel}',
    'tacz:attachment{AttachmentId:tacz:extended_mag_1}', 'tacz:attachment{AttachmentId:tacz:extended_mag_2}',
    'tacz:attachment{AttachmentId:tacz:extended_mag_3}', 'tacz:attachment{AttachmentId:tacz:grip_cobra}',
    'tacz:attachment{AttachmentId:tacz:grip_cqr}', 'tacz:attachment{AttachmentId:tacz:grip_magpul_afg_2}',
    'tacz:attachment{AttachmentId:tacz:grip_osovets_black}', 'tacz:attachment{AttachmentId:tacz:grip_rk0}',
    'tacz:attachment{AttachmentId:tacz:grip_rk1_b25u}', 'tacz:attachment{AttachmentId:tacz:grip_rk6}',
    'tacz:attachment{AttachmentId:tacz:grip_se_5}', 'tacz:attachment{AttachmentId:tacz:grip_td}',
    'tacz:attachment{AttachmentId:tacz:grip_vertical_military}',
    'tacz:attachment{AttachmentId:tacz:grip_vertical_ranger}',
    'tacz:attachment{AttachmentId:tacz:grip_vertical_talon}',
    'tacz:attachment{AttachmentId:tacz:laser_compact}', 'tacz:attachment{AttachmentId:tacz:laser_lopro}',
    'tacz:attachment{AttachmentId:tacz:laser_nightstick}', 'tacz:attachment{AttachmentId:tacz:laser_peq15}',
    'tacz:attachment{AttachmentId:tacz:laser_peq6}',
    'tacz:attachment{AttachmentId:tacz:light_extended_mag_1}',
    'tacz:attachment{AttachmentId:tacz:light_extended_mag_2}',
    'tacz:attachment{AttachmentId:tacz:light_extended_mag_3}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_cthulhu}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_cyclone_d2}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_mastiff_sg}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_pioneer}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_timeless50}',
    'tacz:attachment{AttachmentId:tacz:muzzle_brake_trex}',
    'tacz:attachment{AttachmentId:tacz:muzzle_choke_sg}',
    'tacz:attachment{AttachmentId:tacz:muzzle_compensator_trident}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_knight_qd}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_mirage}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_phantom_s1}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_ptilopsis}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_sg}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_ursus}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_vulture}',
    'tacz:attachment{AttachmentId:tacz:muzzle_silencer_wraith}',
    'tacz:attachment{AttachmentId:tacz:oem_stock_heavy}',
    'tacz:attachment{AttachmentId:tacz:oem_stock_light}',
    'tacz:attachment{AttachmentId:tacz:oem_stock_tactical}',
    'tacz:attachment{AttachmentId:tacz:scope_1873_6x}', 'tacz:attachment{AttachmentId:tacz:scope_98k}',
    'tacz:attachment{AttachmentId:tacz:scope_acog_ta31}',
    'tacz:attachment{AttachmentId:tacz:scope_aug_default}',
    'tacz:attachment{AttachmentId:tacz:scope_contender}',
    'tacz:attachment{AttachmentId:tacz:scope_elcan_4x}', 'tacz:attachment{AttachmentId:tacz:scope_hamr}',
    'tacz:attachment{AttachmentId:tacz:scope_lpvo_1_6}', 'tacz:attachment{AttachmentId:tacz:scope_mk5hd}',
    'tacz:attachment{AttachmentId:tacz:scope_qmk152}', 'tacz:attachment{AttachmentId:tacz:scope_retro_2x}',
    'tacz:attachment{AttachmentId:tacz:scope_standard_8x}', 'tacz:attachment{AttachmentId:tacz:scope_vudu}',
    'tacz:attachment{AttachmentId:tacz:shotgun_extended_mag_1}',
    'tacz:attachment{AttachmentId:tacz:shotgun_extended_mag_2}',
    'tacz:attachment{AttachmentId:tacz:shotgun_extended_mag_3}',
    'tacz:attachment{AttachmentId:tacz:sight_552}', 'tacz:attachment{AttachmentId:tacz:sight_acro_pistol}',
    'tacz:attachment{AttachmentId:tacz:sight_acro_rifle}', 'tacz:attachment{AttachmentId:tacz:sight_coyote}',
    'tacz:attachment{AttachmentId:tacz:sight_deltapoint_pistol}',
    'tacz:attachment{AttachmentId:tacz:sight_deltapoint_rifle}',
    'tacz:attachment{AttachmentId:tacz:sight_exp3}',
    'tacz:attachment{AttachmentId:tacz:sight_fastfire_pistol}',
    'tacz:attachment{AttachmentId:tacz:sight_fastfire_rifle}',
    'tacz:attachment{AttachmentId:tacz:sight_okp7}', 'tacz:attachment{AttachmentId:tacz:sight_p90}',
    'tacz:attachment{AttachmentId:tacz:sight_pk06_pistol}',
    'tacz:attachment{AttachmentId:tacz:sight_pk06_rifle}',
    'tacz:attachment{AttachmentId:tacz:sight_rmr_dot}', 'tacz:attachment{AttachmentId:tacz:sight_sro_dot}',
    'tacz:attachment{AttachmentId:tacz:sight_srs_02}', 'tacz:attachment{AttachmentId:tacz:sight_t1}',
    'tacz:attachment{AttachmentId:tacz:sight_t2}', 'tacz:attachment{AttachmentId:tacz:sight_uh1}',
    'tacz:attachment{AttachmentId:tacz:sniper_extended_mag_1}',
    'tacz:attachment{AttachmentId:tacz:sniper_extended_mag_2}',
    'tacz:attachment{AttachmentId:tacz:sniper_extended_mag_3}',
    'tacz:attachment{AttachmentId:tacz:stock_ak12}',
    'tacz:attachment{AttachmentId:tacz:stock_carbon_bone_c5}',
    'tacz:attachment{AttachmentId:tacz:stock_heavy_spas_12}',
    'tacz:attachment{AttachmentId:tacz:stock_hk_slim_line}', 'tacz:attachment{AttachmentId:tacz:stock_m4ss}',
    'tacz:attachment{AttachmentId:tacz:stock_militech_b5}', 'tacz:attachment{AttachmentId:tacz:stock_moe}',
    'tacz:attachment{AttachmentId:tacz:stock_ripstock}', 'tacz:attachment{AttachmentId:tacz:stock_sba3}',
    'tacz:attachment{AttachmentId:tacz:stock_tactical_ar}',
    'tacz:attachment{AttachmentId:tacz:stock_tactical_spas_12}',
    'tacz:modern_kinetic_gun{GunId:create_armorer:special_melee_wrench}',
    'tacz:modern_kinetic_gun{GunId:tacz:aa12}', 'tacz:modern_kinetic_gun{GunId:tacz:ai_awp}',
    'tacz:modern_kinetic_gun{GunId:tacz:ak47}', 'tacz:modern_kinetic_gun{GunId:tacz:aug}',
    'tacz:modern_kinetic_gun{GunId:tacz:b93r}', 'tacz:modern_kinetic_gun{GunId:tacz:cz75}',
    'tacz:modern_kinetic_gun{GunId:tacz:db_long}', 'tacz:modern_kinetic_gun{GunId:tacz:db_short}',
    'tacz:modern_kinetic_gun{GunId:tacz:deagle_golden}', 'tacz:modern_kinetic_gun{GunId:tacz:deagle}',
    'tacz:modern_kinetic_gun{GunId:tacz:fn_evolys}', 'tacz:modern_kinetic_gun{GunId:tacz:fn_fal}',
    'tacz:modern_kinetic_gun{GunId:tacz:g36k}', 'tacz:modern_kinetic_gun{GunId:tacz:glock_17}',
    'tacz:modern_kinetic_gun{GunId:tacz:hk416d}', 'tacz:modern_kinetic_gun{GunId:tacz:hk_g3}',
    'tacz:modern_kinetic_gun{GunId:tacz:hk_mk23}', 'tacz:modern_kinetic_gun{GunId:tacz:hk_mp5a5}',
    'tacz:modern_kinetic_gun{GunId:tacz:kar98}', 'tacz:modern_kinetic_gun{GunId:tacz:lonetrail}',
    'tacz:modern_kinetic_gun{GunId:tacz:m1014}', 'tacz:modern_kinetic_gun{GunId:tacz:m107}',
    'tacz:modern_kinetic_gun{GunId:tacz:m16a1}', 'tacz:modern_kinetic_gun{GunId:tacz:m16a4}',
    'tacz:modern_kinetic_gun{GunId:tacz:m1911}', 'tacz:modern_kinetic_gun{GunId:tacz:m249}',
    'tacz:modern_kinetic_gun{GunId:tacz:m320}', 'tacz:modern_kinetic_gun{GunId:tacz:m4a1}',
    'tacz:modern_kinetic_gun{GunId:tacz:m700}', 'tacz:modern_kinetic_gun{GunId:tacz:m870}',
    'tacz:modern_kinetic_gun{GunId:tacz:m95}', 'tacz:modern_kinetic_gun{GunId:tacz:m9a4}',
    'tacz:modern_kinetic_gun{GunId:tacz:minigun}', 'tacz:modern_kinetic_gun{GunId:tacz:mk14}',
    'tacz:modern_kinetic_gun{GunId:tacz:p320}', 'tacz:modern_kinetic_gun{GunId:tacz:p90}',
    'tacz:modern_kinetic_gun{GunId:tacz:qbz_191}', 'tacz:modern_kinetic_gun{GunId:tacz:qbz_95}',
    'tacz:modern_kinetic_gun{GunId:tacz:rhino357}', 'tacz:modern_kinetic_gun{GunId:tacz:rpg7}',
    'tacz:modern_kinetic_gun{GunId:tacz:rpk}', 'tacz:modern_kinetic_gun{GunId:tacz:scar_h}',
    'tacz:modern_kinetic_gun{GunId:tacz:scar_l}', 'tacz:modern_kinetic_gun{GunId:tacz:sks_tactical}',
    'tacz:modern_kinetic_gun{GunId:tacz:spas_12}', 'tacz:modern_kinetic_gun{GunId:tacz:spr15hb}',
    'tacz:modern_kinetic_gun{GunId:tacz:springfield1873}', 'tacz:modern_kinetic_gun{GunId:tacz:taurus500}',
    'tacz:modern_kinetic_gun{GunId:tacz:taurus943}', 'tacz:modern_kinetic_gun{GunId:tacz:timeless50}',
    'tacz:modern_kinetic_gun{GunId:tacz:type_81}', 'tacz:modern_kinetic_gun{GunId:tacz:ump45}',
    'tacz:modern_kinetic_gun{GunId:tacz:uzi}', 'tacz:modern_kinetic_gun{GunId:tacz:vector45}',
]

// The part of NEVER_IN_LOOT that is no war item: vanilla structures (villages, outposts, trail ruins) and
// monster rooms keep these if their vanilla loot rolls them. Everything else in NEVER_IN_LOOT (explosives,
// flight, pearls, totems, netherite, creative items, cannon parts, hostile-mob spawn eggs...) is removed
// from every chest, vault and archaeology roll in the world.
const VANILLA_MAY_KEEP = [
    'minecraft:conduit', 'minecraft:dragon_egg', 'minecraft:dragon_head', 'minecraft:heart_of_the_sea',
    'minecraft:allay_spawn_egg', 'minecraft:armadillo_spawn_egg', 'minecraft:axolotl_spawn_egg',
    'minecraft:bat_spawn_egg', 'minecraft:bee_spawn_egg', 'minecraft:camel_spawn_egg', 'minecraft:cat_spawn_egg',
    'minecraft:chicken_spawn_egg', 'minecraft:cod_spawn_egg', 'minecraft:cow_spawn_egg',
    'minecraft:dolphin_spawn_egg', 'minecraft:donkey_spawn_egg', 'minecraft:fox_spawn_egg',
    'minecraft:frog_spawn_egg', 'minecraft:glow_squid_spawn_egg', 'minecraft:goat_spawn_egg',
    'minecraft:horse_spawn_egg', 'minecraft:iron_golem_spawn_egg', 'minecraft:llama_spawn_egg',
    'minecraft:mooshroom_spawn_egg', 'minecraft:mule_spawn_egg', 'minecraft:ocelot_spawn_egg',
    'minecraft:panda_spawn_egg', 'minecraft:parrot_spawn_egg', 'minecraft:pig_spawn_egg',
    'minecraft:polar_bear_spawn_egg', 'minecraft:pufferfish_spawn_egg', 'minecraft:rabbit_spawn_egg',
    'minecraft:salmon_spawn_egg', 'minecraft:sheep_spawn_egg', 'minecraft:skeleton_horse_spawn_egg',
    'minecraft:sniffer_spawn_egg', 'minecraft:snow_golem_spawn_egg', 'minecraft:squid_spawn_egg',
    'minecraft:strider_spawn_egg', 'minecraft:tadpole_spawn_egg', 'minecraft:trader_llama_spawn_egg',
    'minecraft:tropical_fish_spawn_egg', 'minecraft:turtle_spawn_egg', 'minecraft:villager_spawn_egg',
    'minecraft:wandering_trader_spawn_egg', 'minecraft:wolf_spawn_egg', 'minecraft:zombie_horse_spawn_egg',
]

// Trial keys and ominous bottles open nothing on this map (no trial chambers, and the Trial Airship's
// vaults are chests): removed from the loot of these structures like junk.
const USELESS_KEYS = ['minecraft:trial_key', 'minecraft:ominous_trial_key', 'minecraft:ominous_bottle']

// ---------------------------------------------------------------------------------------------------
// Engine. Nothing below needs editing to change the loot.

const $BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $SectionPos = Java.loadClass('net.minecraft.core.SectionPos')
const $Registries = Java.loadClass('net.minecraft.core.registries.Registries')
const $DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const $LootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')

const asSet = list => {
    const set = {}
    for (let i = 0; i < list.length; i++) set[list[i]] = true
    return set
}

// 'tacz:ammo{AmmoId:tacz:308}' -> TACZ_BANS['tacz:ammo']['AmmoId']['tacz:308']
const TACZ_BANS = {}
NEVER_TACZ.forEach(spec => {
    const m = /^([^{]+)\{(\w+):(.+)\}$/.exec(spec)
    if (!m) return
    const byKey = TACZ_BANS[m[1]] || (TACZ_BANS[m[1]] = {})
    const values = byKey[m[2]] || (byKey[m[2]] = {})
    values[m[3]] = true
})
// Anything TaCZ that is not Create Armorer (plus tacz:12g, the Armorer shotgun shell) is out as well.
const TACZ_KEYS = { 'tacz:modern_kinetic_gun': 'GunId', 'tacz:ammo': 'AmmoId', 'tacz:attachment': 'AttachmentId' }
const TACZ_ALLOWED = id => id.indexOf('create_armorer:') === 0 || id === 'tacz:12g'

// In the containers of these structures: all of NEVER_IN_LOOT and the useless keys. Anywhere else: the war items.
const NEVER_HERE = asSet(NEVER_IN_LOOT.concat(USELESS_KEYS))
const MAY_KEEP = asSet(VANILLA_MAY_KEEP)
const NEVER_ANYWHERE = asSet(NEVER_IN_LOOT.filter(id => !MAY_KEEP[id]))
const SPAWNER_REMOVE = asSet(JUNK.concat(NEVER_IN_LOOT, USELESS_KEYS, OUTSIDE_SKY, SPAWNER_STRIP))
const GROUND_KEEP = asSet(GROUND_VANILLA)

// Test hook: a test-only script may set lootProbe.listener to see every container this file fills.
const lootProbe = { listener: null }

let reported = {}
const once = (key, message) => {
    if (reported[key]) return
    reported[key] = true
    console.error('[CMP loot] ' + message)
}

const idOf = stack => String(stack.getId())

// ours: the container belongs to one of these structures (its loot table was routed to a tier)
const isBanned = (stack, ours) => {
    const id = idOf(stack)
    if ((ours ? NEVER_HERE : NEVER_ANYWHERE)[id]) return true
    const key = TACZ_KEYS[id]
    if (!key) return false
    const data = stack.get($DataComponents.CUSTOM_DATA)
    const value = data ? String(data.copyTag().getString(key)) : ''
    const listed = TACZ_BANS[id] && TACZ_BANS[id][key] && TACZ_BANS[id][key][value]
    return !!listed || !TACZ_ALLOWED(value)
}

const removeWhere = (loot, test) => {
    const it = loot.iterator()
    while (it.hasNext()) {
        if (test(it.next())) it.remove()
    }
}

// One entry: a template stack plus its count range, and the stacks that drop with it.
const makeDrop = (spec, unknown) => {
    let stack
    try {
        stack = Item.of(spec[0])
    } catch (e) {
        stack = null
    }
    if (!stack || stack.isEmpty()) {
        unknown.push(spec[0])
        return null
    }
    const drop = { stack: stack, min: spec[1], max: spec[2], weight: spec[3] === undefined ? 1 : spec[3], extra: [] }
    const extras = spec[4] || []
    for (let i = 0; i < extras.length; i++) {
        let extra = makeDrop(extras[i], unknown)
        if (extra) drop.extra.push(extra)
    }
    return drop
}

const between = (rnd, min, max) => (max > min ? min + rnd.nextInt(max - min + 1) : min)

const emit = (drop, rnd, out) => {
    out.push(drop.stack.copyWithCount(between(rnd, drop.min, drop.max)))
    for (let i = 0; i < drop.extra.length; i++) emit(drop.extra[i], rnd, out)
}

const pickOne = (group, rnd, out) => {
    let r = rnd.nextInt(group.total)
    for (let i = 0; i < group.drops.length; i++) {
        r -= group.drops[i].weight
        if (r < 0) return emit(group.drops[i], rnd, out)
    }
}

// Pools roll `rolls` weighted picks; jackpots pick exactly one entry.
const makeGroup = (def, kind, filler, unknown) => {
    const drops = []
    def.entries.forEach(spec => {
        const drop = makeDrop(spec, unknown)
        if (drop) drops.push(drop)
    })
    let total = 0
    drops.forEach(d => (total += d.weight))
    return {
        name: def.name, kind: kind, filler: filler, def: def, drops: drops, total: total,
        rolls: kind === 'pool' ? def.rolls : [1, 1],
    }
}

// The groups a container rolls, each with the chance that it rolls at all.
const gatesFor = (tier, table, structures, p, q) => {
    const gates = []
    tier.groups.forEach(group => {
        const def = group.def
        if (group.total <= 0) return
        if (def.tables && def.tables.indexOf(table) < 0) return
        if (def.structures && !structures.every(s => def.structures.indexOf(s) >= 0)) return
        let chance = def.chance === undefined ? 1 : def.chance
        if (def.chanceByTable && def.chanceByTable[table] !== undefined) chance = def.chanceByTable[table]
        const gate = def.always ? q * chance : group.filler ? (1 - p) * q * chance : p * chance
        if (gate > 0) gates.push({ group: group, gate: gate })
    })
    return gates
}

// table id -> { unique: role, byStructure: { structure id: role } }
let ROUTES = {}

const buildRoutes = () => {
    const unknown = []
    const routes = {}
    let roles = 0
    Object.keys(TIERS).forEach(name => {
        const tier = TIERS[name]
        const strip = tier.vanilla === 'strip'
            ? asSet(JUNK.concat(tier.ground ? OUTSIDE_SKY : [], tier.stripExtra || [])) : null
        const built = { name: name, replace: tier.vanilla === 'replace', strip: strip, ground: !!tier.ground, groups: [] }
        tier.pools.forEach(def => built.groups.push(makeGroup(def, 'pool', false, unknown)))
        tier.jackpots.forEach(def => built.groups.push(makeGroup(def, 'jackpot', false, unknown)))
        tier.fillerPools.forEach(def => built.groups.push(makeGroup(def, 'pool', true, unknown)))
        tier.fillerJackpots.forEach(def => built.groups.push(makeGroup(def, 'jackpot', true, unknown)))
        Object.keys(tier.tables).forEach(table => {
            const row = tier.tables[table]
            const route = routes[table] || (routes[table] = { unique: null, byStructure: {} })
            route.unique = { tier: built, table: table, p: row[0], q: row[1], gates: gatesFor(built, table, row[2], row[0], row[1]) }
            roles++
        })
        Object.keys(tier.structures).forEach(structure => {
            const tables = tier.structures[structure]
            Object.keys(tables).forEach(table => {
                const row = tables[table]
                const route = routes[table] || (routes[table] = { unique: null, byStructure: {} })
                route.byStructure[structure] = {
                    tier: built, table: table, structure: structure, p: row[0], q: row[1],
                    gates: gatesFor(built, table, [structure], row[0], row[1]),
                }
                roles++
            })
        })
    })
    ROUTES = routes
    reported = {}
    if (unknown.length > 0) console.error('[CMP loot] Unknown items left out of the loot: ' + unknown.join(', '))
    const stray = VANILLA_MAY_KEEP.filter(id => NEVER_IN_LOOT.indexOf(id) < 0)
    if (stray.length > 0) console.error('[CMP loot] VANILLA_MAY_KEEP entries not in NEVER_IN_LOOT: ' + stray.join(', '))
    console.info('[CMP loot] ' + roles + ' container roles over ' + Object.keys(routes).length + ' loot tables')
}

// The structure whose pieces contain the container, among the ones this table is listed for. A
// container that sits in no piece at all falls back to a listed structure whose bounds contain it.
// (StructureManager.getStructureWithPieceAt is overloaded in a way Rhino cannot pick from, so the
// starts are walked here.)
const findStructure = (level, pos, candidates) => {
    const manager = level.structureManager()
    const refs = manager.getAllStructuresAt(pos)
    if (refs.isEmpty()) return null
    const registry = level.registryAccess().registryOrThrow($Registries.STRUCTURE)
    const section = $SectionPos.of(pos)
    let inPiece = null
    let inAnyPiece = false
    let inBounds = null
    const it = refs.keySet().iterator()
    while (it.hasNext()) {
        let structure = it.next()
        let id = String(registry.getKey(structure))
        let wanted = !candidates || !!candidates[id]
        let starts = manager.startsForStructure(section, structure)
        for (let i = 0; i < starts.size(); i++) {
            let start = starts.get(i)
            if (manager.structureHasPieceAt(pos, start)) {
                inAnyPiece = true
                if (wanted && !inPiece) inPiece = id
            } else if (wanted && !inBounds && start.getBoundingBox().isInside(pos)) {
                inBounds = id
            }
        }
    }
    return inPiece || (inAnyPiece ? null : inBounds)
}

// Decorated pots and suspicious sand or gravel (vanilla or Lootr's) hold one stack: they keep their own
// loot, stripped like the tier's, and get no pools.
const holdsOneStack = (level, pos) => {
    const block = String(level.getBlockState(pos).getBlock().getDescriptionId())
    return block.indexOf('decorated_pot') >= 0 || block.indexOf('suspicious') >= 0
}

// The tier's strip list, and on the ground tiers every vanilla item outside GROUND_VANILLA.
const stripped = (tier, id) => !!tier.strip[id] || (tier.ground && id.indexOf('minecraft:') === 0 && !GROUND_KEEP[id])

const fill = (ctx, loot) => {
    const table = String(ctx.getQueriedLootTableId())
    const route = ROUTES[table]
    if (!route) return
    const origin = ctx.getParamOrNull($LootContextParams.ORIGIN)
    const level = ctx.getLevel()
    const pos = origin ? $BlockPos.containing(origin) : null
    let role = route.unique
    let structure = null
    if (Object.keys(route.byStructure).length > 0) {
        structure = pos ? findStructure(level, pos, route.byStructure) : null
        if (structure) role = route.byStructure[structure]
    } else if (lootProbe.listener && pos) {
        structure = findStructure(level, pos, null)
    }
    if (!role) return

    const tier = role.tier
    if (tier.replace) loot.clear()
    else removeWhere(loot, stack => stripped(tier, idOf(stack)) || isBanned(stack, true))
    const kept = loot.size()
    const pot = pos !== null && holdsOneStack(level, pos)

    const rnd = ctx.getRandom()
    const added = []
    const fired = []
    if (!pot) {
        role.gates.forEach(g => {
            if (rnd.nextFloat() >= g.gate) return
            fired.push(g.group.name)
            if (g.group.kind === 'jackpot') return pickOne(g.group, rnd, added)
            const rolls = between(rnd, g.group.rolls[0], g.group.rolls[1])
            for (let i = 0; i < rolls; i++) pickOne(g.group, rnd, added)
        })
    }

    if (lootProbe.listener) {
        lootProbe.listener({
            table: table, structure: structure || (role.structure || ''), tier: tier.name, p: role.p, q: role.q, pot: pot,
            kept: kept, fired: fired, gates: pot ? [] : role.gates.map(g => [g.group.name, g.gate]),
            added: added.map(s => [idOf(s), s.getCount(), s.get($DataComponents.CUSTOM_DATA) ? String(s.get($DataComponents.CUSTOM_DATA)) : '']),
        })
    }

    added.forEach(stack => {
        // Containers are filled slot by slot, so oversized stacks (two buckets) are split here.
        let left = stack
        while (left.getCount() > left.getMaxStackSize()) loot.addItem(left.split(left.getMaxStackSize()))
        loot.addItem(left)
    })
}

LootJS.lootTables(event => {
    // Report tables the data names that no longer exist (a structure mod was removed or renamed them).
    const missing = []
    const listed = {}
    Object.keys(TIERS).forEach(name => {
        const tier = TIERS[name]
        Object.keys(tier.tables).forEach(t => (listed[t] = true))
        Object.keys(tier.structures).forEach(s => Object.keys(tier.structures[s]).forEach(t => (listed[t] = true)))
    })
    SPAWNER_TABLES.forEach(t => (listed[t] = true))
    Object.keys(listed).forEach(t => {
        if (!event.hasLootTable(t)) missing.push(t)
    })
    if (missing.length > 0) console.warn('[CMP loot] Loot tables named in loot.js that do not exist: ' + missing.join(', '))
})

LootJS.modifiers(event => {
    buildRoutes()

    event.addTableModifier(LootType.CHEST, LootType.VAULT, LootType.ARCHAEOLOGY).customAction((ctx, loot) => {
        try {
            fill(ctx, loot)
        } catch (e) {
            once(String(ctx.getQueriedLootTableId()), 'Failed to fill ' + ctx.getQueriedLootTableId() + ': ' + e)
        }
    })

    // The war-item bans run after everything else, on every chest, vault and archaeology roll in the world
    // (fill already removed the rest of NEVER_IN_LOOT from the containers of these structures).
    event.addTableModifier(LootType.CHEST, LootType.VAULT, LootType.ARCHAEOLOGY).customAction((ctx, loot) =>
        removeWhere(loot, stack => isBanned(stack, false)))
    event.addTableModifier(SPAWNER_TABLES).customAction((ctx, loot) =>
        removeWhere(loot, stack => SPAWNER_REMOVE[idOf(stack)] || isBanned(stack, true)))
})
