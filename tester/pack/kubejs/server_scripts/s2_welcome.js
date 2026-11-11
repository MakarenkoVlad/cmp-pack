// The first-join welcome and the Quest Book. In the beta 27 players joined, half played under an hour and only 2 placed a
// core; the chat was full of "how to buy a plot" and "where do you get lava". Nothing in the game said /kit, /money or
// /plot, and in the city a block can only be placed on a plot, so a new player could do nothing.
// The guide lives in the quest book (FTB Quests), as its first page, written by scripts/questbook.py with the rest of the
// book (Vlad, 2026-11-11: "they should open in questbook and guide should be in questbook too"). Players open the book
// with FTB Quests' own item, the Quest Book: a right-click opens the quest window on the player's own game, with no
// permission needed. So a player's first login gives them one, and one short line says what is in it. Open Parties and
// Claims refuses most items used in a claim that isn't the player's, the city's included, with a "not allowed" line in
// chat; the book is on its itemUseProtectionExceptionList (pack/config/openpartiesandclaims-server.toml), since on the
// server its use does nothing.
// The book is given 5 seconds after the first login, so the line lands under the join messages. Whether a player has had
// it is kept in their KubeJS persistent data, like /kit's timer. The key is new with the book, so a player who only saw
// the old chat guide (beta, test server) still gets a book once.
// /quests and /guide give a new book to a player who has none, and tell a player who has one to right-click it. FTB
// Quests keeps the book through death by itself (drop_book_on_death, which data.snbt leaves off; it takes the book out of
// the drops before the Corpse mod gathers them), so a lost book is one thrown away, put in a chest or burnt. Its own recipe, a book and a stone block (#c:stones: stone, andesite, diorite,
// granite, deepslate, tuff), can be made in Season 2: the paper from /kit2's sugar cane, the leather from its cows.
const CMP_QUEST_BOOK_GIVEN = 'cmp_s2_quest_book'
const CMP_QUEST_BOOK = 'ftbquests:book'
const CmpQuestBookStack = Java.loadClass('net.minecraft.world.item.ItemStack')

// How many Quest Books a player carries: the 36 main slots, the armour slots and the off hand.
function cmpQuestBooks(player) {
    const inv = player.inventory
    const book = Item.of(CMP_QUEST_BOOK)
    let n = 0
    for (let i = 0; i < inv.getContainerSize(); i++) {
        let stack = inv.getItem(i) // let: Rhino keeps the first value of a const declared in a loop
        if (!stack.isEmpty() && CmpQuestBookStack.isSameItem(stack, book)) n += stack.getCount()
    }
    return n
}

// Puts one Quest Book in a free main slot. False, and nothing given, when no slot is free: give() would drop it at the
// player's feet, which on an island edge or an airship is the void.
function cmpQuestBookGive(player) {
    return player.inventory.add(Item.of(CMP_QUEST_BOOK))
}

function cmpQuestBookWelcome(player) {
    player.tell(Text.gold('Welcome to CMP Season 2.'))
    if (cmpQuestBooks(player) > 0 || cmpQuestBookGive(player)) {
        player.tell(Text.yellow('The guide and the quests are in your Quest Book. Hold it, right-click and open "Welcome to the city". Lost it? /quests gives a new one.'))
    } else {
        player.tell(Text.red('Your inventory is full, so you got no Quest Book. It holds the guide and the quests: make room and type /quests.'))
    }
}

// Every login of a player who has had no book sets up a call 5 seconds later. The call finds the player by id, so a
// player who left in the meantime gets nothing (and the book at their next login), and one who came back gets it on
// the new login's player. It checks the flag again: two logins inside the 5 seconds set up two calls, and only the
// first may give a book.
function cmpQuestBookLogin(server, player) {
    if (player.persistentData.getBoolean(CMP_QUEST_BOOK_GIVEN)) return
    const id = player.getGameProfile().getId() // KubeJS hides Entity.getUUID() from scripts; the profile id is the same
    const name = player.getGameProfile().getName()
    server.scheduleInTicks(100, () => {
        try {
            let now = server.getPlayerList().getPlayer(id)
            if (now == null || !now.isAlive()) return
            if (now.persistentData.getBoolean(CMP_QUEST_BOOK_GIVEN)) return
            now.persistentData.putBoolean(CMP_QUEST_BOOK_GIVEN, true)
            cmpQuestBookWelcome(now)
        } catch (err) {
            console.error('[guide] could not give ' + name + ' a quest book: ' + err)
        }
    })
}

PlayerEvents.loggedIn(event => {
    cmpQuestBookLogin(event.server, event.player)
})

// /quests and /guide: a new Quest Book for a player who has none. Nothing opens the book from a command any more.
function cmpQuestBookCommand(ctx, name) {
    const player = ctx.source.player
    if (!player) {
        ctx.source.sendFailure(Text.of('Only players can use /' + name + '.'))
        return 0
    }
    if (cmpQuestBooks(player) > 0) {
        player.tell(Text.yellow('Your Quest Book is in your inventory. Hold it and right-click to open it.'))
        return 1
    }
    if (!player.isAlive()) return 0
    if (!cmpQuestBookGive(player)) {
        player.tell(Text.red('Your inventory is full. Make some room and try /' + name + ' again.'))
        return 0
    }
    player.tell(Text.gold("Here's a new Quest Book. Hold it and right-click to open it."))
    return 1
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('quests').executes(ctx => cmpQuestBookCommand(ctx, 'quests')))
    event.register(Commands.literal('guide').executes(ctx => cmpQuestBookCommand(ctx, 'guide')))
})
