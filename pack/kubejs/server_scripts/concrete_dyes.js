// Concrete recoloured in bulk (Peterhun_, 2026-11-19: "can we have bulk coloring recipes regarding the concretes?").
// Vanilla colours concrete only once, as powder: a dye, 4 sand and 4 gravel make 8. Here a dye and 8 concrete of any
// other colours, mixed or not, make 8 of the dye's colour, and the same for concrete powder: 16 colours, 32 recipes.
// They are shapeless, like vanilla's wool dyeing, so a Create mixer over a basin runs them too
// (allowShapelessInMixer in server/config/create-server.toml). As in the wool recipes, a block of the dye's own colour
// does not count, so no recipe spends a dye on nothing. The dye is anything in the c:dyes/<colour> tag (the vanilla dye).
const CMP_CONCRETE_COLOURS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray',
    'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']

ServerEvents.recipes(event => {
    ['concrete', 'concrete_powder'].forEach(kind => {
        CMP_CONCRETE_COLOURS.forEach(colour => {
            let others = CMP_CONCRETE_COLOURS.filter(other => other != colour).map(other => 'minecraft:' + other + '_' + kind)
            let ingredients = ['#c:dyes/' + colour]
            for (let i = 0; i < 8; i++) ingredients.push(others)
            event.shapeless(Item.of('minecraft:' + colour + '_' + kind, 8), ingredients).id('cmp:concrete/dye_' + colour + '_' + kind)
        })
    })
})
