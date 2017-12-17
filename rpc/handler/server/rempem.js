var error = require('../../serror')
var orwelldb = require('../../../blockchain/orwelldb')

module.exports = function (params, cb) {
    var dbname = params[0], datasetname = params[1];

    if (!dbname)
        return error(error.INVALID_PARAMS, "dbname is required!")
    var _db;
    orwelldb(dbname)
            .then(function (db) {
                _db = db;
                return db.getPem(datasetname)//now encrypt only with rsa, ecdh later
            })
            .then(function (args) {
                
                if (args && args.oid && args.dbname == dbname && (datasetname == args.dataset || !datasetname)) {
                    _db
                            .keyStoreAccess()
                            .then(function (keystore) {
                                return keystore.deleteItem('pem', args.oid);
                            })
                            .then(function () {
                                cb(null, {oid: args.oid, deleted: true});
                            })
                } else {
                    cb({code: error.INVALID_RESULT, error: 'can not find pem with this db/dataset'}, null);
                }


                //cb(null, args.data.oid);
            })
            .catch(function (err) {
                cb({code: error.INVALID_RESULT, error: err}, null);

            })


    return -1;
}