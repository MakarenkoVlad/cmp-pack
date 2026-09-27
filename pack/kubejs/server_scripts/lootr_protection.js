// Lootr containers (the structures' per-player chests, barrels, pots and suspicious sand) cannot be
// broken: lootr-common.toml stops players (disable_break) and explosions (blast_immune). Machines break
// blocks without a player, so they are stopped here, each where it looks before it breaks a block:
//   - Create drills and saws, placed or on a contraption, and the Offroad borehead drill (Aeronautics)
//     skip every block in #create:non_breakable (Create's BlockBreakingKineticBlockEntity.isBreakable).
//   - Create Big Cannons shot (solid, AP and autocannon rounds, shrapnel) asks ProjectileDamageEvent
//     before it damages a block; a cancelled event makes the block count as unbreakable for that shot.
//     (A Big Cannons explosion also asks at its centre: one centred on a Lootr container breaks no
//     blocks at all, which is fine. The blocks around an explosion follow the explosion resistance,
//     which blast_immune already sets.)
const CmpLootrTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const CmpLootrRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const CmpLootrId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CMP_LOOTR_CONTAINERS = CmpLootrTagKey.create(CmpLootrRegistries.BLOCK, CmpLootrId.parse('lootr:containers'))

ServerEvents.tags('block', event => {
    event.add('create:non_breakable', '#lootr:containers')
})

NativeEvents.onEvent('rbasamoyai.createbigcannons.events.ProjectileDamageEvent', event => {
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
    try {
        // BlockState.is is overloaded in a way Rhino cannot pick from for a TagKey: name the overload
        if (event.getLevel().getBlockState(event.getPos())['is(net.minecraft.tags.TagKey)'](CMP_LOOTR_CONTAINERS)) event.setCanceled(true)
    } catch (err) {
        console.error('lootr protection (Big Cannons shot): ' + err)
    }
})
