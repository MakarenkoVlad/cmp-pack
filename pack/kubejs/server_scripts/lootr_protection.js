// Lootr containers (the structures' per-player chests, barrels, pots and suspicious sand) cannot be
// broken: lootr-common.toml stops players (disable_break) and explosions (blast_immune). The one exception
// is a team's own claim, where its players break them by hand while sneaking (the cmpwar mod, 0.11.2,
// compat/LootrClaimBreak); everything below holds inside claims too. Machines break blocks without a
// player, so they are stopped here, each where it looks before it breaks a block:
//   - Create drills and saws, placed or on a contraption, and the Offroad borehead drill (Aeronautics)
//     skip every block in #create:non_breakable (Create's BlockBreakingKineticBlockEntity.isBreakable).
//   - Create Big Cannons shot (solid, AP and autocannon rounds, shrapnel) asks ProjectileDamageEvent
//     before it damages a block; a cancelled event makes the block count as unbreakable for that shot.
//     (A Big Cannons explosion also asks at its centre: one centred on a Lootr container breaks no
//     blocks at all, which is fine. The blocks around an explosion follow the explosion resistance,
//     which blast_immune already sets.)
// Nor can they be carried off: nothing assembles a Lootr container into something that moves.
//   - Create contraptions (bearings, pistons, pulleys, gantries, cart assemblers, elevators, linear
//     bearings) refuse the blocks in #create:non_movable: Contraption.moveBlock throws "unmovable block"
//     when it reaches one (the block the contraption starts from, pushes against or pulls with a
//     chassis) and skips one that it would only take along by glue.
//   - Aeronautics airships: the physics assembler (Simulated) does the same with #simulated:non_movable
//     (SimAssemblyContraption.movementAllowed).
//   - Every other airship route (a Synaxis motor, swivel bearings, add-ons) leaves them where they are
//     only because cmpwar's move guard reads #simulated:non_movable too (cmpwar 0.12.0, compat/MoveGuard);
//     it also keeps a ship from being put down on one. A Create contraption put down on one still
//     replaces it (see cmpwar/README.md).
const CmpLootrTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const CmpLootrRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const CmpLootrId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CMP_LOOTR_CONTAINERS = CmpLootrTagKey.create(CmpLootrRegistries.BLOCK, CmpLootrId.parse('lootr:containers'))

ServerEvents.tags('block', event => {
    event.add('create:non_breakable', '#lootr:containers')
    event.add('create:non_movable', '#lootr:containers')
    event.add('simulated:non_movable', '#lootr:containers')
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
