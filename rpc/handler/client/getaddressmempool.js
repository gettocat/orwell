var error = require('../error')
var indexes = require('../../db/entity/block/indexes');
var tx = require('../../blockchain/transaction/transaction')
var hash = require('../../crypto/hash');

module.exports = function (argv, client) {

    var address = argv._[0];

    client.send("addressmempool", [address]);



}