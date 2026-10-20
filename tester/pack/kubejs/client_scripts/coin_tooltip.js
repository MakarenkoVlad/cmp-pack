// The six Numismatics coins come only from airdrops and are spent in /shop (server_scripts/shop.js and
// numismatics.js); one line on their tooltip says so.
ItemEvents.modifyTooltips(event => {
    event.add(['numismatics:spur', 'numismatics:bevel', 'numismatics:sprocket', 'numismatics:cog', 'numismatics:crown', 'numismatics:sun'],
        [Text.gray('You get these from airdrops and spend them with /shop')])
})
