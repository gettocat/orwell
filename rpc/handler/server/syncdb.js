var error = require('../../serror')
var hash = require('../../../crypto/hash')
var orwelldb = require('../../../blockchain/orwelldb');

module.exports = function (params, cb) {

    var dbname = params[0];
    var addr = false;

    if (!dbname)
        return error(error.INVALID_PARAMS, 'dbname is required');

    try {
        var dbname_ = dbname;
        dbname = hash.getPublicKeyHashByAddr(dbname).toString('hex');
        addr = dbname_
    } catch (e) {//not valid base58 is catched
        addr = hash.generateAddresFromAddrHash(dbname);
    }

    orwelldb.syncdb(dbname)
            .then(function () {
                cb(null, {status: true, "address": addr, "dbname": dbname});
            })

    return -1;



}