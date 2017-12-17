var error = require('../../serror')
var res = require('../../res');
var wallet = require('../../../wallet/index');

module.exports = function (params) {
    var id = params[0];

    if (!id)
        id = 0;

    var obj = wallet.getAccountAddresses(id);

    return res(obj);
}