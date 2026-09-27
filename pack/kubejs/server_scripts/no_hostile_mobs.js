// CMP has no hostile mobs: the war is between players. Every mob in the "monster" category
// (zombies, skeletons, creepers, spiders, endermen, slimes, witches, illagers, phantoms, ...) is kept
// out, however it would spawn. Admins can still bring one in for an event with /summon or a spawn
// egg; a /summon with NBT skips the spawn setup, so give it Tags:["cmp_allowed_hostile"].
const CmpMobCategory = Java.loadClass('net.minecraft.world.entity.MobCategory')
const CmpMobSpawnType = Java.loadClass('net.minecraft.world.entity.MobSpawnType')
const CmpPlacementResult = Java.loadClass('net.neoforged.neoforge.event.entity.living.MobSpawnEvent$SpawnPlacementCheck$Result')
const CMP_HOSTILE_ALLOWED_TAG = 'cmp_allowed_hostile'

// For entities use KubeJS's entity.isMonster(): in scripts entity.getType() is the id string.
function cmpIsHostileType(entityType) {
    return CmpMobCategory.MONSTER.equals(entityType.getCategory())
}

function cmpIsAdminSpawn(spawnType) {
    return CmpMobSpawnType.COMMAND.equals(spawnType) || CmpMobSpawnType.SPAWN_EGG.equals(spawnType)
}

// Natural spawns, new chunks and spawner blocks: refused before the mob is even created.
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.MobSpawnEvent$SpawnPlacementCheck', event => {
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
    try {
        if (cmpIsHostileType(event.getEntityType()) && !cmpIsAdminSpawn(event.getSpawnType())) {
            event.setResult(CmpPlacementResult.FAIL)
        }
    } catch (err) {
        console.error('no hostile mobs (placement check): ' + err)
    }
})

// Every other way a mob gets set up: structures, patrols, raids, phantoms, conversions such as a
// villager struck by lightning, reinforcements, trial spawners.
EntityEvents.checkSpawn(event => {
    let entity = event.getEntity()
    if (!entity.isMonster()) return
    if (cmpIsAdminSpawn(event.getType())) entity.addTag(CMP_HOSTILE_ALLOWED_TAG)
    else event.cancel()
})

// Whatever still reaches the world, and hostile mobs saved in chunks before this rule: they are
// dropped as their chunk loads.
EntityEvents.spawned(event => {
    let entity = event.getEntity()
    if (entity.isMonster() && !entity.getTags().contains(CMP_HOSTILE_ALLOWED_TAG)) event.cancel()
})
