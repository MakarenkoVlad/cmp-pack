// Six rubber make two belts (the pattern Create: Ages used). Season 2 rubber comes from latex deposits
// and the city generators (cmpveins:rubber).
ServerEvents.recipes(event => {
    event.remove({ output: 'create:belt_connector' })
    event.shaped(Item.of('create:belt_connector', 2), [
        'AAA',
        'AAA'
    ], {
        A: 'cmpveins:rubber'
    }).id('cmp:crafting/belt_connector')
})
