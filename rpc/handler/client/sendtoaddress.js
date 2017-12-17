
module.exports = function (argv, client) {

    client.send("sendtoaddress", argv._);

}