// Knocked-down (ragdolled) players must stay killable. Sable Ragdolls hides a ragdolled player from
// hits and only passes melee and vanilla projectiles that hit the body on to the player, so gunfire
// and explosions are handled here.
const CmpSable = Java.loadClass('dev.ryanhcode.sable.Sable')
const CmpRagdollAPI = Java.loadClass('dev.leo.sableplayerragdoll.api.RagdollAPI')
const CmpRagdollParts = Java.loadClass('dev.leo.sableplayerragdoll.physics.RagdollAssemblyHelper')
const CmpRagdollSessions = Java.loadClass('dev.leo.sableplayerragdoll.physics.RagdollSessionManager')
const CmpExplosion = Java.loadClass('net.minecraft.world.level.Explosion')
const CmpEventPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const CmpResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
const CmpRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const CmpResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const CMP_BULLET_DAMAGE = CmpResourceKey.create(CmpRegistries.DAMAGE_TYPE, CmpResourceLocation.parse('tacz:bullet'))

// Each body part of a ragdoll is its own Sable sub-level, linked to one root part.
function cmpRagdollRoot(id) {
    let root = CmpRagdollParts.linkedRoot(id)
    return root != null ? root : id
}

// Gunfire: TaCZ bullets skip players that cannot be targeted and report block hits through their own
// event, so a bullet that hits a player's ragdoll hurts that player, like a normal body shot.
TimelessGunEvents.ammoHitBlock(event => {
    let level = event.getLevel()
    if (level.isClientSide()) return
    let hit = event.getHitResult()
    let part = CmpSable.HELPER.getContaining(level, hit.getBlockPos())
    if (part == null) return
    let partId = part.getUniqueId()
    // Pass the UUID: Rhino finds isRagdollSubLevel(SubLevel) and isRagdollSubLevel(UUID) ambiguous.
    if (!CmpRagdollAPI.isRagdollSubLevel(partId)) return
    let rootId = cmpRagdollRoot(partId)
    // Find the ragdolled player this body belongs to. Dummies and corpses belong to nobody.
    let victim = null
    level.getServer().getPlayerList().getPlayers().forEach(p => {
        // KubeJS hides Entity.getUUID() from scripts; the profile id is the same UUID.
        let body = CmpRagdollSessions.activeRagdollForPlayer(level, p.getGameProfile().getId())
        if (body != null && cmpRagdollRoot(body.getUniqueId()).equals(rootId)) victim = p
    })
    if (victim == null || !victim.isAlive()) return
    let bullet = event.getAmmo()
    // As TaCZ does for direct hits, let every bullet land even inside the hurt cooldown.
    victim.invulnerableTime = 0
    // KubeJS's attack(source, amount) calls Entity.hurt; in scripts `hurt` is a boolean property.
    victim.attack(level.damageSources().source(CMP_BULLET_DAMAGE, bullet, bullet.getOwner()), bullet.getDamage(hit.getLocation()))
})

// Explosions: Ragdoll Reactions knocks players down while the explosion detonates, before the game
// deals its damage, and a ragdolled player is hidden from that damage. Running after Ragdoll
// Reactions, this deals the vanilla explosion damage to every ragdolled player in the blast, as if
// fully exposed, and takes them out of the game's own damage and knockback pass.
NativeEvents.onEvent(CmpEventPriority.LOWEST, 'net.neoforged.neoforge.event.level.ExplosionEvent$Detonate', event => {
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
    try {
        let level = event.getLevel()
        if (level.isClientSide()) return
        let explosion = event.getExplosion()
        let center = explosion.center()
        let diameter = explosion.radius() * 2
        let downed = []
        event.getAffectedEntities().forEach(entity => {
            if (entity.isPlayer() && CmpRagdollSessions.isPlayerCurrentlyRagdolled(entity)) downed.push(entity)
        })
        downed.forEach(player => {
            event.getAffectedEntities().remove(player)
            let exposure = 1 - Math.sqrt(player.distanceToSqr(center)) / diameter
            if (exposure <= 0) return
            let source = CmpExplosion.getDefaultDamageSource(level, explosion.getDirectSourceEntity())
            player.attack(source, (exposure * exposure + exposure) / 2 * 7 * diameter + 1)
        })
    } catch (err) {
        console.error('ragdoll explosion damage failed: ' + err)
    }
})
