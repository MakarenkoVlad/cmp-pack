// End crystals stay out of the game: loot.js keeps them out of every container, and with the Nether and End locked
// nothing gives the parts of the vanilla recipe (7 glass, an eye of ender and a ghast tear). This keeps it that way
// should one of them come back, in the shop (which sold ghast tears, ender pearls and blaze rods in its first draft)
// or anywhere else: every recipe for one is removed, and the c:hidden_from_recipe_viewers tag keeps the crystal out
// of EMI and JEI.
ServerEvents.recipes(event => {
    event.remove({ output: 'minecraft:end_crystal' })
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', 'minecraft:end_crystal')
})
