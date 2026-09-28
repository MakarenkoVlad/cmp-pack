// Advanced Peripherals: the pack keeps the chat box, the environment detector, the player detector and the
// block reader, the chatty, environment and player detector turtles and pocket computers, and the smart
// glasses (AR goggles) with their overlay module, hotkey module, interface and keyboard. Everything else is
// turned off: no recipe, and the c:hidden_from_recipe_viewers tag keeps it out of EMI and JEI.
// config/Advancedperipherals switches the same blocks off in case one turns up anyway, and the world
// datapack cmp_advanced_peripherals drops the turtle and pocket upgrades the pack does not use.
const AP_OFF = [
    'advancedperipherals:distance_detector',
    'advancedperipherals:energy_detector',
    'advancedperipherals:fluid_detector',
    'advancedperipherals:gas_detector',
    'advancedperipherals:geo_scanner',
    'advancedperipherals:inventory_manager',
    'advancedperipherals:memory_card',
    'advancedperipherals:nbt_storage',
    'advancedperipherals:colony_integrator',
    'advancedperipherals:me_bridge',
    'advancedperipherals:rs_bridge',
    'advancedperipherals:smart_rail',
    'advancedperipherals:chunk_controller',
    'advancedperipherals:computer_tool',
    'advancedperipherals:nightvision_module',
    'advancedperipherals:weak_automata_core',
    'advancedperipherals:overpowered_weak_automata_core',
    'advancedperipherals:husbandry_automata_core',
    'advancedperipherals:overpowered_husbandry_automata_core',
    'advancedperipherals:end_automata_core',
    'advancedperipherals:overpowered_end_automata_core',
]

ServerEvents.recipes(event => {
    AP_OFF.forEach(id => event.remove({ output: id }))
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', AP_OFF)
})
