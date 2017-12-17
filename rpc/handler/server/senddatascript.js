var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')
var dscript = require('orwelldb').datascript;

module.exports = function (params) {

    var addressfrom = params[0], addressto = params[1], datascriptHEX = params[2];
    
    if (!hash.isValidAddress(addressfrom))
        return error(error.INVALID_PARAMS, 'addressfrom is not valid');

    if (!hash.isValidAddress(addressto))
        return error(error.INVALID_PARAMS, 'addressto is not valid');

    var acc = wallet.findAccountByAddr(addressfrom);
    if (!acc)
        return error(error.INVALID_PARAMS, 'addressfrom is not exist in yout wallet');
   
    var sc = [];
    var arr = dscript.readArray(datascriptHEX);
    for (var i in arr) {
        var d = new dscript(arr[i]);
        sc.push(d.toJSON());
    }

    var res = true;
    for (var i in sc) {
        if (!sc[i].success) {
            res = false;
        }

        if (!sc[i].dataset) {
            res = false;
        }

        if (!sc[i].operation && !sc[i].operator) {
            res = false;
        }
    }

    if (!res)
        return error(error.INVALID_PARAMS, 'datascript is not valid');

    var result = wallet.sendFromAddress(addressfrom, addressto, 0, datascriptHEX);
    
    if (result.status) {
        return result_callback(result.hash);
    } else
        return error(error.INVALID_RESULT, result);

}