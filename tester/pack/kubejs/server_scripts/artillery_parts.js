// Finished artillery parts are made with mechanical crafters instead of casting, boring and built-up
// heating. cmpfixes' CbcArtilleryManufacturingMixin removes those custom CBC recipes on every reload.
// Mechanisms belong to the firing assembly; extending or replacing a barrel costs its metal, not
// another mechanism. Heavy and twin breeches build on ordinary breeches and contain two mechanisms.
// Existing weapons, ammunition, rocket pods and primitive log/wrought-iron cannons keep working.
ServerEvents.recipes(event => {
    function part(output, material, pattern, extra) {
        const available = Object.assign({
            I: { tag: 'c:ingots/' + material },
            B: { tag: 'c:storage_blocks/' + material },
            M: { item: 'kubejs:' + material + '_mechanism' },
            S: { item: 'create:shaft' },
            R: { item: 'createbigcannons:recoil_spring' },
            Q: { item: 'createbigcannons:quickfiring_mechanism' }
        }, extra || {})
        const key = {}
        pattern.join('').split('').forEach(symbol => {
            if (symbol !== ' ') key[symbol] = available[symbol]
        })
        const recipeId = 'cmp:artillery/parts/' + output.replace(':', '/')
        // No alternative normal recipe may produce the same finished part without this assembly.
        event.remove({ output: output })
        event.custom({
            type: 'create:mechanical_crafting',
            accept_mirrored: false,
            category: 'misc',
            pattern: pattern,
            key: key,
            result: { id: output, count: 1 }
        }).id(recipeId)
    }

    ;['cast_iron', 'bronze', 'steel', 'nethersteel'].forEach(material => {
        const cbc = suffix => 'createbigcannons:' + material + '_' + suffix
        const at = suffix => 'cbc_at:' + material + '_' + suffix
        const parent = id => ({ P: { item: id } })

        // Seven ingots per barrel. Bronze/cast-iron chambers use twelve; the two layered materials
        // retain their original 28-ingot chamber cost (three storage blocks plus one ingot).
        part(cbc('cannon_barrel'), material, ['III', 'I I', 'I I'])
        if (material === 'cast_iron' || material === 'bronze') {
            part(cbc('cannon_chamber'), material, ['IIII', 'I  I', 'I  I', 'IIII'])
            part(cbc('cannon_end'), material, ['B', 'M'])
        } else {
            part(cbc('cannon_chamber'), material, [' B ', 'BIB'])
            part('createbigcannons:built_up_' + material + '_cannon_barrel',
                material, ['B', 'P'], parent(cbc('cannon_barrel')))
            part('createbigcannons:built_up_' + material + '_cannon_chamber',
                material, ['III', 'IPI', ' B '], parent(cbc('cannon_chamber')))
            part('createbigcannons:thick_' + material + '_cannon_chamber',
                material, ['BIB', ' P ', ' I '],
                parent('createbigcannons:built_up_' + material + '_cannon_chamber'))
            part(cbc('screw_breech'), material, ['B', 'M', 'S'])
        }
        if (material !== 'nethersteel') {
            part(cbc('sliding_breech'), material, [' S ', 'MB '])
            // The installed quick-firing conversion still works in-world too; both paths start
            // from a finished sliding breech, which already contains its material mechanism.
            part(cbc('quickfiring_breech'), material, ['P', 'Q'], parent(cbc('sliding_breech')))
        }

        // Big-cannon attachments. Rifling/suppressing a barrel adds two matching ingots.
        part(at('rifled_barrel'), material, ['I', 'P', 'I'], parent(cbc('cannon_barrel')))
        part(at('silencer'), material, ['IPI'], parent(cbc('cannon_barrel')))
        part(at('muzzle_brake'), material, ['B', 'G'], { G: { item: 'minecraft:iron_bars' } })
        part(at('fume_extractor'), material, ['B', 'F'], { F: { item: 'create:fluid_pipe' } })
        if (material === 'steel' || material === 'nethersteel') {
            ;['rifled_barrel', 'silencer'].forEach(component => {
                part('cbc_at:built_up_' + material + '_' + component,
                    material, ['B', 'P'], parent(at(component)))
            })
        }

        // There are no nethersteel autocannon blocks in the installed mods.
        if (material === 'nethersteel') return

        part(cbc('autocannon_barrel'), material, ['I', 'I', 'I'])
        part(cbc('autocannon_recoil_spring'), material, [' I ', 'IRI', ' I '])
        part(cbc('autocannon_breech'), material, ['II', 'MI', ' I'])
        part(at('autocannon_muzzle_brake'), material, ['I I', ' I '])
        part(at('autocannon_silencer'), material, ['III'])

        // A heavy barrel and its attachments have twice an ordinary part's metal. The breech
        // needs a second mechanism; its manual/quick-firing version adds the existing CBC lever.
        ;['barrel', 'muzzle_brake', 'silencer'].forEach(component => {
            const base = component === 'barrel' ? cbc('autocannon_barrel') : at('autocannon_' + component)
            part(at('heavy_autocannon_' + component), material, [' I ', 'IPI'], parent(base))
        })
        part(at('heavy_autocannon_recoil_spring'), material, ['IPI'], parent(cbc('autocannon_recoil_spring')))
        part(at('heavy_autocannon_breech'), material, [' I ', 'P M', ' I '], parent(cbc('autocannon_breech')))
        part(at('heavy_autocannon_qfbreech'), material, ['P', 'Q'], parent(at('heavy_autocannon_breech')))

        // Twins combine two complete ordinary parts. Orientation is explicit, so horizontal and
        // vertical twins never share a crafting grid. Each twin breech inherits two mechanisms.
        ;['barrel', 'breech', 'recoil_spring', 'muzzle_brake', 'silencer'].forEach(component => {
            const base = component === 'muzzle_brake' || component === 'silencer'
                ? at('autocannon_' + component) : cbc('autocannon_' + component)
            part(at('twin_autocannon_' + component), material, ['PP'], parent(base))
            const vertical = component === 'silencer' ? [' I ', ' P ', ' P ', ' I '] : ['P', 'P']
            part(at('vert_twin_autocannon_' + component), material, vertical, parent(base))
        })
    })
})
