module.exports = function (argv, client) {

    var id = argv._[0];

    client.send("newaddress", [id]);



}