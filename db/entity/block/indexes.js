/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var kventity = require('../index');
var config = require('../../../config');
var util = require('util');
var obj = null;
var blockindexes = function () {
    this.name = 'blockindexes';
    this.options = {inmemory: config.blockchain.persistenindex};
    this.init();
}

util.inherits(blockindexes, kventity);

blockindexes.prototype.updateTop = function (data) {
    this.set('top', data);
    var t = this.get('top');
    if (config.debug.blockchain.sync)
        console.log("new top: " + t.hash + ", height: " + t.height);
};

blockindexes.prototype.getAllDSAddresses = function () {
    var keys = [];
    var result = this.find({'key': {'$contains': 'ds/address/'}})
    for (var i in result)
        if (result[i]) {
            if (!result[i].value && !(result[i].value instanceof Array))
                result[i].value = [];
            keys.push({name: result[i].key.replace("ds/address/", ""), records: result[i].value.length});
        }

    return keys;
}

blockindexes.prototype.haveblock = function (hash) {
    var bchain = require('../../../blockchain/index');
    var blockchain = new bchain();
    try {
        var block = blockchain.getBlock(hash);

        if (block.hash)
            return true;
    } catch (e) {
    }

    var orphan = require('./orphan');
    if (orphan.have(hash)) {

        return true;
    }

    var mem = require('./memory');
    return !!(mem.get(hash) && mem.get(hash).hash);
}

module.exports = obj ? obj : obj = new blockindexes;
