// Season 2 deposits (blocks and items in startup_scripts/s2_deposits.js).
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
    sulfur: 'kubejs:sulfur',
    oil: 'kubejs:oil_sand',
    latex: 'kubejs:latex'
}

ServerEvents.recipes(event => {
    Object.keys(DEPOSITS).forEach(type => {
        event.custom({
            type: 'create_rns:mining',
            deposit_block: 'kubejs:' + type + '_deposit',
            yields: [{ items: [{ item: DEPOSITS[type] }] }]
        }).id('cmp:s2/mining/' + type)
    })

    // The Deposit Scanner only finds deposits Rock & Stone generated itself, and S2 has none.
    event.remove({ output: 'create_rns:deposit_scanner' })

    // Latex mixes into rubber (belts.js makes belts from rubber).
    event.custom({
        type: 'create:mixing',
        ingredients: [{ item: 'kubejs:latex' }, { item: 'kubejs:latex' }],
        results: [{ id: 'kubejs:rubber' }]
    }).id('cmp:s2/mixing/rubber')

    // The pressed mechanism replaces Create: Ages' andesite mechanism as the base of the cast iron and
    // bronze cannon mechanisms (artillery_mechanisms.js).
    event.custom({
        type: 'create:pressing',
        ingredients: [{ item: 'create:andesite_alloy' }],
        results: [{ id: 'kubejs:pressed_mechanism' }]
    }).id('cmp:s2/pressing/pressed_mechanism')
})

const CmpDepositTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const CmpDepositRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const CmpDepositId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CMP_DEPOSIT_BLOCKS = CmpDepositTagKey.create(CmpDepositRegistries.BLOCK, CmpDepositId.parse('create_rns:deposit_blocks'))

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
