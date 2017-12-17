var error = require('../../serror')
var res = require('../../res');
var bchain = require('../../../blockchain/index');

module.exports = function (params) {
    var txid = params[0];
    var index = params[1];

    if (!txid) {
        return error(error.INVALID_PARAMS, "need txid")
    } else {

        var blockchain = new bchain();
        return res(blockchain.getOut(txid, index));

    }
    
}