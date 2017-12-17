var error = require('../../serror')
var res = require('../../res');
var wallet = require('../../../wallet/index');
var hash = require('../../../crypto/hash');

module.exports = function (params) {
    var address = params[0];

    if (!address)
        return error(error.INVALID_PARAMS, 'need address to find account')

    if (!hash.isValidAddress(address))
        return error(error.INVALID_PARAMS, 'address is not valid')


    var obj = wallet.findAccountByAddr(address);

    if (!obj.hash && !obj.privateKey)
        return error(error.INVALID_RESULT, 'account with that address is not founded')

    return res({account: obj.hash, address: obj.address});
}