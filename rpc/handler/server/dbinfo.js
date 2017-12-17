var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')


module.exports = function (params, cb) {
    var db = params[0], dataset = params[1], limit = parseInt(params[2]), offset = parseInt(params[3]);
    if (!Number.isFinite(offset) || isNaN(offset))
        offset = 0;
    
    if (!limit || !Number.isFinite(limit) || isNaN(limit))
        limit = 100;
    
    if (limit > 1000)
        limit = 1000;
    
    if (!db)
        return error(error.INVALID_PARAMS, 'dbname is required');


    try {
        hash.isValidAddress(db).toString('hex');
        dbname = hash.getPublicKeyHashByAddr(db).toString('hex');
    } catch (e) {//not valid base58 is catched
        if (db.length == 40)//hash of pubkey
            dbname = db;
        else
            dbname = hash.getPublicKeyHashByAddr(hash.generateAddres(dbname)).toString('hex');//its publicKeyHex
    }

    var bchain = require('../../../blockchain/index')
    var blockchain = new bchain();

    if (!dataset) {
        var arr = blockchain.getDataSets(dbname);

        return result_callback({
            address: hash.generateAddresFromAddrHash(dbname),
            hash160: dbname,
            list: arr
        });
    } else {
        var records = blockchain.getDatascriptSlice(dbname, dataset, limit, offset);
        records.address = hash.generateAddresFromAddrHash(dbname);
        records.hash160 = dbname;
        records.dataset = dataset;
        return result_callback(records);
    }


}