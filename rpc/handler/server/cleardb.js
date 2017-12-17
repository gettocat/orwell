var error = require('../../serror')
var hash = require('../../../crypto/hash')
var config = require('../../../config')
var res = require('../../res')
var cnf1 = require('../../../tools/config');
var fs = require('fs')

module.exports = function (params, cb) {

    var dbname = params[0];

    if (!dbname)
        return error(error.INVALID_PARAMS, 'dbname is required');

    try {
        dbname = hash.getPublicKeyHashByAddr(dbname).toString('hex');
    } catch (e) {//not valid base58 is catched

    }

    var cnf = config.orwelldb;
    cnf.path = cnf.path.replace("%home%", cnf1.getLocalHomePath())

    fs.unlinkSync(cnf.path + "/" + dbname);

    return res(true);



}