// Six cured rubber make two belts, keeping the Create: Ages crafting pattern.
ServerEvents.recipes(event => {
    event.remove({ output: 'create:belt_connector' })
    event.shaped(Item.of('create:belt_connector', 2), [
        'AAA',
        'AAA'
    ], {
        A: 'createages:cured_rubber'
    }).id('cmp:crafting/belt_connector')
})
