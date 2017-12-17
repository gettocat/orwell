module.exports = function (argv, client) {

    var hashes = argv._;
    client.send("blockheader", hashes);


}