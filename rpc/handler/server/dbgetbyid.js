var error = require('../../serror')
var hash = require('../../../crypto/hash')
var orwelldb = require('../../../blockchain/orwelldb');

module.exports = function (params, cb) {

    var addressto = params[0], dataset = params[1], oid = params[2]//get last revision of entry with oid = oid, at dataset@dbname

    if (!dataset)
        return error(error.INVALID_PARAMS, 'dataset is required');

    if (!hash.isValidAddress(addressto))
        return error(error.INVALID_PARAMS, 'addressto is not valid');

    if (!oid)
        return error(error.INVALID_PARAMS, 'oid is required');

    var dbname = hash.getPublicKeyHashByAddr(addressto).toString('hex');
    //before send - need to sync db from blockchain.
    orwelldb.syncdb(dbname)
            .then(function () {
                var _db;
                orwelldb(dbname)
                        .then(function (db) {
                            _db = db;
                            return db.getItem(dataset, oid)
                        })
                        .then(function (item) {
                            if (item) {
                                if (item.$loki)
                                    delete item.$loki;
                                if (item.meta)
                                    delete item.meta
                            }
                            
                            cb(null, item)
                        })
                        .catch(function (e) {
                            console.log(e);
                            cb(null, {})
                        })
            })


    return -1;



}