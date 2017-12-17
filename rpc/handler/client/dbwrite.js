module.exports = function (argv, client) {

    client.send("dbwrite", argv._);

}