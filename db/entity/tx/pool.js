/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var kventity = require('../memory');
var Transaction = require('../../../blockchain/transaction/transaction_new');
var Script = require('../../../blockchain/script/script');
var txVal = require('../../../blockchain/transaction/validator');
var util = require('util');
var config = require('../../../config');
var chainEvents = require('../../../events/chain')
var hash = require('../../../crypto/hash')

var obj = null;
var txindexes = function () {
    this.name = 'txindexes';
    this.options = {};
    this.options.inmemory = true;
    this.init();
}

util.inherits(txindexes, kventity);

txindexes.prototype.list = [];
txindexes.prototype.getList = function () {
    return this.get('txlist') || [];
}
txindexes.prototype.getOrderedList = function () {

    var txlist = [];
    var hashes = this.getList();
    if (!hashes || !(hashes instanceof Array))
        hashes = [];
    for (var i in hashes) {
        var tx = this.get(hashes[i]);
        txlist.push(tx);
    }

    txlist.sort(function (a, b) {
        return b.fee - a.fee
    });

    var maxsize = config.blockchain.block_size, size = 0, list = [];
    for (var i in txlist) {
        size += txlist[i].size;
        if (size > maxsize)
            break;

        list.push(txlist[i]);
    }

    return list;

}
txindexes.prototype.setList = function (arr) {
    this.set('txlist', arr || []);
    return arr || [];
}
txindexes.prototype.getCount = function () {
    return this.getList().length;
}
txindexes.prototype.getSize = function () {
    var arr = this.getList();
    var f = 0;
    for (var i in arr) {
        f += arr[i].size;
    }
    return f
}
txindexes.prototype.addTx = function (tx, cb, fromNet) {
    var list = this.getList();
    if (!list || !(list instanceof Array))
        list = [];

    for (var i in tx.in) {
        var prevAddress = (function (tx_in) {
            var bchain = require('../../../blockchain/index');
            var blockchain = new bchain();
            var out = blockchain.getOut(tx_in.hash, tx_in.index);
            return Script.scriptToAddr(out.scriptPubKey);
        })(tx.in[i])

        tx.in[i].prevAddress = prevAddress;

    }

    var t = new Transaction();
    t.fromJSON(tx);
    hash = t.getHash();
    t.toHex();

    if (t.coinbase) {
        cb(null);
        return false;
    }

    var valid = new txVal(t);
    if (this.get(hash).hash) {
        tx.errors = ['alreadyexist'];
        cb(tx, t, false)
        return;
    }

    if (valid.isValidTx()) {
        var testunspent = 0;
        for (var inp in t.inputs) {
            var test = this.get("out/" + t.inputs[inp].hash + ":" + t.inputs[inp].index);
            if (test && typeof test == 'string') {
                testunspent++;
                console.log("unspent tx error:", "already have used utxo in mempool: ", t.inputs[inp].hash + ":" + t.inputs[inp].index + ", for tx " + test);
            }
        }

        if (testunspent > 0) {
            tx.errors = ['doublespent'];
            cb(tx, t, false)
            return;
        }

        if (tx.datascript) {
            this.addDSIndex(tx.hash, tx.out[0])
        }

        for (var o in t.outputs) {
            var out = t.outputs[o];
            this.addOutIndex('input', tx.hash, Script.scriptToAddr(out.scriptPubKey), out.amount);
        }


        var bchain = require('../../../blockchain/index');
        var blockchain = new bchain();

        for (var inp in t.inputs) {
            var inpt = t.inputs[inp];
            var prevout;
            try {
                this.set("out/" + inpt.hash + ":" + inpt.index, tx.hash);
                prevout = blockchain.getOut(inpt.hash, inpt.index);
                this.addOutIndex('output', tx.hash, Script.scriptToAddr(prevout.scriptPubKey), prevout.amount, fromNet);
            } catch (e) {
                //search in mempool
                console.log("input error: ", inpt.hash + ":" + inpt.index, inpt)
                console.log(e)
                cb(tx, t, false)
                return;
            }
        }

        //create TX object from json, check tx validate, add
        list.push(hash);
        this.setList(list);
        this.set(hash, t.toJSON());
        this.set("time/" + hash, new Date().getTime() / 1000);
        cb(tx, t, true);
    } else {
        tx.errors = valid.getErrors();
        cb(tx, t, false)
    }
}

txindexes.prototype.addOutIndex = function (type, tx, addr, amount, events) {
    if (config.debug.blockchain.indexing)
        console.log("add unconfirmed index " + addr, tx, amount)

    var addreses = this.get("addresstx/" + tx);

    if (!addreses || !(addreses instanceof Array))
        addreses = [];

    addreses.push(addr);
    this.set("addresstx/" + tx, addreses);

    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    var obj = {
        type: type, //input||output
        tx: tx,
        amount: amount
    };
    addrind.push(obj);

    if (events) {
        obj.address = addr;
        chainEvents.emit("chain.event.unconfirmed.address", obj)
    }

    this.set("address/" + addr, addrind)
    return addrind
}

txindexes.prototype.removeTx = function (txHash) {
    //remove tx from pool
    //remove address index

    var list = this.getList();
    if (!list || !(list instanceof Array))
        list = [];
    list.splice(list.indexOf(txHash), 1);
    this.setList(list);

    //remove address index
    var addreses = this.get("addresstx/" + txHash);
    if (!addreses || !(addreses instanceof Array))
        addreses = [];

    for (var i in addreses) {

        this.remove("address/" + addreses[i]);

    }

    this.remove("addresstx/" + txHash)
    this.remove(txHash);

}

txindexes.prototype.have = function (txHash) {
    var list = this.getList();
    if (!list || !(list instanceof Array))
        list = [];

    return list.indexOf(txHash) >= 0;
}

txindexes.prototype.getOldest = function () {
    var result = this.find({'key': {'$contains': 'time/'}}, ["value", false]);
    if (result.length)
        return result[0].value;
    return 0;
}

txindexes.prototype.addDSIndex = function (txid, out) {
    out.address = Script.scriptToAddr(out.scriptPubKey);
    out.addrHash = Script.scriptToAddrHash(out.scriptPubKey).toString('hex');

    if (config.debug.blockchain.indexing)
        console.log("add unconfirmed ds index " + out.addrHash, txid)
    var addrind = this.get("ds/address/" + out.addrHash);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    addrind.push(txid);


    this.set("ds/address/" + out.addrHash, addrind)
    return addrind
}

module.exports = obj ? obj : obj = new txindexes;