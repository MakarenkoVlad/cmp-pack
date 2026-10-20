// Create Radar: Fire Arc adds /radarfirearc controller_angle <min> <max>, which sets the travel limits of
// whatever yaw or pitch controller the player looks at within 6 blocks. It has no permission check and no
// claim check, so anyone standing next to an enemy turret could lock its controller into a useless arc.
// Players use the fire arc filters instead: the editor opens in the air and only changes the filter item,
// and a filter goes into or out of a controller by clicking the controller, which Open Parties and Claims
// stops on someone else's claim (its click handlers run at HIGHEST, the add-on's at HIGH). Ops keep the
// command.
ServerEvents.command('radarfirearc', event => {
    const source = event.parseResults.context.source
    if (source.hasPermission(2)) return
    source.sendFailure(Text.of('Only ops can use /radarfirearc. Put a fire arc filter in the controller instead.'))
    event.cancel()
})
