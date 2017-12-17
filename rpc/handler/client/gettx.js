module.exports = function (argv, client) {

    var hash = argv._[0];

    client.send("tx", [hash]);



}