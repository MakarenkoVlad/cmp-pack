// Season 2 bans (#27, #34) and the first-expedition recipe swaps (#33, below): no Ender Chests, Ender Pearls, Eyes of Ender, boats or chest boats, crafted or found.
//
// Use is banned server-wide in pack/config/openpartiesandclaims-server.toml (completelyDisabledItemInteractions:
// pearls, eyes, #minecraft:boats, #minecraft:chest_boats; completelyDisabledBlockInteractions: ender chests), in a
// claim or not: nobody throws a pearl (so no pearl stasis either), uses an eye, places a boat or opens an Ender Chest.
// Here every recipe that makes one goes, and EMI hides them (the c:hidden_from_recipe_viewers tag, as numismatics.js
// does). S2 has no loot chests (no structures), no endermen (cmpwar noHostileMobs) and no villagers, and Create Sifting
// left the pack in stage 1, so nothing else makes them.
const CMP_S2_BANNED = ['minecraft:ender_chest', 'minecraft:ender_eye', 'minecraft:ender_pearl', '#minecraft:boats', '#minecraft:chest_boats']

ServerEvents.recipes(event => {
    CMP_S2_BANNED.forEach(output => event.remove({ output: output }))
    // Amethyst takes the pearl's place in every recipe that used one: the chunk loader, the wireless and advanced
    // modems (#34), and anything else, which would otherwise have no source at all.
    event.replaceInput({ input: 'minecraft:ender_pearl' }, 'minecraft:ender_pearl', 'minecraft:amethyst_shard')
    // Recipe audit (#33, stage 2): the Nether is locked, so nothing gives netherrack, and the empty blaze burner needs
    // one. Charcoal stands in. That makes the Diesel Generators liquid burner (the refinery's heat, #5) craftable; a
    // blaze burner still needs a blaze to work, and filled ones come from the shop only.
    event.replaceInput({ output: 'create:empty_blaze_burner' }, '#c:netherracks', 'minecraft:charcoal')
    // No coal ore on the islands: 9 charcoal press into a coal block ("charcoal for coal", #33). The Aeronautics hot-air
    // burner takes a coal block (tag aeronautics:burner_fire), and the block crafts back into coal for anything else.
    event.shapeless('minecraft:coal_block', ['9x minecraft:charcoal']).id('cmp:s2/coal_block_from_charcoal')
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_S2_BANNED)
})
