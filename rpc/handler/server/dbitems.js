var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')


module.exports = function (params, cb) {

    var db = params[0], dataset = params[1]

    if (!db)
        return error(error.INVALID_PARAMS, 'dbname is required');

    try {
        dbname = hash.getPublicKeyHashByAddr(db).toString('hex');
    } catch (e) {//not valid base58 is catched
        dbname = db;
    }

    var bchain = require('../../../blockchain/index')
    var blockchain = new bchain();
    var arr = blockchain.getDatascriptList(dbname, false, true);
    if (!dataset) {
        var keys = Object.keys(arr);
        return result_callback(keys);
    }


    return result_callback(arr[dataset] || []);


}