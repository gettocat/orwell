module.exports = function (argv, client) {

    client.send("dbsettings", argv._);

}