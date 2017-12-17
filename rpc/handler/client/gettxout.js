module.exports = function (argv, client) {

    var ar = argv._;
    client.send("txout", [ar[0], ar[1]]);

}