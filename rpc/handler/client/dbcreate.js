module.exports = function (argv, client) {

    client.send("dbcreate", argv._);

}