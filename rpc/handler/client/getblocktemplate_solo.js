module.exports = function (argv, client) {

    var addr = argv._[0];
    var text = argv.coinbase;
    client.send("blocktemplate_solo", [addr, text], function (status, res) {
        console.log(JSON.stringify(res));
    });

}