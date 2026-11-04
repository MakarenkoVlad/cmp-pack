// Use Power Grid's circuit throughout CC Better Recipes. Advanced computers must
// be upgraded from a normal computer; remove the standalone glass-pane recipe.
ServerEvents.recipes(event => {
    event.remove({ output: 'computercraft:computer_advanced', input: '#c:glass_panes' })
    event.remove({ output: 'ccbr:integrated_circuit' })
    event.replaceInput({ input: 'ccbr:integrated_circuit' },
        'ccbr:integrated_circuit', 'powergrid:integrated_circuit')

    // Add this after replacing inputs so existing circuits still convert 1:1.
    event.shapeless('powergrid:integrated_circuit', 'ccbr:integrated_circuit')
        .id('cmp:crafting/integrated_circuit_from_ccbr')
})

ServerEvents.tags('item', event => {
    event.remove('ccbr:advanced_integrated_circuits', 'ccbr:integrated_circuit')
    event.add('ccbr:advanced_integrated_circuits', 'powergrid:integrated_circuit')
    event.add('c:hidden_from_recipe_viewers', 'ccbr:integrated_circuit')
})
