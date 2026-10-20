// The netherite upgrade and blaze upgrade smithing templates are bought with airdrop coins in /shop (shop.js),
// and the Nether is locked, so they can't be copied: the vanilla copy recipe
// (template + 7 diamonds + netherrack = 2) and Create: Dragons Plus's (template + 7 blaze rods + netherrack = 2)
// are removed. Using a template in a smithing table still works: netherite gear, and a blaze burner into a
// Blaze Forger (with an anvil) or a Blaze Enchanter (with an enchanting table) from Create: Enchantment Industry.
ServerEvents.recipes(event => {
    event.remove({ id: 'minecraft:netherite_upgrade_smithing_template' })
    event.remove({ id: 'create_dragons_plus:crafting/blaze_upgrade_smithing_template' })
})
