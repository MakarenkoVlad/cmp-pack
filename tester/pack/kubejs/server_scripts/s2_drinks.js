// Season 2's alcohol market (Frigulus and Vlad, 2026-11-05): drinks come from the brew setup in the townhall, and other players buy
// them there. s2_recipes.js takes the recipes for the barrel and the shaker away, since every drink comes from one of them. This
// file takes away the grapes.
//
// Kaleidoscope Tavern adds wild grapevines to the bee trees at every server start, so a sapling grown next to flowers grows them
// too, even on a world generated before the mod came in. Each vine drops a grapevine to plant. There is no setting for this.
const CMP_S2_TreeConfiguration = Java.loadClass('net.minecraft.world.level.levelgen.feature.configurations.TreeConfiguration')
const CMP_S2_WildVines = Java.loadClass('com.github.ysbbbbbb.kaleidoscopetavern.worldgen.WildGrapevineDecorator')
const CMP_S2_Features = Java.loadClass('net.minecraft.core.registries.Registries').CONFIGURED_FEATURE
const CMP_S2_List = Java.loadClass('java.util.ArrayList')

ServerEvents.loaded(event => {
    let trees = 0
    event.server.registryAccess().registryOrThrow(CMP_S2_Features).forEach(feature => {
        let config = feature.config()
        if (!(config instanceof CMP_S2_TreeConfiguration)) return
        let kept = new CMP_S2_List()
        config.decorators.forEach(decorator => { if (!(decorator instanceof CMP_S2_WildVines)) kept.add(decorator) })
        if (kept.size() == config.decorators.size()) return
        config.decorators = kept
        trees++
    })
    console.info('[s2_drinks] wild grapevines taken off ' + trees + ' kinds of tree')
})
