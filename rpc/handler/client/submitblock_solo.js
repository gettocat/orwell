
module.exports = function (argv, client) {

    client.send("submitblock_solo", [argv.block], function (status, res) {
        console.log(JSON.stringify(res));
    });

}