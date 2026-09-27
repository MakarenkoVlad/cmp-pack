// CMP parkour (ParCool): the moves are in, but not the ParCool items that let players cross between
// sky islands without an airship. config/parcool-server.toml also turns their actions off.
ServerEvents.recipes(event => {
    // Grappling hook: 48 blocks of reach, then swing or reel yourself in.
    event.remove({ id: 'parcool:grappling_hook' })
    event.remove({ id: 'parcool:hook' })
    // Ziplines strung between any two points.
    event.remove({ id: 'parcool:zipline_rope' })
    event.remove({ id: 'parcool:reset_zipline_rope' })
    event.remove({ id: 'parcool:wooden_zipline_hook' })
    event.remove({ id: 'parcool:iron_zipline_hook' })
})
