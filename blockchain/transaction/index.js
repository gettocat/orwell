/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var pool = require('../db/entity/tx/pool')
var chainEvents = require('../events/chain')
var txindex = require('../db/entity/tx/indexes')
var Transaction = require('../blockchain/transaction/transaction')
var config = require('../config')

var mempool = function () {
    this.db = new pool()
}

mempool.prototype = {
    db: null,
    getTx: function (hash) {
        var t = new Transaction();
        t.fromJSON(this.db.getTx(hash))
        return t;
    },
    appendTx: function (tx, cb) {
        if (!tx instanceof Transaction)
            throw new Error('Tx object must be instanceof Transaction class to appending in Memory pool');

        if (tx.isValid()) {
            this.db.save(tx.toJSON());
            if (cb instanceof Function)
                cb(tx);
        }

    },
    appendTxFromJSON: function (json, cb) {
        var b = new Transaction();
        b.fromJSON(json);
        return this.appendTx(b, cb);
    },
    removeTx: function (hash) {
        this.db.remove(hash)
    }

}

module.exports = mempool