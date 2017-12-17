module.exports = function (argv, client) {

    client.send("addnode", argv._);

}