var error = require('../../serror')
var result_callback = require('../../res');


module.exports = function (params, cb) {
    var limit = parseInt(params[0]), offset = parseInt(params[1]);
    if (!Number.isFinite(offset) || isNaN(offset))
        offset = 0;

    if (!limit || !Number.isFinite(limit) || isNaN(limit))
        limit = 100;

    if (limit > 1000)
        limit = 1000;

    var bchain = require('../../../blockchain/index')
    var blockchain = new bchain();

    var arr = blockchain.getDatabases(limit, offset);
    return result_callback(arr);



}