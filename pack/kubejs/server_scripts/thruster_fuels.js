// Create Propulsion thrusters burn diesel and gasoline at 0.02 mB a tick per thruster at full throttle. The mod
// burns 1.0 (diesel) and 0.8 (gasoline), so a bucket in one thruster now lasts 41 minutes 40 seconds instead of
// 50 and 62.5 seconds. The oil well gives very little oil, so the fuels made from it have to last. Thrust stays
// as it is: the thrust numbers below are the ones in the mod's own data files (cdg_diesel.json and
// cdg_gasoline.json under data/createpropulsion/thruster_fuels/cdg/ in the jar), and the mod's config still
// multiplies them (gasoline 125%). Compare them with the jar after a Create Propulsion update.
//
// This goes through the mod's KubeJS binding because a data file cannot do it: the mod replaces a data file's
// consumption_multiplier with the burnRate of its config. A fuel set from a script wins over both, and the
// server sends the fuel table to every player who joins, so players need no file for it.
//
// What else follows from the one number:
//   - A 2x2x2 thruster burns 0.096 mB a tick and a 3x3x3 0.216: the mod's multiblock fuel factors (0.6 and 0.4)
//     still apply.
//   - The goggles on a running thruster flip between "0.0 mB/t" and "0.1 mB/t" (0.0 and 1.0 on a Liquid
//     Vector Thruster): the mod shows one decimal of what its last update took.
//   - The mod's Liquid Burner reads the same number: 2 mB now burn for 55 s on diesel (was 1.1 s) and 60 s on
//     gasoline (was 1.5 s), with the same heat. A bucket keeps one burner lit for about 8 hours.
//   - Diesel Generators engines have their own fuel table and do not change.
//
// A fuel set here stays until the server restarts, also when this file is taken away and the scripts are
// reloaded.
const CMP_THRUSTER_BURN = 0.02 // mB a tick per thruster at full throttle
// The fluid and its thrust number from the mod's data file.
const CMP_THRUSTER_FUELS = [
    ['createdieselgenerators:diesel', 1.1],
    ['createdieselgenerators:gasoline', 1.2],
]

// Create Propulsion gone, or its binding changed by an update, must not stop the other scripts and must not be a
// KubeJS error either: KubeJS shows "KubeJS errors found" to every player who joins. So it is one warning in
// the log, and a fuel that was not set burns at the mod's own rate until this file is fixed.
function cmpSetThrusterFuels() {
    let problem = ''
    try {
        if (typeof ThrusterFuelManager == 'undefined') {
            problem = 'Create Propulsion gave KubeJS no ThrusterFuelManager'
        } else {
            let fluids = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').FLUID
            let id = Java.loadClass('net.minecraft.resources.ResourceLocation')
            let refused = []
            let wrong = []
            CMP_THRUSTER_FUELS.forEach(fuel => {
                // let: Rhino keeps the first value of a const declared in a loop
                let set = ThrusterFuelManager.registerScriptedFuel(fuel[0], {
                    thrustMultiplier: fuel[1],
                    consumptionMultiplier: CMP_THRUSTER_BURN,
                })
                if (!set) {
                    refused.push(fuel[0])
                    return
                }
                // Read it back: an update that keeps the method but reads other option names would set nothing
                // and still answer yes.
                let now = ThrusterFuelManager.getProperties(fluids.get(id.parse(fuel[0])))
                if (now == null || Math.abs(now.consumptionMultiplier() - CMP_THRUSTER_BURN) > 0.0001
                        || Math.abs(now.thrustMultiplier() - fuel[1]) > 0.0001) wrong.push(fuel[0])
            })
            if (refused.length > 0) problem = 'Create Propulsion refused ' + refused.join(' and ')
            else if (wrong.length > 0) problem = 'Create Propulsion took the call but its fuel table does not hold the numbers for ' + wrong.join(' and ')
        }
    } catch (err) {
        problem = String(err)
    }
    if (problem == '') console.info('thruster fuels: diesel and gasoline burn ' + CMP_THRUSTER_BURN + ' mB a tick')
    else console.warn('thruster fuels: burn rate not set: ' + problem)
}

cmpSetThrusterFuels()
