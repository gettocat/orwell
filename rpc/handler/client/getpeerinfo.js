module.exports = function (argv, client) {

    client.send("peerinfo", argv._);

}