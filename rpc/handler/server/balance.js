var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash');
var config = require('../../../config');
var wallet = require('../../../wallet/index');

module.exports = function (params) {
    var id = params[0];

    if (!id)
        id = 0;

    var balance = wallet.getBalance(id);
    return res({ balance: balance / config.blockchain.satoshicoin + 0});
}