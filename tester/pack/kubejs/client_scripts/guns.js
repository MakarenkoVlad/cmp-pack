// The Create Armorer wrench is out of the game (see server_scripts/guns.js): JEI hides it, the spike that only
// fits it and its melee "ammo". The check reads the TaCZ id, so every other gun stays listed.
const CmpGunsClientDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const CMP_HIDDEN_TACZ = {
    'tacz:modern_kinetic_gun': ['GunId', 'create_armorer:special_melee_wrench'],
    'tacz:attachment': ['AttachmentId', 'create_armorer:muzzle_refit_iron_spike'],
    'tacz:ammo': ['AmmoId', 'create_armorer:melee_weapon'],
}

RecipeViewerEvents.removeEntries('item', event => {
    event.remove(stack => {
        let hidden = CMP_HIDDEN_TACZ[String(stack.getId())]
        if (!hidden) return false
        let data = stack.get(CmpGunsClientDataComponents.CUSTOM_DATA)
        return data != null && String(data.copyTag().getString(hidden[0])) == hidden[1]
    })
})
