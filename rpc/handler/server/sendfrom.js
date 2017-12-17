var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')

module.exports = function (params) {

    var account_id = params[0], address = params[1], amount = params[2], datascriptHEX = params[3];

    var acc = null, addrfrom = null
    try {
        if (hash.isValidAddress(account_id))
            addrfrom = account_id;
        else
            acc = wallet.getAccount(account_id);
    } catch (e) {
        acc = wallet.getAccount(account_id);
    }


    if (!addrfrom && !acc.address)
        error(error.INVALID_PARAMS, 'account not exist');//this error never throwns

    if (hash.isValidAddress(address))
        error(error.INVALID_PARAMS, 'address is no valid');

    if (amount <= 0)
        error(error.INVALID_PARAMS, 'amount is not valid');


    if (addrfrom)
        var result = wallet.sendFromAddress(account_id, address, amount * config.blockchain.satoshicoin, datascriptHEX);
    else
        var result = wallet.send(account_id, address, amount * config.blockchain.satoshicoin, datascriptHEX);

    if (result.status) {
        return res(result.hash);
    } else
        return error(error.INVALID_RESULT, result);

}