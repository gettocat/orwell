module.exports = function (argv, client) {

    client.send("submitblock", argv._);

}