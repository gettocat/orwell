var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash');
var config = require('../../../config');
var wallet = require('../../../wallet/index')

module.exports = function (params) {
    var address = params[0];

    if (!address)
        return error(error.INVALID_PARAMS, 'need address');

    if (!hash.isValidAddress(address))
        return error(error.INVALID_PARAMS, 'not valid address' + address);

    var balance = wallet.getBalanceAddress(address);

    return res({address: address, balance: balance / config.blockchain.satoshicoin + 0});
}