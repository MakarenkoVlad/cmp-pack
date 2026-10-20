// One deterministic assembly cycle makes each material's firing mechanism.
// Each ingot is a separate deploying step: Create deployers consume one item per operation.
ServerEvents.recipes(event => {
    const materials = [
        { id: 'cast_iron', base: 'createages:andesite_mechanism', plate: 'create:iron_sheet' },
        { id: 'bronze', base: 'createages:andesite_mechanism', plate: 'create:iron_sheet' },
        { id: 'steel', base: 'create:precision_mechanism', plate: 'create:iron_sheet' },
        { id: 'nethersteel', base: 'kubejs:steel_mechanism', plate: 'create:sturdy_sheet' }
    ]

    materials.forEach(material => {
        const unfinished = 'kubejs:incomplete_' + material.id + '_mechanism'
        const deploy = ingredient => ({
            type: 'create:deploying',
            ingredients: [{ item: unfinished }, ingredient],
            results: [{ id: unfinished }]
        })

        // The 1.21 Create schema uses "id" for output stacks and the transitional item.
        // Incomplete items exist only inside this sequence and have no standalone crafting recipe.
        event.custom({
            type: 'create:sequenced_assembly',
            ingredient: { item: material.base },
            transitional_item: { id: unfinished },
            loops: 1,
            sequence: [
                deploy({ tag: 'c:ingots/' + material.id }),
                deploy({ tag: 'c:ingots/' + material.id }),
                deploy({ item: material.plate }),
                {
                    type: 'create:pressing',
                    ingredients: [{ item: unfinished }],
                    results: [{ id: unfinished }]
                }
            ],
            results: [{ id: 'kubejs:' + material.id + '_mechanism' }]
        }).id('cmp:artillery/mechanism/' + material.id)
    })
})
