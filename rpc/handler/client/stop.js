module.exports = function (argv, client) {
    var code = argv.shift()
    client.send("stop", [code]);
}