/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var entity = require('../entity');
var transaction = require('../../blockchain/transaction/transaction')
var config = require('./../../config');
var ent = null;

var orphan = function () {
    if (!ent)
        ent = new entity('blockchain/tx/orphan');
}

orphan.prototype = {
    save: function (tx) {

        if (!t.isValidTransaction || !tx instanceof transaction)
            throw new Error('cant add invalid transaction to orpan/pool');

        var t = tx.toJSON();
        t.hash = tx.getHash();
        t.fee = tx.getFee();
        ent.save(t);
        return true;

    },
    get: function (hash) {
        var obj = ent.get(hash);
        if (obj) {
            var tx = new transaction();
            tx.fromJSON(obj);
            return tx;
        } else {
            return {};
        }

    },
    remove: function (hash) {
        ent.remove(hash);
        return true;
    },
    load: function (limit, offset) {
        if (!limit)
            limit = config.limits['maxtxfrompool']

        if (!offset)
            offset = 0;

        var arr = ent.getCollection().chain().find().simplesort('fee', true).limit(limit).offset(offset).data();
        var pool = [];
        for (var i in arr) {
            var tx = new transaction();
            tx.fromJSON(arr[i]);
            pool.push(tx)
        }

        return pool;

    }


}

module.exports = orphan;