var error = require('../../serror')
var res = require('../../res');
var orwelldb = require('../../../blockchain/orwelldb')
var fs = require('fs');
var nodeRSA = require('node-rsa')
var hash = require('../../../crypto/hash')

module.exports = function (params, cb) {
    var file = params[0], dbname = params[1], datasetname = params[2];

    if (!file)
        return error(error.INVALID_PARAMS, "path to pem file is required!")

    if (!dbname)
        return error(error.INVALID_PARAMS, "dbname is required!")

    //if get addr - convert to dbname, else - dont do anything.
    try {
        dbname = hash.getPublicKeyHashByAddr(dbname).toString('hex');
    } catch (e) {//not valid base58 is catched

    }

    if (!fs.existsSync(file))
        return error(error.INVALID_PARAMS, "pem file must exist!");

    var content = fs.readFileSync(file);
    if (!content)
        return error(error.INVALID_PARAMS, "pem file is empty")

    try {
        var key = new nodeRSA(content)
    } catch (e) {
        return error(error.INVALID_PARAMS, "pem file is undefined private key")
    }

    if (!key.isPrivate())
        return error(error.INVALID_PARAMS, "pem file is not a private key")

    if (key.isEmpty())
        return error(error.INVALID_PARAMS, "pem file is empty")


    orwelldb(dbname)
            .then(function (db) {
                return db.addPem(content.toString(), datasetname, 'rsa')//now encrypt only with rsa, ecdh later
            })
            .then(function (args) {
                cb(null, args.data.oid);
            })
            .catch(function (err) {
                cb({code: error.INVALID_RESULT, error: err}, null);

            })


    return -1;
}