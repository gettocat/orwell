module.exports = function (argv, client) {

    var params = argv._;
    client.send("consensus", [params[0]]);

}