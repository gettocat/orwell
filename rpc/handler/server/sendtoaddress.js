var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')

module.exports = function (params) {

    var address = params[0], amount = params[1], datascriptHEX = params[2];

    if (!hash.isValidAddress(address))
        return error(error.INVALID_PARAMS, 'address is no valid');

    if (amount <= 0)
        return error(error.INVALID_PARAMS, 'amount is not valid');

    var result = wallet.send(0, address, amount* config.blockchain.satoshicoin , datascriptHEX);

    if (result.status) {
        return res(result.hash);
    } else
        return error(error.INVALID_RESULT, result);

}