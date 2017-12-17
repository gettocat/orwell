var error = require('../../serror')
var res = require('../../res');
var tx = require('../../../blockchain/transaction/transaction')
var bchain = require('../../../blockchain/index')

module.exports = function (params) {

    var from = JSON.parse(params[0]);//array of [tx, indexoutinthistx]
    var blockchain = new bchain();
    for (var i in from) {

        var inp = from[i], addr = blockchain.getOut(inp[0], inp[1]).addr;
        from[i][2] = addr;

    }

    var to = JSON.parse(params[1]);//array of [amountin satoshi, addrout]

    if (!from.length) {
        return error(error.INVALID_PARAMS, "need one or more inputs in tx")
    }

    if (!to.length) {
        return  error(error.INVALID_PARAMS, "need one or more outputs in tx")
    }


    var t = new tx();
    t.setInputs(from);
    t.setOutputs(to);
    t.setPrivateKey(global.config['privateKey'])
    t.toHex();

    return res(t.toJSON());

}