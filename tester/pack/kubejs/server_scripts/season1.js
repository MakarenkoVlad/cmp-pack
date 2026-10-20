// CMP Season 1 world rules. Runs every time the server finishes loading.
ServerEvents.loaded(event => {
    // Creepers, endermen and other mobs must not break blocks: raids are done with
    // explosives that players bring, not with mobs.
    event.server.runCommandSilent('gamerule mobGriefing false')
    // There are no hostile mobs (the cmpwar mod keeps them out, [mobs] noHostileMobs), so these would
    // only keep trying to spawn them.
    event.server.runCommandSilent('gamerule doPatrolSpawning false')
    event.server.runCommandSilent('gamerule doInsomnia false')
    event.server.runCommandSilent('gamerule doWardenSpawning false')
    event.server.runCommandSilent('gamerule disableRaids true')
    // Players cannot forceload chunks (cmpwar refuses Open Parties and Claims forceloads), so they
    // cannot keep an airship loaded with /ssrd forceload either.
    event.server.runCommandSilent('gamerule ssrdForceloadLimit 0')
    // Airships are sent to a player out to 64 chunks (1 km), not SSRD's default 128 (2 km). To change it back,
    // put 128 here: the number is kept in the world, so deleting the line keeps 64.
    event.server.runCommandSilent('gamerule ssrdMaxRenderDistance 64')
})
