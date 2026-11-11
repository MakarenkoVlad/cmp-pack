// /plot rent, /plot rent all and /plot buy: the money side of Season 2's city plots. The plot side is cmpwar's Plots class,
// which also has the rest of the /plot command; these join the same literal (Brigadier merges them), so a payment uses shop.js
// as it is and the two can't drift apart.
//
//   /plot rent [periods]       on a free rent plot you stand on: it's your crew's, paid for that long; on your crew's own: it runs longer
//   /plot rent all [periods]   from anywhere, every rented plot of your crew, each as far as the prepay limit lets it
//   /plot buy                  on a free plot for sale you stand on, once and for good
//
// Plots works out a Deal: a refusal, or a price in spurs. Then this does what a shop trade does, in one tick: a closed shop refuses (and rent stands still meanwhile: shop.js tells Plots), nobody
// pays within 30 seconds of taking damage, the coins come from the 36 main slots with change back, a payment whose change doesn't fit is refused
// with nothing changed, and one that would trip the tripwire is refused (the shop stays open and staff are told). What is paid counts in #spent, and each payment
// logs "[shop] plot <player> <party> <what> <spurs> spurs". The plot changes before the coins go, so an error in it costs nobody a coin.
//
// Rhino: a const inside a block fails, so everything below a function's top level is let. Java strings go through String().
const $CmpPlots = Java.loadClass('dev.cmp.cmpwar.Plots')
const $CmpPlotInt = Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType')

function cmpPlotPay(source, deal) {
    if (deal.refusal() != null) return cmpShopFail(source, String(deal.refusal()))
    const player = source.getPlayer()
    const server = source.getServer()
    if (!cmpShopOpen(server)) return cmpShopFail(source, 'The shop is closed right now, so plots can\'t be paid for.')
    if (!player.isAlive()) return 0
    const wait = cmpShopHurtWait(player)
    if (wait > 0) return cmpShopFail(source, 'You took damage in the last 30 seconds. Try again in ' + Math.ceil(wait / 1000) + 's.')
    const price = Number(deal.spurs())
    if (!cmpShopSpendable(price)) {
        console.error('[shop] refused a plot payment of ' + price + ' spurs from ' + cmpShopName(player))
        return cmpShopFail(source, CMP_SHOP_BAD_PRICE)
    }
    const wallet = cmpShopWallet(player)
    const pick = wallet.total < price ? null : cmpShopPick(wallet.counts, price)
    if (pick == null) return cmpShopFail(source, 'That costs ' + cmpShopPrice(price) + '. You have ' + cmpShopCog(wallet.total) + '.')
    const change = cmpShopCoinsFor(pick.change)
    const slots = cmpShopPlan(player, pick.take, change)
    if (slots == null) return cmpShopFail(source, "There's not enough room in your inventory for your change. Free up a slot and try again.")
    const stop = cmpShopTripwire(server, player, price)
    if (stop != null) return cmpShopFail(source, stop)
    let said = null
    try {
        said = String(deal.close())
    } catch (err) {
        console.error('[shop] plot payment of ' + price + ' spurs from ' + cmpShopName(player) + ' failed, nothing taken: ' + err)
        return cmpShopFail(source, CMP_SHOP_BAD_PRICE)
    }
    cmpShopApply(player, slots)
    cmpShopAddScore(server, '#spent', price)
    console.info('[shop] plot ' + cmpShopName(player) + ' ' + cmpShopLogParty(cmpShopTeam(player)) + ' ' + cmpShopLogName(deal.log()) + ' ' + price + ' spurs')
    let message = said + ' You paid ' + cmpShopPrice(price) + '.'
    if (change.length > 0) message += ' You got ' + cmpShopCoinWords(change) + ' back.'
    cmpShopSay(source, Text.green(message))
    return 1
}

// /plot rent <periods>. Players in the beta typed the plot's number here ("/plot rent 271") and got a line about
// 28 periods that explained nothing, so a refusal of a number that can't be periods also says what the number is.
// 28 is 7 days of 6-hour periods, the longest anyone can pay ahead with the settings as shipped.
const CMP_PLOT_MOST_PERIODS = 28
function cmpPlotRentFor(source, periods) {
    const deal = $CmpPlots.rent(source, periods)
    if (deal.refusal() != null && periods > CMP_PLOT_MOST_PERIODS) {
        return cmpShopFail(source, String(deal.refusal()) + ' The number after /plot rent is how many 6-hour periods to pay for, '
            + 'not the plot\'s number. Stand on the plot and type /plot rent.')
    }
    return cmpPlotPay(source, deal)
}

ServerEvents.commandRegistry(event => {
    const Commands = event.commands
    event.register(Commands.literal('plot')
        .then(Commands.literal('rent')
            .executes(ctx => cmpPlotPay(ctx.source, $CmpPlots.rent(ctx.source, 1)))
            .then(Commands.literal('all')
                .executes(ctx => cmpPlotPay(ctx.source, $CmpPlots.rentAll(ctx.source, 1)))
                .then(Commands.argument('periods', $CmpPlotInt.integer(1))
                    .executes(ctx => cmpPlotPay(ctx.source, $CmpPlots.rentAll(ctx.source, $CmpPlotInt.getInteger(ctx, 'periods'))))))
            .then(Commands.argument('periods', $CmpPlotInt.integer(1))
                .executes(ctx => cmpPlotRentFor(ctx.source, $CmpPlotInt.getInteger(ctx, 'periods')))))
        .then(Commands.literal('buy')
            .executes(ctx => cmpPlotPay(ctx.source, $CmpPlots.buy(ctx.source)))))
})
