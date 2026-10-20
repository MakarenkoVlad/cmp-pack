// Create Encased 1.9 added andesite, zinc and brass versions of Create's steam engine and fluid parts, crafted
// from ingots, sheets and casings. Create: Ages makes the Create parts from its machines (a steam engine takes an
// Andesite, a Copper and a Brass Machine, the fluid parts a Copper Machine), and it came out before Encased 1.9,
// so the Encased versions skipped those machines. They are now cut from the Create part in a stonecutter, one for
// one, and cut back the same way: only the look changes. Encased's steam whistles and valve handles stay as they
// are, since Ages leaves the Create ones alone too.
const CMP_ENCASED_MATERIALS = ['andesite', 'zinc', 'brass']
const CMP_ENCASED_PARTS = [
    'steam_engine',
    'fluid_pipe',
    'mechanical_pump',
    'fluid_valve',
    'fluid_tank',
    'item_drain',
    'spout',
    'hose_pulley',
    'portable_fluid_interface',
    'smart_fluid_pipe',
]
// Encased's chain conveyors and adjustable chain gearshifts in other casings are crafted without the Andesite
// Machine that Ages makes the Create ones from. Ages already removes the crafting of Encased's press, mixer, drill
// and other machines in other casings; like those, these now get their look by right-clicking a placed Create one
// with the casing.
const CMP_ENCASED_CASINGS = [
    'brass',
    'copper',
    'creative',
    'industrial_iron',
    'railway',
    'refined_radiance',
    'shadow_steel',
    'weathered_iron',
]

ServerEvents.recipes(event => {
    CMP_ENCASED_PARTS.forEach(part => {
        CMP_ENCASED_MATERIALS.forEach(material => {
            let look = `createcasing:${material}_${part}`
            event.remove({ output: look })
            event.stonecutting(look, `create:${part}`).id(`kubejs:encased/${material}_${part}`)
            event.stonecutting(`create:${part}`, look).id(`kubejs:encased/${part}_from_${material}`)
        })
    })
    CMP_ENCASED_CASINGS.forEach(casing => {
        event.remove({ output: `createcasing:${casing}_chain_conveyor` })
        event.remove({ output: `createcasing:${casing}_adjustable_chain_gearshift` })
    })
})
