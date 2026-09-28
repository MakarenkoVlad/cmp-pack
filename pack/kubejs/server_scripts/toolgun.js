// Create Aeronautics: Toolgun's magnetic gun grabs, drags and throws any physics structure within 24 blocks,
// enemy airships included, and checks no claims. It is turned off: no recipe, so nobody can make one, and the
// c:hidden_from_recipe_viewers tag keeps it out of EMI and JEI. The rest of the Toolgun stays as the mod ships it.
ServerEvents.recipes(event => {
    event.remove({ output: 'create_aeronautics_toolgun:magnetic_gun' })
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', 'create_aeronautics_toolgun:magnetic_gun')
})
