module.exports = function (argv, client) {

    client.send("syncdb", argv._);

}