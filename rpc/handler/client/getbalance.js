
module.exports = function (argv, client) {

    var acc = argv._[0]
    client.send("balance", [acc]);



}