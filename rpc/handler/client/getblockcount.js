var indexes = require('../db/entity/block/indexes');

module.exports = function (argv, client) {

    client.send("blockcount");

}