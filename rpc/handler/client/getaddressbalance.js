
module.exports = function (argv, client) {

    var address = argv._[0]

    client.send("addressbalance", [address]);



}