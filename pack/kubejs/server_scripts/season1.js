// CMP Season 1 world rules. Runs every time the server finishes loading.
ServerEvents.loaded(event => {
    // Creepers, endermen and other mobs must not break blocks: raids are done with
    // explosives that players bring, not with mobs.
    event.server.runCommandSilent('gamerule mobGriefing false')
})
