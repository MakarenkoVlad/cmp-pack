// Six rubber make two belts (the pattern Create: Ages used). Season 2 rubber comes from latex deposits
// and the city generators (kubejs:rubber, startup_scripts/s2_deposits.js).
ServerEvents.recipes(event => {
    event.remove({ output: 'create:belt_connector' })
    event.shaped(Item.of('create:belt_connector', 2), [
        'AAA',
        'AAA'
    ], {
        A: 'kubejs:rubber'
    }).id('cmp:crafting/belt_connector')
})
