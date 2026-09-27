// CMP Season 1 world rules. Runs every time the server finishes loading.
ServerEvents.loaded(event => {
    // Creepers, endermen and other mobs must not break blocks: raids are done with
    // explosives that players bring, not with mobs.
    event.server.runCommandSilent('gamerule mobGriefing false')
    // There are no hostile mobs (no_hostile_mobs.js), so these would only keep trying to spawn them.
    event.server.runCommandSilent('gamerule doPatrolSpawning false')
    event.server.runCommandSilent('gamerule doInsomnia false')
    event.server.runCommandSilent('gamerule doWardenSpawning false')
    event.server.runCommandSilent('gamerule disableRaids true')
})
