module.exports = function (argv, client) {

    var params = argv._;
    client.send("democracy.create", params);

}