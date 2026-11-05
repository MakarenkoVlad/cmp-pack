// Season 2's alcohol market (Frigulus and Vlad, 2026-11-05): drinks come from the brew setup in the townhall, and other players buy
// them there. s2_recipes.js takes away the recipes for the barrel, pressing tub, tap and freezer. This file takes away the grapes
// and the cocktails that need no drink at all. Aging takes 3 days to the top level and the effects are stronger: Frigulus's numbers,
// in pack/kubejs/data/ over the original mods, whose jars stay as they are.
//
// Kaleidoscope Tavern adds wild grapevines to the bee trees at every server start, so a sapling grown next to flowers grows them
// too, even on a world generated before the mod came in. Each vine drops a grapevine to plant. There is no setting for this.
const CMP_S2_TreeConfiguration = Java.loadClass('net.minecraft.world.level.levelgen.feature.configurations.TreeConfiguration')
const CMP_S2_WildVines = Java.loadClass('com.github.ysbbbbbb.kaleidoscopetavern.worldgen.WildGrapevineDecorator')
const CMP_S2_Features = Java.loadClass('net.minecraft.core.registries.Registries').CONFIGURED_FEATURE
const CMP_S2_List = Java.loadClass('java.util.ArrayList')

// Water, tonic and cola are for cocktails to be made from them plus a drink. As mere ingredients they make gin tonic and long island
// iced tea out of nothing.
ServerEvents.tags('item', event => {
    event.remove('kaleidoscope_tavern:cocktail_ingredient_white', ['minecraft:potion', 'kaleidoscope_world_liquor:tonic_water'])
    event.remove('kaleidoscope_tavern:cocktail_ingredient_brown', 'kaleidoscope_world_liquor:cola')
})

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
