var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var hash = require('../../../crypto/hash');

module.exports = function (params) {
    var address = params[0];

    if (!address)
        return error(error.INVALID_PARAMS, 'need address');

    if (!hash.isValidAddress(address))
        return error(error.INVALID_PARAMS, 'not valid address' + address);

    var indx = indexes.get("address/" + address), tx = [];

    for (var i in indx) {

        if (indx[i].type == 'input') {
            tx.push({type: 'input', tx: indx[i].tx});
        }

        if (indx[i].type == 'output') {
            tx.push({type: 'output', tx: indx[i].tx});
        }

    }


    return res({address: address, tx: tx});
}