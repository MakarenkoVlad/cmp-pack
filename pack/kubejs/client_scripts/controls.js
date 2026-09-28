// CMP default controls. Mods added for combat bind keys that TaCZ already uses, so these are moved
// once per game folder; after that the player's own choices stay. Each stage runs once, so a stage
// added later reaches game folders that already had the earlier ones applied.
//   v1 (combat):
//     Curios accessory screen: G (TaCZ fire mode) -> none (the inventory has a Curios button)
//     Sable Ragdolls "ragdoll yourself": H (TaCZ inspect) -> none (the server turns it off)
//   v2 (villagers):
//     Easy Villagers "pick up": V (TaCZ melee and zoom, Synaxis view lock) -> none
//       (sneak + right-click on a villager picks it up)
//   v3 (zoom, fullbright, Robo Bees):
//     Ok Zoomer "zoom": C (TaCZ crawl, Big Cannons pitch mode) -> X (only creative uses X, to load hotbars)
//     Full Brightness Toggle: G (TaCZ fire mode, voice chat groups) -> . (period)
//     Mobile Packages "portable stock ticker": G -> none (use the item to open it)
//     Mobile Packages "player networks": H (TaCZ inspect, voice chat icons) -> none
// C stays shared: Easy Villagers' "cycle trades" is C like TaCZ crawl, but it only works inside the
// trading screen. Create: Factory Controller's C, R, F and Q only work inside its screen, and the
// Tweaked Controllers' and Toolgun's keys (Tab, R, Left Alt) only while the item is in use.
const CmpControlsMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CmpControlsKeyMapping = Java.loadClass('net.minecraft.client.KeyMapping')
const CmpControlsInput = Java.loadClass('com.mojang.blaze3d.platform.InputConstants')
const CMP_CONTROL_STAGES = [
    {
        marker: 'local/cmp/controls-v1.json',
        changes: {
            'key.curios.open.desc': 'key.keyboard.unknown',
            'key.sable_player_ragdoll.ragdoll': 'key.keyboard.unknown',
        },
    },
    {
        marker: 'local/cmp/controls-v2.json',
        changes: {
            'key.easy_villagers.pick_up': 'key.keyboard.unknown',
        },
    },
    {
        marker: 'local/cmp/controls-v3.json',
        changes: {
            'key.ok_zoomer.zoom': 'key.keyboard.x',
            'fullbrightnesstoggle.key.togglebrightness': 'key.keyboard.period',
            'create_mobile_packages.keyinfo.open_portable_stock_ticker': 'key.keyboard.unknown',
            'create_mobile_packages.keyinfo.open_player_networks_screen': 'key.keyboard.unknown',
        },
    },
]
let cmpControlsChecked = false

NativeEvents.onEvent('net.neoforged.neoforge.client.event.ClientTickEvent$Post', event => {
    if (cmpControlsChecked) return
    cmpControlsChecked = true
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the game.
    try {
        let options = CmpControlsMinecraft.getInstance().options
        let moved = []
        CMP_CONTROL_STAGES.forEach(stage => {
            if (JsonIO.read(stage.marker) != null) return
            let stageMoved = []
            options.keyMappings.forEach(mapping => {
                let target = stage.changes[String(mapping.getName())]
                if (target) {
                    mapping.setKey(CmpControlsInput.getKey(target))
                    stageMoved.push(String(mapping.getName()))
                }
            })
            JsonIO.write(stage.marker, { moved: stageMoved })
            moved = moved.concat(stageMoved)
        })
        if (moved.length == 0) return
        CmpControlsKeyMapping.resetMapping()
        options.save()
        console.info('CMP controls: moved ' + moved.join(', '))
    } catch (err) {
        console.error('CMP controls: ' + err)
    }
})
