var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var bchain = require('../../../blockchain/index')
var diff = require('../../../blockchain/block/difficulty')
var config = require('../../../config')
var Script = require('../../../blockchain/script/script');

module.exports = function (params) {
    var height = params[0];

    if (!height) {
        height = indexes.get('top').height;
    }

    var blockchain = new bchain();
    var list = [];

    var hash = indexes.get("index/" + height);
    var block = blockchain.getBlock(hash);
    if (block) {
        block.diff = diff.difficulty(block.bits);
        block.reward = diff.getBlockValue(0, block.height) / config.blockchain.satoshicoin;
        block.next_block = indexes.get("index/" + (block.height + 1));
        for (var k in block.tx) {
            block.tx[k].block = block.hash;
            if (!block.tx[k].coinbase)
                for (var m in block.tx[k].in) {
                    var a = Script.sigToArray(block.tx[k].in[m].scriptSig);
                    block.tx[k].in[m].writer = a[1];
                    block.tx[k].in[m].sign = a[0];
                }
        }

        if (block)
            list.push(block);
    }

    return res(list);
}