module.exports = function (argv, client) {

    client.send("mempoolinfo");

}