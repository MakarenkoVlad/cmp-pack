// CMP graphics. The pack ships HD resource packs (pack/resourcepacks/); this turns each one on the first
// time a game folder has it, on top of everything else, bottom to top in the order below. After that the
// player's own choice stays: a pack they turn off stays off, also when an update renames its zip (a pack
// that was on when its file changed is turned on again under the new name).
//   Faithful 32x: every vanilla texture at twice the resolution
//   Improved Create 32x: Create's blocks, items and screens at twice the resolution, in the Faithful style;
//     its author asks for it above Faithful (it redraws a few vanilla copper textures to match)
//   Universal Bushy Leaves: leaves grow past the block edge, with whatever leaf texture is under it
//   Fresh Animations: animated animals and villagers (needs the EMF and ETF mods)
//   Dramatic Skys: painted HD skies, sun and moon (needs the Nuit mod)
// The state lives in local/cmp/graphics.json: for each pack, the zip it last saw and whether it was on.
const CmpGraphicsMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CMP_GRAPHICS_MARKER = 'local/cmp/graphics.json'
const CMP_GRAPHICS_PACKS = [
    { key: 'faithful-32x', file: 'Faithful 32x' },
    { key: 'improved-create-32x', file: 'Improved_Create_32x' },
    { key: 'universal-bushy-leaves', file: 'Universal Bushy Leaves' },
    { key: 'fresh-animations', file: 'FreshAnimations' },
    { key: 'dramatic-skys', file: 'Dramatic Skys' },
]
let cmpGraphicsTicks = 0

// Checked every 5 seconds, so turning a pack off in the options is remembered before the next update.
NativeEvents.onEvent('net.neoforged.neoforge.client.event.ClientTickEvent$Post', event => {
    if (cmpGraphicsTicks++ % 100 != 0) return
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the game.
    try {
        cmpGraphicsCheck()
    } catch (err) {
        console.error('CMP graphics: ' + err)
    }
})

function cmpGraphicsCheck() {
    let mc = CmpGraphicsMinecraft.getInstance()
    // The loading screen is up while resources reload; the pack list changes only after it.
    if (mc.getOverlay() != null) return
    let repository = mc.getResourcePackRepository()
    let available = []
    repository.getAvailableIds().forEach(id => available.push(String(id)))
    let selected = []
    repository.getSelectedIds().forEach(id => selected.push(String(id)))

    let saved = JsonIO.read(CMP_GRAPHICS_MARKER)
    let state = {}
    let changed = saved == null
    let turnOn = []
    CMP_GRAPHICS_PACKS.forEach(pack => {
        let before = saved == null ? null : saved.get(pack.key)
        let id = available.find(candidate => candidate.startsWith('file/') && candidate.indexOf(pack.file) >= 0)
        if (!id) {
            // Not installed (yet): keep what was known, and decide once the file is there.
            if (before != null) state[pack.key] = { id: String(before.get('id')), on: String(before.get('on')) == 'true' }
            return
        }
        let on = selected.indexOf(id) >= 0
        let wasOn = before != null && String(before.get('on')) == 'true'
        if (!on && (before == null || (String(before.get('id')) != id && wasOn))) {
            turnOn.push(id)
            on = true
        }
        if (before == null || String(before.get('id')) != id || wasOn != on) changed = true
        state[pack.key] = { id: id, on: on }
    })

    if (turnOn.length > 0) {
        // The pack's own resource packs go on top, in the order above; everything else keeps its place.
        let ours = CMP_GRAPHICS_PACKS.map(pack => state[pack.key]).filter(entry => entry && entry.on).map(entry => entry.id)
        let order = selected.filter(id => ours.indexOf(id) < 0).concat(ours)
        repository.setSelected(order)
        // Saves options.txt and reloads the resources, as the Resource Packs screen's Done button does.
        mc.options.updateResourcePacks(repository)
        console.info('CMP graphics: turned on ' + turnOn.join(', '))
    }
    if (changed) JsonIO.write(CMP_GRAPHICS_MARKER, state)
}
