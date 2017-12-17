/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var bitPony = require('bitpony'), dscript = require('orwelldb').datascript
var Script = require('../script/script');

var parser = function (hex) {
    this.raw = hex;
    this.datascripts = [];
}

parser.prototype.toJSON = function () {

    if (!this.json) {

        if (global.blockchainInited) {
            var bchain = require('../../blockchain/index')
            var blockchain = new bchain();
        }

        var b = new Buffer(this.raw, 'hex');
        var read = new bitPony.reader(b);
        var res = read.tx(0);
        this.json = res.result;
        if (b[res.offset] == 0xee || b[res.offset] == 0xef) {//have datascript
            var arr = dscript.readArray(b.slice(res.offset));
            for (var i in arr) {
                this.datascripts.push(new dscript(arr[i]));
            }
        }

        var inval = 0, outval = 0;

        for (var i in this.json.in) {

            if (this.json.in[i].hash != "0000000000000000000000000000000000000000000000000000000000000000" && global.blockchainInited) {//not a coinbase
                out = blockchain.getOut(this.json.in[i].hash, this.json.in[i].index);
                inval += out.amount || 0;
            }

        }

        if (this.json.in[0].hash == "0000000000000000000000000000000000000000000000000000000000000000" && this.json.in[0].index == 0xffffffff && this.json.in.length == 1) {
            this.coinbase = true;
            this.json.coinbase = true;
        }

        for (var i in this.json.out) {

            outval += this.json.out[i].amount;
            //console.log(this)
            this.json.out[i].addr = Script.scriptToAddr(new Buffer(this.json.out[i].scriptPubKey, 'hex'));

        }

        this.json.hash = this.getHash();
        this.json.fee = 0;
        if (!this.coinbase)
            this.json.fee = this.fee = inval - outval;
        this.json.size = this.size = new Buffer(this.raw, 'hex').length;

        var arr = [];
        if (this.datascripts.length > 0) {
            for (var i in this.datascripts) {
                if (this.datascripts[i] instanceof dscript) {
                    arr.push(this.datascripts[i].toHEX())
                }
            }

            this.json.datascript = dscript.writeArray(arr);
        } else
            this.json.datascript = "";


    }

    return this.json;

}


parser.prototype.getSize = function () {
    if (!this.size)
        this.toJSON();
    return this.size;
}

parser.prototype.getFee = function () {
    if (!this.fee)
        this.toJSON();
    return this.fee;
}

parser.prototype.getHash = function () {
    return bitPony.tool.reverseBuffer(bitPony.tool.sha256(bitPony.tool.sha256(new Buffer(this.raw, 'hex')))).toString('hex');
}


module.exports = parser;