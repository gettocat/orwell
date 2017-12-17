/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var kventity = require('../index');
var util = require('util');
var config = require('../../../config');
var chainEvents = require('../../../events/chain')

var obj = null;
var utxo = function () {
    this.name = 'utxo';
    this.options = {};
    this.options.inmemory = false;
    this.init();
}

util.inherits(utxo, kventity);

utxo.prototype.getList = function () {
    var arr = this.get('utxolist');
    if (!arr || !(arr instanceof Array))
        arr = [];
    return arr;
}

utxo.prototype.setList = function (arr) {
    this.set('utxolist', arr || []);
    return arr || [];
}
utxo.prototype.getCount = function () {
    return this.getList().length;
}
utxo.prototype.addTx = function (tx, cb) {
    console.log("UTXO tx: " + tx.hash)

    var outs = tx.out;
    for (var o in outs) {
        var out = outs[o];
        this.addOutIndex(tx.hash, o, out.addr, out.amount);
    }


    var bchain = require('../../../blockchain/index');
    var blockchain = new bchain();

    for (var inp in tx.in) {
        var inpt = tx.in[inp];

        if (inpt.hash == '0000000000000000000000000000000000000000000000000000000000000000')//coinbase
            continue;

        var prevout;
        try {
            prevout = blockchain.getOut(inpt.hash, inpt.index);
            this.removeOutIndex(tx.hash, prevout.addr, inpt.hash, inpt.index);
        } catch (e) {
            //search in mempool
        }
    }

    if (cb instanceof Function)
        cb(tx);

}

utxo.prototype.addOutIndex = function (tx, index, addr, amount) {
    if (config.debug.blockchain.indexing)
        console.log("add UTXO index " + addr, tx + ":" + index, amount)

    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    var finded = 0;
    for (var i in addrind) {
        if (addrind[i].tx == tx && addrind[i].index == index) {
            finded = 1;
            break;
        }
    }

    if (!finded) {
        var obj = {
            tx: tx,
            index: index,
            amount: amount,
            spent: false
        };

        var o = obj;
        o.address = addr;
        chainEvents.emit("chain.utxo.unspent", o)
        addrind.push(obj);

        var list = this.getList();
        list.push(tx + ":" + index);
        this.setList(list);

        this.set("address/" + addr, addrind)
    }

    return addrind
}

utxo.prototype.removeOutIndex = function (txhash, addr, tx, index) {
    if (config.debug.blockchain.indexing)
        console.log("update spent UTXO index " + txhash + " " + addr, tx + ":" + index)

    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    for (var i in addrind) {
        if (addrind[i].tx == tx && addrind[i].index == index) {
            var o = addrind[i];
            o.address = addr;
            o.spent = true;
            o.spentHash = txhash;
            chainEvents.emit("chain.utxo.spent", o)
            //addrind[i].splice(i, 1);
            addrind[i] = o;
            var list = this.getList();
            list.splice(list.indexOf(tx + ":" + index), 1);
            this.setList(list);

            break;
        }
    }

    this.set("address/" + addr, addrind)
    return addrind

}

utxo.prototype.have = function (addr, hash, index, txid) {
    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    for (var i in addrind) {
        if (addrind[i].tx == hash && addrind[i].index == index) {
            var o = addrind[i];
            if (!o.spent || o.spentHash == txid)
                return true;
        }
    }

    return false;
}

utxo.prototype.getAmount = function (addr, hash, index) {
    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];

    for (var i in addrind) {
        if (addrind[i].tx == hash && addrind[i].index == index) {
            var o = addrind[i];
            return o.amount
        }
    }

    return false;
}

utxo.prototype.getUTXOList = function (addr, limit, offset) {
    var addrind = this.get("address/" + addr);
    if (!addrind || !(addrind instanceof Array))
        addrind = [];
    var spent = 0, unspent = 0, spent_in = 0, unspent_in = 0;

    for (var i in addrind) {
        if (addrind[i].spent && addrind[i].spentHash) {
            spent += addrind[i].amount;
            spent_in++;
        } else {
            unspent += addrind[i].amount;
            unspent_in++;
        }
    }

    var items = addrind.slice(offset, offset + limit);
    return {
        stats: {
            spent_inputs: spent_in,
            spent_amount: spent,
            unspent_inputs: unspent_in,
            unspent_amount: unspent
        },
        limit: limit,
        offset: offset,
        count: addrind.length,
        items: items.length,
        list: items
    }
}

utxo.prototype.startValidate = function (hash) {
    //create dump of all used unspent inputs in block while validate, when validate is stop - do utxo.stopValidate(hash), and check count of usage (must be 1 for all), if not = double spending
    this.set("block/" + hash, {});
    this.validateblock = hash;
}

utxo.prototype.inBlockValidateStage = function() {
    return this.validateblock
}

utxo.prototype.addUsage = function (txhash, unspentinputhash, unspentinputindex) {
    var dump = this.get("block/"+this.validateblock);
    if (!dump)
        dump = {};
    
    var arr = dump[unspentinputhash+":"+unspentinputindex];
    if (!arr || !(arr instanceof Array))
        arr = [];
    
    arr.push(txhash);
    dump[unspentinputhash+":"+unspentinputindex] = arr;
    this.set("block/"+this.validateblock, dump);
    
}

utxo.prototype.stopValidate = function(hash){
    
    var dump = this.get("block/"+hash);
    this.validateblock = null;
    this.remove("block/"+hash);
    return dump;
    
    
}

module.exports = obj ? obj : obj = new utxo;