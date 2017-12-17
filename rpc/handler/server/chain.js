var error = require('../../serror')
var res = require('../../res');
var bchain = require('../../../blockchain/index');
var config = require('../../../config')
var diff = require('../../../blockchain/block/difficulty')

module.exports = function (params) {
    var limit = params[0] || 30, offset = params[1] || 0, list = [];

    var blockchain = new bchain();
    var arr = blockchain.findLastBlocks(limit, offset);

    for (var i in arr) {

        var block = arr[i];
        block.output = 0;
        block.size = 0;
        block.fee = 0;
        block.diff = diff.difficulty(block.bits);
        for (var i in block.tx) {
            block.size += block.tx[i].size;
            block.fee += block.tx[i].fee / config.blockchain.satoshicoin;
            for (var k in block.tx[i].out) {
                block.output += block.tx[i].out[k].amount / config.blockchain.satoshicoin;
            }
        }

        delete block.$loki;
        delete block.meta;
        delete block.tx//too many bytes
        list.push(block);
    }
    
    var count = blockchain.getCount();
    return res({list: list, offset: offset, limit: limit, items: list.length, count: count});
}