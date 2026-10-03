// Create: Ages' economy is turned off: the Shop (buys creative motors, elytras, totems, netherite and enchanted
// books for Shipment Points) and the Package Assembler (turns machines, ores, crops, fish and mob drops into
// Shipment Points). Neither has a recipe, and the c:hidden_from_recipe_viewers tag keeps them out of EMI and
// JEI, together with the packages only the Package Assembler makes and the Port Station that ships them, which
// never had a recipe. On 2026-10-03 none of the 30 players who had joined Season 1 had crafted, placed or
// carried either block, and nobody had any Shipment Points (no createages_shipment_credits.dat).
const CMP_AGES_SHOP_OFF = ['createages:shop', 'createages:package_assembler']
const CMP_AGES_SHOP_HIDDEN = CMP_AGES_SHOP_OFF.concat([
    'createages:andesite_package',
    'createages:supply_package',
    'createages:machine_package',
    'createages:port_station',
])

ServerEvents.recipes(event => {
    CMP_AGES_SHOP_OFF.forEach(id => event.remove({ output: id }))
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_AGES_SHOP_HIDDEN)
})
