// CMP gunsmithing: a gun is a factory project. Steel from Create Big Cannons is pressed into billets,
// bored, rifled and polished into barrels on a belt (worn-down tools, some scrap), receivers are cut,
// milled, hardened in a blasting fan and quenched, bolts and trigger groups are assembled with springs and
// pins, stocks are sanded and oiled, and the gun is put together from those parts in a final assembly line.
// Replaces Create: Immersive TaCZ Integration's crafter recipes for the 12 Create Armorer guns and their
// three parts (guns.js removes the rest). The gun items and their stats stay the same.

const CMP_GUNS = {
    // name: [GunId, fire mode, first deployed part (unique per gun), further parts]
    pistol: ['create_armorer:pistol_auto_stress', 'SEMI', 'cmp:grip', ['createimmersivetacz:gun_barrel', 'create:brass_block']],
    revolver: ['create_armorer:pistol_revolver_torque', 'SEMI', 'create:cogwheel', ['createimmersivetacz:gun_barrel', 'cmp:grip']],
    smg: ['create_armorer:smg_auto_crank', 'AUTO', 'create:brass_ingot', ['createimmersivetacz:gun_barrel', 'cmp:grip', 'cmp:spring']],
    double_barrel_shotgun: ['create_armorer:shotgun_db_stone', 'SEMI', 'cmp:barrel_smooth', ['cmp:barrel_smooth', 'cmp:stock', 'create:brass_block']],
    pump_shotgun: ['create_armorer:shotgun_pump_bearing', 'SEMI', 'create:brass_block', ['cmp:barrel_smooth', 'cmp:stock', 'cmp:spring']],
    semi_rifle: ['create_armorer:sniper_semi_m1', 'SEMI', 'cmp:barrel_long', ['cmp:stock', 'cmp:spring']],
    assault_rifle: ['create_armorer:rifle_assult_crane', 'AUTO', 'create:precision_mechanism', ['cmp:barrel_long', 'cmp:stock', 'cmp:spring']],
    roller: ['create_armorer:rifle_assult_roller', 'AUTO', 'create:electron_tube', ['cmp:barrel_long', 'create:flywheel', 'create:precision_mechanism', 'cmp:stock']],
    grenade_launcher: ['create_armorer:gl_revolver_devastator', 'SEMI', 'create:large_cogwheel', ['cmp:barrel_heavy', 'cmp:stock', 'create:cogwheel']],
    lmg: ['create_armorer:mg_platemag_flywheel', 'AUTO', 'cmp:barrel_heavy', ['cmp:receiver', 'create:flywheel', 'create:precision_mechanism', 'cmp:stock', 'cmp:spring']],
    sniper: ['create_armorer:sniper_semi_clockwork', 'SEMI', 'cmp:barrel_precision', ['create:precision_mechanism', 'cmp:stock', 'create:precision_mechanism']],
    field_gun: ['create_armorer:cannon_40mm_salamander', 'SEMI', 'create:flywheel', ['cmp:barrel_heavy', 'cmp:barrel_heavy', 'cmp:receiver', 'create:large_cogwheel', 'cmp:stock']],
}

ServerEvents.recipes(event => {
    const ing = s => s.startsWith('#') ? { tag: s.substring(1) } : { item: s }
    const ingKeys = key => {
        const out = {}
        for (let k in key) out[k] = ing(key[k])
        return out
    }
    const fluid = (id, mb) => ({ type: 'neoforge:single', fluid: id, amount: mb })
    const steel = 'createbigcannons:steel_ingot'
    const scrap = 'createbigcannons:steel_scrap'

    // One step of a sequenced assembly on the transitional item t.
    const deploy = (t, item, keep) => Object.assign({ type: 'create:deploying', ingredients: [ing(t), ing(item)], results: [{ id: t }] }, keep ? { keep_held_item: true } : {})
    const press = t => ({ type: 'create:pressing', ingredients: [ing(t)], results: [{ id: t }] })
    const cut = t => ({ type: 'create:cutting', ingredients: [ing(t)], results: [{ id: t }], processing_time: 100 })
    const fill = (t, f, mb) => ({ type: 'create:filling', ingredients: [ing(t), fluid(f, mb)], results: [{ id: t }] })
    const sequence = (id, input, transitional, loops, steps, results) => event.custom({
        type: 'create:sequenced_assembly', ingredient: ing(input), transitional_item: { id: transitional },
        loops: loops, sequence: steps, results: results,
    }).id('cmp:gunsmithing/' + id)

    // Out with the crafter recipes.
    Object.keys(CMP_GUNS).forEach(name => event.remove({ id: 'createimmersivetacz:guns/' + name }))
    event.remove({ id: 'createimmersivetacz:gun_barrel' })
    event.remove({ id: 'createimmersivetacz:firing_mechanism' })
    event.remove({ id: 'createimmersivetacz:gun_trigger' })

    // ---------- tools (nethersteel and diamond, worn down on the belt)
    const crafter = (id, pattern, key, result) => event.custom({
        type: 'create:mechanical_crafting', accept_mirrored: false, pattern: pattern,
        key: ingKeys(key), result: { id: result },
    }).id('cmp:gunsmithing/' + id)
    crafter('boring_bar', ['NSSSD'], { N: 'createbigcannons:nethersteel_ingot', S: steel, D: 'minecraft:diamond' }, 'cmp:boring_bar')
    crafter('rifling_broach', [' D ', 'NSN', ' D '], { N: 'createbigcannons:nethersteel_ingot', S: steel, D: 'minecraft:diamond' }, 'cmp:rifling_broach')
    crafter('milling_cutter', ['DND', 'NPN', 'DND'], { N: 'createbigcannons:nethersteel_ingot', P: 'create:precision_mechanism', D: 'minecraft:diamond' }, 'cmp:milling_cutter')

    // ---------- billets: steel pressed together hot in a basin
    const billet = (id, items, heat) => event.custom({
        type: 'create:compacting', heat_requirement: heat, ingredients: items.map(ing), results: [{ id: 'cmp:' + id }],
    }).id('cmp:gunsmithing/' + id)
    billet('billet_small', [steel, steel, steel], 'heated')
    billet('billet_long', [steel, steel, steel, steel, steel], 'heated')
    billet('billet_smooth', [steel, steel, steel, steel, 'createbigcannons:cast_iron_ingot'], 'heated')
    billet('billet_heavy', [steel, steel, steel, steel, steel, steel, 'create:copper_sheet', 'create:copper_sheet'], 'superheated')
    billet('billet_precision', [steel, steel, steel, steel, 'createbigcannons:nethersteel_ingot', 'createbigcannons:nethersteel_ingot'], 'superheated')

    // ---------- barrels: bore (tool wears), deburr, cool, rifle (tool wears), polish; some come out as scrap
    const B = 'cmp:incomplete_barrel'
    const bore = [deploy(B, 'cmp:boring_bar'), cut(B), fill(B, 'minecraft:water', 100)]
    const rifle = [deploy(B, 'cmp:rifling_broach'), press(B)]
    const polish = [deploy(B, '#create:sandpaper')]
    const barrel = (id, billetId, loops, steps, chance, result) => sequence(id, billetId, B, loops, steps,
        [{ id: result, chance: chance }, { id: scrap, count: 4, chance: 100 - chance }])
    barrel('barrel_short', 'cmp:billet_small', 4, bore.concat(rifle, polish), 85, 'createimmersivetacz:gun_barrel')
    barrel('barrel_smooth', 'cmp:billet_smooth', 5, bore.concat(polish), 85, 'cmp:barrel_smooth')
    barrel('barrel_long', 'cmp:billet_long', 6, bore.concat(rifle, polish), 80, 'cmp:barrel_long')
    barrel('barrel_heavy', 'cmp:billet_heavy', 6, bore.concat(rifle, polish), 80, 'cmp:barrel_heavy')
    barrel('barrel_precision', 'cmp:billet_precision', 8, bore.concat(rifle, rifle, polish), 70, 'cmp:barrel_precision')

    // ---------- receiver: saw a steel block, mill (tool wears), press; harden in a blasting fan, quench
    event.custom({ type: 'create:cutting', ingredients: [ing('createbigcannons:steel_block')], results: [{ id: 'cmp:receiver_blank' }], processing_time: 400 })
        .id('cmp:gunsmithing/receiver_blank')
    const R = 'cmp:incomplete_receiver'
    sequence('receiver_soft', 'cmp:receiver_blank', R, 4, [deploy(R, 'cmp:milling_cutter'), deploy(R, 'cmp:milling_cutter'), press(R)],
        [{ id: 'cmp:receiver_soft', chance: 90 }, { id: scrap, count: 6, chance: 10 }])
    event.blasting('cmp:receiver_hot', 'cmp:receiver_soft').cookingTime(400).id('cmp:gunsmithing/receiver_hot')
    event.custom({ type: 'create:splashing', ingredients: [ing('cmp:receiver_hot')], results: [{ id: 'cmp:receiver' }] })
        .id('cmp:gunsmithing/receiver')

    // ---------- springs, pins, bolt (the Firing Mechanism), trigger group
    // Springs are wound from brass in a basin (sawing a brass sheet is taken by the ammo casings).
    event.custom({ type: 'create:compacting', ingredients: [ing('create:brass_nugget'), ing('create:brass_nugget'), ing('create:brass_nugget')],
        results: [{ id: 'cmp:spring' }] }).id('cmp:gunsmithing/spring')
    event.custom({ type: 'create:cutting', ingredients: [ing(scrap)], results: [{ id: 'cmp:firing_pin' }], processing_time: 60 })
        .id('cmp:gunsmithing/firing_pin')
    event.custom({ type: 'create:pressing', ingredients: [ing(steel)], results: [{ id: 'cmp:bolt_blank' }] })
        .id('cmp:gunsmithing/bolt_blank')
    const BO = 'cmp:incomplete_bolt'
    sequence('firing_mechanism', 'cmp:bolt_blank', BO, 3, [deploy(BO, 'cmp:spring'), deploy(BO, 'cmp:firing_pin'), deploy(BO, 'cmp:milling_cutter'), press(BO)],
        [{ id: 'createimmersivetacz:firing_mechanism' }])
    const T = 'cmp:incomplete_trigger'
    sequence('gun_trigger', 'create:brass_sheet', T, 2, [deploy(T, 'cmp:spring'), deploy(T, 'create:precision_mechanism'), deploy(T, 'cmp:firing_pin'), press(T)],
        [{ id: 'createimmersivetacz:gun_trigger' }])

    // ---------- stock and grip: cut to shape in a crafter, sanded (sandpaper wears) and oiled with honey
    crafter('stock_blank', ['LLL ', '  LL'], { L: '#minecraft:logs' }, 'cmp:stock_blank')
    const S = 'cmp:incomplete_stock'
    sequence('stock', 'cmp:stock_blank', S, 2, [deploy(S, '#create:sandpaper'), fill(S, 'create:honey', 100)], [{ id: 'cmp:stock' }])
    event.custom({ type: 'create:cutting', ingredients: [ing('cmp:stock')], results: [{ id: 'cmp:grip', count: 2 }] })
        .id('cmp:gunsmithing/grip')

    // ---------- final assembly on the receiver: barrel, bolt, trigger, stock, extras, pressed together
    const G = 'cmp:incomplete_gun'
    Object.keys(CMP_GUNS).forEach(name => {
        const gun = CMP_GUNS[name]
        const gunId = gun[0], mode = gun[1], first = gun[2], parts = gun[3]
        const steps = [deploy(G, first)].concat(parts.map(p => deploy(G, p)),
            [deploy(G, 'createimmersivetacz:firing_mechanism'), deploy(G, 'createimmersivetacz:gun_trigger'), press(G)])
        sequence('gun_' + name, 'cmp:receiver', G, 1, steps,
            [{ id: 'tacz:modern_kinetic_gun', components: { 'minecraft:custom_data': { GunId: gunId, GunFireMode: mode } } }])
    })
})
