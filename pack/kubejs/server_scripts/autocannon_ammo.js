// Autocannon rounds take less gunpowder (Peterhun_ asked, Vlad picked the numbers, 2026-11-16).
// A round took one whole gunpowder to fill, so a rich sulfur vein (125 gunpowder an hour) fed about 25 seconds of
// fire. Filling now takes 3 Pinches of Gunpowder, a third of one (Big Cannons: 1 gunpowder = 9 pinches, both ways),
// in 3 Deployer passes. The rounds that take gunpowder themselves give 4 a craft, not 2: a quarter gunpowder each.
// Left alone: the AP round (no gunpowder), machine gun rounds (1 pinch on a Deployer already), the heavy autocannon's
// cartridge (Advanced Technologies counts its gunpowder in code) and every big cannon charge.
ServerEvents.recipes(event => {
    const partlyFilled = 'createbigcannons:partially_filled_autocannon_cartridge'

    event.remove({ id: 'createbigcannons:sequenced_assembly/filling_autocannon_cartridge' })
    event.custom({
        type: 'create:sequenced_assembly',
        ingredient: { item: 'createbigcannons:empty_autocannon_cartridge' },
        transitional_item: { id: partlyFilled },
        loops: 3,
        sequence: [{
            type: 'create:deploying',
            ingredients: [{ item: partlyFilled }, { tag: 'createbigcannons:gunpowder_pinch' }],
            results: [{ id: partlyFilled }]
        }],
        results: [{ id: 'createbigcannons:filled_autocannon_cartridge' }]
    }).id('cmp:autocannon/filling_cartridge')

    // The same shapes as the mods' own recipes, 4 out. HE-I takes sulfur where the mod writes blaze powder, like every
    // other blaze powder recipe this season (s2_recipes.js, #33): written out here so it does not hang on script order.
    function rounds(removed, output, pattern, key) {
        event.remove({ id: removed })
        event.custom({
            type: 'minecraft:crafting_shaped',
            category: 'misc',
            pattern: pattern,
            key: key,
            result: { id: output, count: 4 }
        }).id('cmp:autocannon/' + output.split(':')[1])
    }
    const gunpowder = { tag: 'createbigcannons:gunpowder' }
    const ironSheet = { tag: 'c:plates/iron' }
    rounds('createbigcannons:flak_autocannon_round', 'createbigcannons:flak_autocannon_round', ['S', 'G', 'C'],
        { S: { item: 'createbigcannons:shot_balls' }, G: gunpowder, C: ironSheet })
    rounds('cbc_at:munition/autocannon/he_item', 'cbc_at:he_item', ['G', 'C'], { G: gunpowder, C: ironSheet })
    rounds('cbc_at:munition/autocannon/hei_item', 'cbc_at:hei_item', ['B', 'G', 'C'],
        { B: { item: 'cmpveins:sulfur' }, G: gunpowder, C: ironSheet })
})
