var error = require('../serror')
var res = require('../res');
var tx = require('../../blockchain/transaction/transaction')

module.exports = function (params) {

    var t = new tx(params[0]);
    t.fromHex();
    return res(t.toJSON());

}