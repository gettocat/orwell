var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')
var orwelldb = require('../../../blockchain/orwelldb');

module.exports = function (params, cb) {

    var addressto = params[0], dataset = params[1],
            json = params[2], //{key: val}, for examples: lokijs https://rawgit.com/techfort/LokiJS/master/jsdoc/tutorial-Query%20Examples.html
            //this params wasnt tested correcty, possibly need update orwelldb.
            limit = params[3], //number or [limit, offset] or {limit: number, offset: number}
            order = params[4]; //[ {name: 'field', order: 'DESC or ASC'} ]

    if (!dataset)
        return error(error.INVALID_PARAMS, 'dataset is required');

    if (!hash.isValidAddress(addressto))
        return error(error.INVALID_PARAMS, 'addressto is not valid');

    if (!json)
        return error(error.INVALID_PARAMS, 'filter is required');

    try {
        content = JSON.parse(json);
    } catch (e) {
        try {
            var base64 = new Buffer(json, 'base64').toString('utf8');
            content = JSON.parse(base64)
        } catch (e) {
            return error(error.INVALID_PARAMS, 'filter is not valid json')
        }
    }


    var dbname = hash.getPublicKeyHashByAddr(addressto).toString('hex');
    //before send - need to sync db from blockchain.
    orwelldb.syncdb(dbname)
            .then(function () {

                orwelldb(dbname)
                        .then(function (db) {
                            return db.findItems(dataset, content, limit || 100, order || [])
                        })
                        .then(function (list) {
                            cb(null, list)
                        })
                        .catch(function (e) {
                            console.log(e);
                            cb(null, {})
                        })


            })


    return -1;



}