var error = require('../../serror')
var result_callback = require('../../res');
var hash = require('../../../crypto/hash')
var wallet = require('../../../wallet/index');
var config = require('../../../config')
var dscript = require('orwelldb').datascript;

module.exports = function (params) {

    var addressfrom = params[0], addressto = params[1], datasetname = params[2], priv = params[3] || "[]", privateWriting = params[4];

    if (!hash.isValidAddress(addressfrom))
        return error(error.INVALID_PARAMS, 'addressfrom is not valid');

    if (!hash.isValidAddress(addressto))
        return error(error.INVALID_PARAMS, 'addressto is not valid');

    if (!datasetname)
        return error(error.INVALID_PARAMS, 'datasetname is not exist');

    var privileges = [];
    try {
        privileges = JSON.parse(priv);
    } catch (e) {
        return error(error.INVALID_PARAMS, 'privileges is not valid json array');
    }

    if (!privileges instanceof Array)
        return error(error.INVALID_PARAMS, 'privileges can be only array');

    var acc = wallet.findAccountByAddr(addressfrom);
    if (!acc)
        return error(error.INVALID_PARAMS, 'addressfrom is not exist in yout wallet');
    
    var e = new dscript({//create message must be unencrypted
        content: {privileges: privileges, writeScript: privateWriting ? '5560' : ''},
        dataset: datasetname,
        operation: 'settings',
    });
    var hex = e.toHEX();
    hex = dscript.writeArray([hex]);
    

    var result = wallet.sendFromAddress(addressfrom, addressto, 0, hex);

    if (result.status) {
        return result_callback(result.hash);
    } else
        return error(error.INVALID_RESULT, result);

}