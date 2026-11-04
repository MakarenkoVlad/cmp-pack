// Smart Glasses terminal rendering workaround for CMP / Minecraft 1.21.1.
// Keep this filename so pack updates replace the manually tested workaround.
// Repaints the existing terminal after the screen, above its background.
// Does not change computer data, input handling, items, or other screens.
// Confirmed on an affected GTX 1080 client; the original draw was invisible despite valid terminal data.
let cmpGrScreen = null
let cmpGrWidget = null
let cmpGrReported = false
let cmpGrFailed = false

NativeEvents.onEvent('net.neoforged.neoforge.client.event.ScreenEvent$Render$Post', event => {
    if (cmpGrFailed) return
    let screen = event.getScreen()
    if (String(screen).indexOf('de.srendi.advancedperipherals.client.screens.SmartGlassesScreen@') != 0) {
        cmpGrScreen = null
        cmpGrWidget = null
        return
    }

    try {
        let children = screen.children()
        if (screen != cmpGrScreen || !children.contains(cmpGrWidget)) {
            cmpGrScreen = screen
            cmpGrWidget = null
            cmpGrReported = false
            for (let i = 0; i < children.size(); i++) {
                let child = children.get(i)
                if (String(child).indexOf('TerminalWidget@') >= 0) {
                    cmpGrWidget = child
                    break
                }
            }
        }
        if (cmpGrWidget == null || !cmpGrWidget.visible) return

        let graphics = event.getGuiGraphics()
        graphics.flush()
        let pose = graphics.pose()
        pose.pushPose()
        try {
            // Keep below ordinary tooltips, but clear of the screen background.
            pose.translate(0, 0, 100)
            cmpGrWidget.renderWidget(graphics, event.getMouseX(), event.getMouseY(), event.getPartialTick())
            graphics.flush()
        } finally {
            pose.popPose()
        }
        if (!cmpGrReported) {
            let directGpu = 'unavailable'
            try {
                let hooks = Java.loadClass('com.tom.directgpu.client.DirectGPUTerminalClientHooks')
                directGpu = String(hooks.getDisplayForCurrentScreen())
            } catch (ignored) {}
            console.info('CMP GLASSES REDRAW v1 active: terminal render called after screen; directGpuDisplay=' + directGpu)
            cmpGrReported = true
        }
    } catch (err) {
        cmpGrFailed = true
        console.error('CMP GLASSES REDRAW disabled after error: ' + err)
    }
})

console.info('CMP GLASSES REDRAW v1 loaded')
