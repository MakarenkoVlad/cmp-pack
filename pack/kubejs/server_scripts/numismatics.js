// Numismatics is only its six coins here: Spur, Bevel, Sprocket, Cog, Crown and Sun. They come from airdrops
// and are spent in /shop (shop.js). Everything else of the mod is off, because its banks and vendors could make
// coins out of nothing (a vendor in buy mode pays coins it never had, a creative vendor at price 0 gives its
// stock away, and the price packet takes a negative number):
//   - no recipe makes a Numismatics item (vendors, depositors, bank terminals, banking guides, cards),
//   - nobody outside creative mode (ops in survival too) places a Numismatics block, right-clicks one that is
//     already placed, or uses a banking guide, card or ID card (the banking guide turns a blaze burner into a
//     blaze banker); deployers and turtles click as fake players, which are never in creative mode,
//   - the c:hidden_from_recipe_viewers tag keeps all of it but the coins out of EMI and JEI.
// Nothing is taken away: a block that is already placed stays, and anyone can still break it and keep it.
// A schematicannon places blocks without a player, so it still prints a Numismatics block (one that is already
// in its chests), but nobody outside creative can use the block once it is there.
// These are native NeoForge listeners: KubeJS's own BlockEvents.rightClicked is not posted while the item in the
// hand is on cooldown (an ender pearl just thrown), which would let a click through. They run at HIGHEST
// priority, before Numismatics' own right-click listener (NORMAL). That one makes a vendor trade, or opens its
// settings, by itself when the player sneaks or has anything but a block in the offhand, and it skips an event
// that is already cancelled.
const CMP_NUMI_COINS = ['spur', 'bevel', 'sprocket', 'cog', 'crown', 'sun'].map(c => 'numismatics:' + c)
const $CmpNumiPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $CmpNumiRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $CmpNumiBlockItem = Java.loadClass('net.minecraft.world.item.BlockItem')
const $CmpNumiPlayer = Java.loadClass('net.minecraft.world.entity.player.Player')
const $CmpNumiResult = Java.loadClass('net.minecraft.world.InteractionResult')

const CMP_NUMI_HIDDEN = []
;(function () {
    const ids = $CmpNumiRegistries.ITEM.keySet().toArray()
    for (let i = 0; i < ids.length; i++) {
        let id = String(ids[i])
        if (id.indexOf('numismatics:') == 0 && CMP_NUMI_COINS.indexOf(id) < 0) CMP_NUMI_HIDDEN.push(id)
    }
})()

function cmpNumiItemId(stack) {
    return String(stack.getItem().builtInRegistryHolder().key().location())
}

function cmpNumiBlockId(state) {
    return String(state.getBlock().builtInRegistryHolder().key().location())
}

// A Numismatics item that is used from the hand: the banking guide and the cards (not a coin, not a block).
function cmpNumiTool(stack) {
    if (stack.isEmpty()) return false
    const id = cmpNumiItemId(stack)
    return id.indexOf('numismatics:') == 0 && CMP_NUMI_COINS.indexOf(id) < 0 && !(stack.getItem() instanceof $CmpNumiBlockItem)
}

function cmpNumiCreative(entity) {
    return entity instanceof $CmpNumiPlayer && entity.isCreative()
}

ServerEvents.recipes(event => {
    event.remove({ output: '@numismatics' })
    event.remove({ mod: 'numismatics' })
})

ServerEvents.tags('item', event => {
    event.add('c:hidden_from_recipe_viewers', CMP_NUMI_HIDDEN)
})

// An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the server.
NativeEvents.onEvent($CmpNumiPriority.HIGHEST, 'net.neoforged.neoforge.event.level.BlockEvent$EntityPlaceEvent', event => {
    try {
        if (cmpNumiBlockId(event.getPlacedBlock()).indexOf('numismatics:') != 0) return
        if (cmpNumiCreative(event.getEntity())) return
        event.setCanceled(true)
    } catch (err) {
        console.error('numismatics (place): ' + err)
    }
})

NativeEvents.onEvent($CmpNumiPriority.HIGHEST, 'net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
    try {
        let player = event.getEntity()
        if (cmpNumiCreative(player)) return
        let target = cmpNumiBlockId(event.getLevel().getBlockState(event.getPos())).indexOf('numismatics:') == 0
        if (!target && !cmpNumiTool(event.getItemStack())) return
        event.setCanceled(true)
        event.setCancellationResult($CmpNumiResult.FAIL)
    } catch (err) {
        console.error('numismatics (click): ' + err)
    }
})

NativeEvents.onEvent($CmpNumiPriority.HIGHEST, 'net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickItem', event => {
    try {
        if (cmpNumiCreative(event.getEntity()) || !cmpNumiTool(event.getItemStack())) return
        event.setCanceled(true)
        event.setCancellationResult($CmpNumiResult.FAIL)
    } catch (err) {
        console.error('numismatics (use): ' + err)
    }
})
