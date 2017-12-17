/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var entity = require('../entity');
var config = require('../../../config');

var pool = function () {
    this.name = config.net == 'mainnet' ? 'blockchain.dat' : 'blockchain_testnet.dat';
    this.init();
}

util.inherits(pool, entity);

pool.prototype.getLastBlocks = function (limit, offset) {

    if (!limit)
        limit = 1;
    if (!offset)
        offset = 0

    var arr = this.coll.chain().find().simplesort('time', true).offset(offset).limit(limit).data();
    return arr;

}

pool.prototype.findBlocks = function (fields) {
    var arr = this.coll.chain().find(fields).data();
    return arr;

}

pool.prototype.getLastBlock = function () {

    var arr = this.coll.chain().find().simplesort('time', true).limit(1).offset(0).data();
    return arr[0];

}

pool.prototype.loadBlocks = function (cnt, offset) {
    return this.load(cnt, offset, ['time', false]) || false;

}

pool.prototype.blockCount = function () {
    return this.count() || 0;

}

pool.prototype.getBlock = function (hash) {
    var block = this.get(hash);
    if (!block)
        throw new Error('can not find block ' + hash);
    return block
}

pool.prototype.removeBlock = function(block) {
    this.remove(block.hash);
}

module.exports = pool;