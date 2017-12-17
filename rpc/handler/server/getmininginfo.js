var res = require('../../res');
var diff = require('../../../blockchain/block/difficulty');
var config = require('../../../config')
var txindexes = require('../../../db/entity/tx/pool')

module.exports = function (params) {
    var bchain = require('../../../blockchain/index')
    var blockchain = new bchain();

    return res({
        "blocks": blockchain.getCount(),
        "currentblocksize": txindexes.getSize(),
        "currentblocktx": txindexes.getCount(),
        "difficulty": diff.difficulty(diff.bits()),
        "genproclimit": 1,
        "networkhashps":  diff.hashrate.currHashRate(),
        "pooledtx": txindexes.getCount(),
        "testnet": config.net == 'testnet',
        "chain": "main",
        "generate": false
    });
}
