/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var txParser = require('./parser');
var txBuilder = require('./builder');
var hash = require('../../crypto/hash');
var util = require('../../tools/util')
var protocol = require('../../network/protocol')

var transaction = function (hex) {
    if (hex)
        this.hex = hex;
}

transaction.prototype = {
    hex: '',
    inputs: [],
    outputs: [],
    coinbase: 0,
    isValidTransaction: 1,
    fromCoinBase: function (data, addr, amount) {
        this.coinbase = 1;
        var tx = new txBuilder();
        tx.setCoinbase(data, addr, amount).generate();
        this.hex = tx.getCoinBase();
        this.fromHex();
        return this;
    },
    setInputs: function (arr) { //array of [tx, indexoutinthistx, addrin]
        this.inputs = arr;
        return this;
    },
    setOutputs: function (arr) {//array of [amountin satoshi, addrout]
        this.outputs = arr;
        return this;
    },
    toJSON: function (simple) {
        if (!(this.parser instanceof txParser))
            this.fromHex();

        if (this.parser instanceof txParser)
            return this.parser.toJSON(simple);
    },
    fromJSON: function (jsonobj) {
        this.parser = new txParser();
        this.parser.fromJSON(jsonobj);
        this.parser.run();
        this.hex = this.parser.raw;
        return this;
    },
    fromHex: function (hex) {
        if (this.parser instanceof txParser)
            return this.parser;

        if (this.hex || hex) {
            if (hex)
                this.hex = hex;
            this.parser = new txParser(this.hex);
            this.parser.run()

            var k = this.parser.toJSON();

            if (!this.inputs)
                this.inputs = k['inputs'];
            if (!this.outputs)
                this.outputs = k['outputs'];

            return this.parser.toJSON();
        } else
            throw new Error('Need hex value to tx');
    },
    setPrivateKey: function (pk) {
        this.private = pk;
        return this;
    },
    setWIF: function (pk) {
        if (this.private)
            throw new Error('already have private key');

        this.private = hash.getPrivateKeyFromWIF(pk).toString('hex');
        return this;
    },
    toHex: function () {

        if (this.hex)
            return this.hex;

        if ((this.inputs.length <= 0 || this.outputs.length <= 0) && !this.coinbase)
            throw new Error('input and out of tx must exist');

        this.builder = new txBuilder();
        this.builder
                .setInputs(this.inputs)
                .setOutputs(this.outputs)
                .sign(this.private)
                .verify()

        return this.hex = this.builder.getSigned()

    },
    getId: function () {
        if (!this.id) {

            if (!this.hex)
                this.toHex();

            this.id = util.reverseBuffer(hash.sha256(hash.sha256(new Buffer(this.hex, 'hex')))).toString('hex');
        }

        return this.id;
    },
    getHash: function () {
        return this.getId();
    },
    getFee: function () {
        return this.parser.getFee();
    },
    getSize: function () {
        return this.parser.getSize();
    },
    getOuts: function () {
        if (!this.outputs) {
            var k = this.parser.toJSON();
            this.outputs = k['outputs'];
        }
        return this.outputs
    },
    getIns: function () {
        if (!this.inputs) {
            var k = this.parser.toJSON();
            this.inputs = k['inputs'];
        }
        return  this.inputs
    },
    send: function () {

        var inv = require('../../blockchain/inventory');
        var inventory = new inv('newtx', this.getHash(), this.toJSON());
        var obj = inventory.getList();
        protocol.sendAll('inv', obj);
        return this.getHash();

    }

}

module.exports = transaction;