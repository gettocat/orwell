var error = require('../../serror')
var res = require('../../res');
var txindexes = require('../../../db/entity/tx/pool');
var diff = require('../../../blockchain/block/difficulty')
var indexes = require('../../../db/entity/block/indexes')
var pool = require('../../../db/entity/block/pool')

module.exports = function (params) {

    var p = new pool();

    return res({
        mempool: txindexes.getCount(),
        blocks: p.blockCount(),
        height: indexes.get('top').height,
        last_hash: indexes.get('top').hash,
        difficulty: "0x" + Number(diff.bits()).toString(16),
    });

}