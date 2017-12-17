var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash');
var wallet = require('../../../wallet/index');

module.exports = function (params) {
    var addr = params[0];

    if (!addr)
        return error(error.INVALID_PARAMS, "need address to dump private key");

    var obj = wallet.findAccountByAddr(addr);
    var key = obj.privateKey;
    var public = obj.publicKey;

    return res({address: addr, publicKey: public, privateKeyWIF: hash.generatePrivateWIF(key), privateKey: key});
}