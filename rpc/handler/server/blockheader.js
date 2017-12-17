var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var Block = require('../../../blockchain/block/block');


module.exports = function (params) {
    var hashes = params;

    if (!hashes.length) {
        return error(error.INVALID_PARAMS, "need one or more hashes")
    } else {
        var list = [];
        for (var i in hashes) {

            var block = indexes.get(hashes[i]);
            if (block) {
                var b = new Block().fromJSON(block);
                list.push(b.getBlockHeader());
            }
        }

        return res(list);
    }
}