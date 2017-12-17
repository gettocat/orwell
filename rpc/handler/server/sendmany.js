/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')

module.exports = function (params) {

    var account_id = params[0], json = params[1];
    console.log('json', json);
    try {
        var obj = JSON.parse(json);
    } catch (e) {
        return error(error.INVALID_PARAMS, 'json is not valid, need format: {"address1":amount,"address2":"amount",...}');//this error never throwns
    }

    for (var i in obj) {

        if (!hash.isValidAddress(i))
            return error(error.INVALID_PARAMS, 'address ' + i + ' is not valid');

        if (!obj[i] || obj[i] <= 0)
            return error(error.INVALID_PARAMS, 'amount for address ' + i + ' is not valid');
    }

    var acc = wallet.getAccount(account_id);

    if (!acc.address)
        return error(error.INVALID_PARAMS, 'account not exist');//this error never throwns

    for (var i in obj) {//amount in orwl
        obj[i] *= 1e8;
    }

    var result = wallet.sendMulti(account_id, obj);

    if (result.status) {
        return res(result.hash);
    } else
        return error(error.INVALID_RESULT, result.error);

}