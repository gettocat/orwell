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

    return res({address: address, pool: indexes.get("address/" + address)});
}