var res = require('../../res');
var hash = require('../../../crypto/hash');

module.exports = function (params) {
    var address = params[0];
    var val = false

    try {
        hash.isValidAddress(address)
        val = true;
    } catch (e) {//not valid base58 is catched
        try {
            if (address.length == 40) {//hash of pubkey
                addr = hash.generateAddresFromAddrHash(addr)
                val = true;
            } else {
                addr = hash.generateAddres(address);//its hash
                val = true;
            }
        } catch (e) {

        }
    }


    return res({isvalid: val, address: address});
}