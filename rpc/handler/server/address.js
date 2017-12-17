var error = require('../../serror')
var res = require('../../res');
var hash = require('../../../crypto/hash');

module.exports = function (params) {
    var address = params[0], limit = parseInt(params[1]), offset = parseInt(params[2]);

    if (!Number.isFinite(offset) || isNaN(offset))
        offset = 0;

    if (!limit || !Number.isFinite(limit) || isNaN(limit))
        limit = 100;

    if (limit > 1000)
        limit = 1000;

    if (!address)
        return error(error.INVALID_PARAMS, 'need address');

    try {
        hash.isValidAddress(address).toString('hex');
        addr = address
    } catch (e) {//not valid base58 is catched
        try {
            if (address.length == 40)//hash of pubkey
                addr = hash.generateAddresFromAddrHash(addr)
            else
                addr = hash.generateAddres(address);//its hash
        } catch (e) {
            return error(error.INVALID_PARAMS, 'not valid address' + address);
        }
    }

    if (!hash.isValidAddress(addr))
        return error(error.INVALID_PARAMS, 'not valid address' + addr);

    var utxo = require('../../../db/entity/tx/utxo')

    return res({address: addr, hash160: hash.getPublicKeyHashByAddr(addr).toString('hex'), unspent: utxo.getUTXOList(addr, limit, offset)});
}