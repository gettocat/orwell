module.exports = function (argv, client) {

    client.send("getblocktemplate", argv._);

}