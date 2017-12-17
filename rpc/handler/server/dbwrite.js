var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')
var dscript = require('orwelldb').datascript;
var Script = require('../../../blockchain/script/script')
var orwelldb = require('../../../blockchain/orwelldb');

module.exports = function (params, cb) {

    var addressfrom = params[0], addressto = params[1], dataset = params[2], json = params[3];

    if (!dataset)
        return error(error.INVALID_PARAMS, 'dataset is required');

    if (!hash.isValidAddress(addressfrom))
        return error(error.INVALID_PARAMS, 'addressfrom is not valid');

    if (!hash.isValidAddress(addressto))
        return error(error.INVALID_PARAMS, 'addressto is not valid');

    if (!json)
        return error(error.INVALID_PARAMS, 'data_json_array is required');

    try {
        content = JSON.parse(json);
    } catch (e) {
        try {
            var base64 = new Buffer(json, 'base64').toString('utf8');
            content = JSON.parse(base64)
        } catch (e) {
            return error(error.INVALID_PARAMS, 'data_json_array is not valid json array')
        }
    }

    if (!(content instanceof Array))
        content = [content];


    var dbname = hash.getPublicKeyHashByAddr(addressto).toString('hex');
    //before send - need to sync db from blockchain.
    orwelldb.syncdb(dbname)
            .then(function () {
                var acc = wallet.findAccountByAddr(addressfrom);
                if (!acc)
                    return cb({error: 'addressfrom is not exist in yout wallet', code: error.INVALID_PARAMS}, null);
                
                orwelldb.export(dbname, acc.publicKey,
                        function (db) {
                            var arr = [];
                            try {
                                for (var i in content) {
                                    arr.push(db.write(dataset, content[i]))
                                }
                            } catch (e) {
                                console.log(e)
                            }

                            return new Promise(function (resolve) {

                                Promise.all(arr)
                                        .then(function (res) {
                                            console.log(res);

                                            resolve(res);

                                        })

                            })
                        })
                        .then(function (hex) {
                            //todo: rollback changes in db on send-error

                            if (hex == 'ef00') {
                                cb({
                                    error: 'ds is not valid',
                                    code: error.INVALID_RESULT
                                }, null);
                                return;
                            }

                            var result = wallet.sendFromAddress(addressfrom, addressto, 0, hex);

                            if (result.status) {
                                cb(null, result.hash);
                            } else
                                cb({
                                    error: result,
                                    code: error.INVALID_RESULT
                                }, null);

                        })
                        .catch(function (e) {
                            console.log(e)
                        })

            })


    return -1;



}