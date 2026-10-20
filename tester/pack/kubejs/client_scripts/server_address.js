// CMP server address. It changes whenever the server moves to another machine (2026-09-27 at Bloom Host:
// 104.204.219.211 -> 104.204.219.198; 2026-10-16, the move to the PebbleHost box: -> 185.83.153.162).
// packwiz never overwrites a player's server list (servers.dat is "preserve" in the pack), so an entry
// saved before a move still points at the dead address. On every launch this moves such entries to the
// current address, or drops them when the list already has the current one. It does nothing once no old
// entry is left. The same address is in pack/servers.dat and the title screen (menu/build.py SERVER).
const CmpAddressMinecraft = Java.loadClass('net.minecraft.client.Minecraft')
const CmpAddressServerList = Java.loadClass('net.minecraft.client.multiplayer.ServerList')
const CMP_ADDRESS = '185.83.153.162:25565'
const CMP_OLD_ADDRESSES = ['104.204.219.211', '104.204.219.211:25565', '104.204.219.198', '104.204.219.198:25565']
let cmpAddressChecked = false

function cmpAddressIsCurrent(ip) {
    return ip == CMP_ADDRESS || ip + ':25565' == CMP_ADDRESS
}

NativeEvents.onEvent('net.neoforged.neoforge.client.event.ClientTickEvent$Post', event => {
    if (cmpAddressChecked) return
    cmpAddressChecked = true
    // An error thrown from a NativeEvents handler is not caught by KubeJS: it would crash the game.
    try {
        let list = new CmpAddressServerList(CmpAddressMinecraft.getInstance())
        list.load()
        let old = []
        let hasCurrent = false
        for (let i = 0; i < list.size(); i++) {
            let entry = list.get(i)
            let ip = String(entry.ip)
            if (CMP_OLD_ADDRESSES.indexOf(ip) >= 0) old.push(entry)
            else if (cmpAddressIsCurrent(ip)) hasCurrent = true
        }
        if (old.length == 0) return
        old.forEach((entry, i) => {
            if (hasCurrent || i > 0) list.remove(entry)
            else entry.ip = CMP_ADDRESS
        })
        list.save()
        console.info('CMP server address: ' + old.length + ' old entr' + (old.length == 1 ? 'y' : 'ies')
            + (hasCurrent ? ' removed (the list already has ' : ' now ') + CMP_ADDRESS + (hasCurrent ? ')' : ''))
    } catch (err) {
        console.error('CMP server address: ' + err)
    }
})
