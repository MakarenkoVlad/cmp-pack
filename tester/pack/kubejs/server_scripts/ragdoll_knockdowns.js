// An explosion knocks a player down only if it can hurt them. Ragdoll Reactions knocks down every
// player inside a blast's radius, even behind a wall that keeps all of the blast's damage off them,
// and out to twice the radius in which a TaCZ grenade does any damage. When a blast goes off, this
// checks each player the mod would knock down the way the game checks explosion damage (in range, and
// the blast can see them) and cancels the knockdown of a player it cannot hurt. The knockdown itself
// starts a few ticks after the blast (the mod asks the player's client for its pose first), so the
// result is kept for a second; a blast that can hurt the player wins over one that cannot.
const CmpKnockdownExplosion = Java.loadClass('net.minecraft.world.level.Explosion')
const CmpKnockdownGunExplosion = Java.loadClass('com.tacz.guns.util.block.ProjectileExplosion')
const CmpKnockdownPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const CmpKnockdownSessions = Java.loadClass('dev.leo.sableplayerragdoll.physics.RagdollSessionManager')
const CMP_KNOCKDOWN_WINDOW_TICKS = 20
// Player UUID -> { seen, hidden }: until which server tick a blast that can hurt them, or one that cannot, counts.
const cmpKnockdownBlasts = {}

// How far a blast knocks players down (Ragdoll Reactions with radiusPadding = 0) and how far it hurts them.
function cmpKnockdownReach(explosion) {
    let power = explosion.radius()
    let knock = power * 2
    try {
        // Create Big Cannons shells: the mod also counts the shell's own entity radius.
        let entityRadius = explosion.getEntityRadius()
        if (entityRadius > knock) knock = entityRadius
    } catch (err) {
        // Not a Create Big Cannons explosion.
    }
    // Vanilla-style explosions hurt out to twice their power; TaCZ grenades and shells only out to their radius.
    return { knock: knock, hurt: explosion instanceof CmpKnockdownGunExplosion ? power : knock }
}

// Runs before Ragdoll Reactions sees the blast. (Rhino here cannot call Level.getGameTime() or
// Level.equals(): time is the server's tick count, and == compares the levels as Java objects.)
NativeEvents.onEvent(CmpKnockdownPriority.HIGHEST, 'net.neoforged.neoforge.event.level.ExplosionEvent$Detonate', event => {
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
    try {
        let level = event.getLevel()
        if (level.isClientSide()) return
        let explosion = event.getExplosion()
        let center = explosion.center()
        let reach = cmpKnockdownReach(explosion)
        let server = level.getServer()
        let now = server.getTickCount()
        Object.keys(cmpKnockdownBlasts).forEach(id => {
            let blast = cmpKnockdownBlasts[id]
            if (!(blast.seen >= now) && !(blast.hidden >= now)) delete cmpKnockdownBlasts[id]
        })
        server.getPlayerList().getPlayers().forEach(player => {
            if (player.serverLevel() != level) return
            // Already down: the mod does not knock them down again.
            if (CmpKnockdownSessions.isPlayerCurrentlyRagdolled(player)) return
            let distance = player.getBoundingBox().getCenter().distanceTo(center)
            if (distance > reach.knock) return
            // KubeJS hides Entity.getUUID() from scripts; the profile id is the same UUID.
            let id = String(player.getGameProfile().getId())
            let blast = cmpKnockdownBlasts[id] || (cmpKnockdownBlasts[id] = {})
            if (distance <= reach.hurt && CmpKnockdownExplosion.getSeenPercent(center, player) > 0) blast.seen = now + CMP_KNOCKDOWN_WINDOW_TICKS
            else blast.hidden = now + CMP_KNOCKDOWN_WINDOW_TICKS
        })
    } catch (err) {
        console.error('ragdoll knockdown blast check failed: ' + err)
    }
})

NativeEvents.onEvent('dev.leo.sableplayerragdoll.api.RagdollStartEvent', event => {
    try {
        let player = event.player()
        let id = String(player.getGameProfile().getId())
        let blast = cmpKnockdownBlasts[id]
        if (!blast) return
        delete cmpKnockdownBlasts[id]
        let now = player.serverLevel().getServer().getTickCount()
        if (blast.hidden >= now && !(blast.seen >= now)) event.setCanceled(true)
    } catch (err) {
        console.error('ragdoll knockdown start check failed: ' + err)
    }
})
