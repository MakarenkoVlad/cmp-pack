// CMP graphics. The pack ships resource packs (pack/resourcepacks/). The ones marked `on` below are turned
// on the first time a game folder has them; the others stay off until the player turns them on in
// Options > Resource Packs. After that the player's own choice stays: a pack they turn off stays off, also
// when an update renames its zip (a pack that was on when its file changed is turned on again under the
// new name). The packs that are on are kept in the order below, bottom to top, even when the player adds
// one: the resource pack screen puts a newly added pack on top, where Faithful's mob textures would cover
// Fresh Animations' and its sun and moon would cover Dramatic Skys'.
//   Faithful 32x: every vanilla texture at twice the resolution (off by default)
//   Improved Create 32x: Create's blocks, items and screens at twice the resolution, in the Faithful style;
//     its author asks for it above Faithful (it redraws a few vanilla copper textures to match) (off by default)
//   Create: ComputerCraft: CC:Tweaked's computers, monitors, turtles, modems and screens in Create's style
//     (the 1.20.1 build, so the pack list calls it old; it only touches computercraft textures and models)
//   Universal Bushy Leaves: leaves grow past the block edge, with whatever leaf texture is under it
//   Fresh Animations: animated animals and villagers (needs the EMF and ETF mods)
//   Dramatic Skys: painted HD skies, sun and moon (needs the Nuit and Nuit Interop mods)
// The state lives in local/cmp/graphics-v2.json: for each pack, the zip it last saw and whether it was on.
// The first version (local/cmp/graphics.json) turned every pack on, so the packs that are now off by
// default are turned off once for game folders that still have them on from it.
const CmpGraphicsMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CMP_GRAPHICS_MARKER = 'local/cmp/graphics-v2.json'
const CMP_GRAPHICS_MARKER_V1 = 'local/cmp/graphics.json'
const CMP_GRAPHICS_PACKS = [
    { key: 'faithful-32x', file: 'Faithful 32x', on: false },
    { key: 'improved-create-32x', file: 'Improved_Create_32x', on: false },
    { key: 'create-computercraft', file: 'Create Computers', on: true },
    { key: 'universal-bushy-leaves', file: 'Universal Bushy Leaves', on: true },
    { key: 'fresh-animations', file: 'FreshAnimations', on: true },
    { key: 'dramatic-skys', file: 'Dramatic Skys', on: true },
]
let cmpGraphicsTicks = 0
let cmpGraphicsChanges = 0

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
    let migrating = saved == null ? JsonIO.read(CMP_GRAPHICS_MARKER_V1) : null
    let state = {}
    let changed = saved == null
    let turnOn = []
    let turnOff = []
    CMP_GRAPHICS_PACKS.forEach(pack => {
        let before = saved != null ? saved.get(pack.key) : migrating != null ? migrating.get(pack.key) : null
        let id = available.find(candidate => candidate.startsWith('file/') && candidate.indexOf(pack.file) >= 0)
        if (!id) {
            // Not installed (yet): keep what was known, and decide once the file is there.
            if (before != null) state[pack.key] = { id: String(before.get('id')), on: String(before.get('on')) == 'true' }
            return
        }
        let on = selected.indexOf(id) >= 0
        let wasOn = before != null && String(before.get('on')) == 'true'
        if (migrating != null && !pack.on && on && wasOn) {
            turnOff.push(id)
            on = false
        } else if (!on && ((before == null && pack.on) || (before != null && String(before.get('id')) != id && wasOn))) {
            turnOn.push(id)
            on = true
        }
        if (before == null || String(before.get('id')) != id || wasOn != on) changed = true
        state[pack.key] = { id: id, on: on }
    })

    // Only the pack's own resource packs are compared and moved: other packs keep their places (a mod can
    // pin its own pack to the top, and moving that would reload forever).
    let entries = CMP_GRAPHICS_PACKS.map(pack => state[pack.key]).filter(entry => entry && available.indexOf(entry.id) >= 0)
    let ourIds = entries.map(entry => entry.id)
    let wanted = entries.filter(entry => entry.on).map(entry => entry.id)
    let current = selected.filter(id => ourIds.indexOf(id) >= 0)
    if (String(current) != String(wanted)) {
        if (cmpGraphicsChanges >= 3) {
            if (cmpGraphicsChanges++ == 3) console.warn('CMP graphics: the resource packs did not end up as set three times in a row; leaving them alone until the game restarts')
        } else {
            cmpGraphicsChanges++
            repository.setSelected(selected.filter(id => ourIds.indexOf(id) < 0).concat(wanted))
            // Saves options.txt and reloads the resources, as the Resource Packs screen's Done button does.
            mc.options.updateResourcePacks(repository)
            console.info('CMP graphics: turned on [' + turnOn.join(', ') + '], turned off [' + turnOff.join(', ') + '], order ' + wanted.join(' < '))
        }
    } else {
        cmpGraphicsChanges = 0
    }
    if (changed) JsonIO.write(CMP_GRAPHICS_MARKER, state)
}
