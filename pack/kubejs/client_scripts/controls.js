// CMP default controls. Mods added for combat bind keys that TaCZ already uses, so these are moved
// once per game folder; after that the player's own choices stay.
//   ParCool dodge, breakfall and wall run: R (TaCZ reload) -> X (in survival X does nothing)
//   Curios accessory screen: G (TaCZ fire mode) -> none (the inventory has a Curios button)
//   Sable Ragdolls "ragdoll yourself": H (TaCZ inspect) -> none (the server turns it off)
// C stays shared: TaCZ crawl and ParCool crawl both go prone while it is held, and sprinting into it slides.
const CmpControlsMarker = 'local/cmp/controls-v1.json'
const CmpControlsMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CmpControlsKeyMapping = Java.loadClass('net.minecraft.client.KeyMapping')
const CmpControlsInput = Java.loadClass('com.mojang.blaze3d.platform.InputConstants')
const CMP_CONTROL_CHANGES = {
    'key.parcool.dodge': 'key.keyboard.x',
    'key.parcool.breakfall': 'key.keyboard.x',
    'key.parcool.horizontal_wall_run': 'key.keyboard.x',
    'key.curios.open.desc': 'key.keyboard.unknown',
    'key.sable_player_ragdoll.ragdoll': 'key.keyboard.unknown',
}
let cmpControlsChecked = false

NativeEvents.onEvent('net.neoforged.neoforge.client.event.ClientTickEvent$Post', event => {
    if (cmpControlsChecked) return
    cmpControlsChecked = true
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the game.
    try {
        if (JsonIO.read(CmpControlsMarker) != null) return
        let options = CmpControlsMinecraft.getInstance().options
        let moved = []
        options.keyMappings.forEach(mapping => {
            let target = CMP_CONTROL_CHANGES[String(mapping.getName())]
            if (target) {
                mapping.setKey(CmpControlsInput.getKey(target))
                moved.push(String(mapping.getName()))
            }
        })
        CmpControlsKeyMapping.resetMapping()
        options.save()
        JsonIO.write(CmpControlsMarker, { moved: moved })
        console.info('CMP controls: moved ' + moved.join(', '))
    } catch (err) {
        console.error('CMP controls: ' + err)
    }
})
