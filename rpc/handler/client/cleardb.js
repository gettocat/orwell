module.exports = function (argv, client) {

    client.send("cleardb", argv._);

}