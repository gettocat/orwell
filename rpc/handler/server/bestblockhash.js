var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var genesis = require('../../../blockchain/block/genesis')

module.exports = function (params) {
    var info = indexes.get('top');
    if (!info.hash)
        info = {hash: genesis().hash, height: 0};
    return res(info);
}