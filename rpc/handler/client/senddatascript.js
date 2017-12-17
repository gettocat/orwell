module.exports = function (argv, client) {

    client.send("senddatascript",  argv._);

}