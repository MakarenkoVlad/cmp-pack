// Season 2 deposits (the blocks and items are the CMP Veins mod, cmpveins/).
//
// Each deposit gives only its own output: one create_rns:mining recipe per deposit, one yield, no catalysts.
// Veridium, Ochrum, Crimsite and Asurine give their Create stone, which crushes into copper, gold, iron and
// zinc at plain Create amounts. Rock & Stone's own deposit blocks keep their recipes but never generate.
//
// Deposits are fixed for the whole season, so they are protected the way lootr_protection.js protects Lootr
// containers: no drill, saw or Big Cannons shot breaks them, nothing moves them, no airship assembles them,
// and only a player in creative mode breaks one by hand. Rock & Stone itself already makes them blast-proof
// (resistance 1200) and drop nothing. Staff restore a damaged site by re-running its line of the site
// function (worldgen/s2/sites.py).
const DEPOSITS = {
    veridium: 'create:veridium',
    ochrum: 'create:ochrum',
    crimsite: 'create:crimsite',
    asurine: 'create:asurine',
    bone_meal: 'minecraft:bone_meal',
    sulfur: 'cmpveins:sulfur',
    oil: 'cmpveins:oil_sand',
    latex: 'cmprubber:latex',
    amethyst: 'minecraft:amethyst_shard'
}
// The share of a drill's operations that give an item, per material (Vlad, 2026-11-06). At miningSpeed 4 and 256 RPM a small vein does 108
// operations an hour, a medium 400, a rich 500. Metals come out at about twice what one player's City Generator gives an hour (crushing
// gives 0.889 copper, 0.444 iron, 0.333 zinc and 0.222 gold a stone): a small vein makes 48 iron, 48 copper, 27 zinc, 12 gold an hour.
// Oil follows Vlad's rule that a small vein feeds 1 gasoline chunk loader, a medium 2, a big one 3: one oil sand is 125 mB of gasoline, and
// 1, 2, 3 and 4 loaders of a crew burn 10.7, 26.7, 48 and 74.7 oil sand an hour, so 0.11 gives 12, 44 and 55 an hour.
const CMP_DEPOSIT_RATE = {
    crimsite: 1.0,
    asurine: 0.75,
    veridium: 0.5,
    ochrum: 0.5,
    sulfur: 0.5,
    bone_meal: 0.5,
    latex: 0.375,
    amethyst: 0.25,
    oil: 0.11
}

const CMP_RNS_UNUSED = ['create_rns:deposit_scanner', 'create_rns:resonator', 'create_rns:shattering_resonator',
    'create_rns:stabilizing_resonator', 'create_rns:resonance_buffer', 'create_rns:resonant_amethyst',
    'create_rns:polished_resonant_amethyst', 'create_rns:redstone_small_dust']

ServerEvents.recipes(event => {
    Object.keys(DEPOSITS).forEach(type => {
        event.custom({
            type: 'create_rns:mining',
            deposit_block: 'cmpveins:' + type + '_deposit',
            yields: [{ chance: CMP_DEPOSIT_RATE[type], items: [{ item: DEPOSITS[type] }] }]
        }).id('cmp:s2/mining/' + type)
    })

    // Rock & Stone's own deposits never generate, so their mining recipes would only tell players about veins that aren't
    // there, with diamonds and emeralds in them. Its scanner only finds those deposits, and its resonators only change their
    // yields: the season's veins have one yield and no catalysts.
    event.remove({ id: /^create_rns:.*_deposit_block$/ })
    CMP_RNS_UNUSED.forEach(id => event.remove({ output: id }))

    // Latex mixes into rubber (belts.js makes belts from rubber).
    event.custom({
        type: 'create:mixing',
        ingredients: [{ item: 'cmprubber:latex' }, { item: 'cmprubber:latex' }],
        results: [{ id: 'cmpveins:rubber' }]
    }).id('cmp:s2/mixing/rubber')

    // Oil sand melts into crude oil in a heated mixer (#5): a Create Propulsion solid burner on charcoal heats it, no
    // blaze needed. The Diesel Generators tower then splits 100 mB crude into 50 mB diesel and 50 mB gasoline on
    // ordinary heat (the mod's own crude_oil distillation), so one oil sand gives 125 mB of each and 4 oil sand a
    // bucket of fuel. Playtest number: a thruster at full throttle burns a bucket in about 42 minutes
    // (thruster_fuels.js), so 16 oil sand (a canister) runs four thrusters for a trip of about 40 minutes.
    event.custom({
        type: 'create:mixing',
        ingredients: [{ item: 'cmpveins:oil_sand' }],
        results: [{ id: 'createdieselgenerators:crude_oil', amount: 250 }],
        heat_requirement: 'heated'
    }).id('cmp:s2/mixing/crude_oil')

    // Sulfur and charcoal mix into gunpowder, the only source of it in Season 2 (#7, #31; s2_recipes.js takes out the
    // others). Playtest number: one of each makes two.
    event.custom({
        type: 'create:mixing',
        ingredients: [{ item: 'cmpveins:sulfur' }, { item: 'minecraft:charcoal' }],
        results: [{ id: 'minecraft:gunpowder', count: 2 }]
    }).id('cmp:s2/mixing/gunpowder')

    // The pressed mechanism replaces Create: Ages' andesite mechanism as the base of the cast iron and
    // bronze cannon mechanisms (artillery_mechanisms.js).
    event.custom({
        type: 'create:pressing',
        ingredients: [{ item: 'create:andesite_alloy' }],
        results: [{ id: 'cmpveins:pressed_mechanism' }]
    }).id('cmp:s2/pressing/pressed_mechanism')
})

const CmpDepositTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const CmpDepositRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const CmpDepositId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CMP_DEPOSIT_BLOCKS = CmpDepositTagKey.create(CmpDepositRegistries.BLOCK, CmpDepositId.parse('create_rns:deposit_blocks'))

// The recipe viewers show the season's veins and nothing of Rock & Stone's that isn't in the game.
ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_RNS_UNUSED)
    event.add('c:hidden_from_recipe_viewers', /^create_rns:.*_deposit_block$/)
})

ServerEvents.tags('block', event => {
    event.add('create:non_breakable', '#create_rns:deposit_blocks')
    event.add('create:non_movable', '#create_rns:deposit_blocks')
    event.add('simulated:non_movable', '#create_rns:deposit_blocks')
})

NativeEvents.onEvent('rbasamoyai.createbigcannons.events.ProjectileDamageEvent', event => {
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
    try {
        if (event.getLevel().getBlockState(event.getPos())['is(net.minecraft.tags.TagKey)'](CMP_DEPOSIT_BLOCKS)) event.setCanceled(true)
    } catch (err) {
        console.error('deposit protection (Big Cannons shot): ' + err)
    }
})

BlockEvents.broken(event => {
    if (event.block.hasTag('create_rns:deposit_blocks') && !(event.player && event.player.isCreative())) event.cancel()
})
