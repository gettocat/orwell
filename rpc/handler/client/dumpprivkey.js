module.exports = function (argv, client) {

    var params = argv._;
    client.send("dumpprivkey", [params[0]]);

}