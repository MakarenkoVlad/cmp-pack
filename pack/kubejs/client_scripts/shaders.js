// CMP shaders. The pack ships Complementary Shaders - Unbound with Iris but leaves it off: a player turns it on
// in Options > Video Settings > Shader Packs. Until October 2026 the pack turned it on, and
// config/iris.properties is written once per game folder and never overwritten, so this turns it off once for
// a game folder that still runs it. A player who turns it on again keeps it, and a shader pack of the
// player's own is left alone. local/cmp/shaders.json marks a game folder as done.
const CmpShadersMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CmpShadersIris = Java.loadClass('net.irisshaders.iris.Iris')
const CmpShadersIrisApi = Java.loadClass('net.irisshaders.iris.api.v0.IrisApi')
const CMP_SHADERS_MARKER = 'local/cmp/shaders.json'
const CMP_SHADERS_PACK = 'ComplementaryUnbound'
let cmpShadersDone = JsonIO.read(CMP_SHADERS_MARKER) != null

NativeEvents.onEvent('net.neoforged.neoforge.client.event.ClientTickEvent$Post', event => {
    if (cmpShadersDone) return
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the game.
    try {
        // The loading screen is up while resources reload; Iris reloads its shaders after it.
        if (CmpShadersMinecraft.getInstance().getOverlay() != null) return
        cmpShadersDone = true
        let config = CmpShadersIrisApi.getInstance().getConfig()
        let pack = String(CmpShadersIris.getIrisConfig().getShaderPackName().orElse(''))
        let turnedOff = config.areShadersEnabled() && pack.startsWith(CMP_SHADERS_PACK)
        // Saves iris.properties and reloads the shaders, as the Shader Packs screen's Apply button does.
        if (turnedOff) config.setShadersEnabledAndApply(false)
        JsonIO.write(CMP_SHADERS_MARKER, { pack: pack, turnedOff: turnedOff })
        console.info('CMP shaders: ' + (turnedOff ? 'turned off ' + pack : 'left as they are (' + (pack || 'no pack') + ')'))
    } catch (err) {
        console.error('CMP shaders: ' + err)
    }
})
