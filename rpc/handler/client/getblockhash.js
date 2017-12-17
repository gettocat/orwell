var error = require('../error')
var indexes = require('../db/entity/block/indexes');

module.exports = function (argv, client) {

    var index = argv._[0];
    client.send("bestblockhash", [index]);

}