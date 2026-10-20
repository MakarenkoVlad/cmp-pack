// These items are registered on both client and server startup; adding them requires a full restart.
// Reuse CBC's silver firing assembly and Create's unfinished mechanism with material-specific tints.
StartupEvents.registry('item', event => {
    const materials = [
        { id: 'cast_iron', name: 'Cast Iron', color: 0x8d8f91 },
        { id: 'bronze', name: 'Bronze', color: 0xdfa65d },
        { id: 'steel', name: 'Steel', color: 0xd2e5ee },
        { id: 'nethersteel', name: 'Nethersteel', color: 0xa18cbd }
    ]

    materials.forEach(material => {
        event.create('kubejs:' + material.id + '_mechanism')
            .displayName(material.name + ' Mechanism')
            .texture('createbigcannons:item/quickfiring_mechanism')
            .color(0, material.color)
            .tooltip('Used to craft ' + material.name + ' cannon firing assemblies.')

        // Create's item type displays assembly progress and keeps unfinished parts unstackable.
        event.create('kubejs:incomplete_' + material.id + '_mechanism', 'create:sequenced_assembly')
            .displayName('Incomplete ' + material.name + ' Mechanism')
            .texture('create:item/incomplete_precision_mechanism')
            .color(0, material.color)
    })
})
