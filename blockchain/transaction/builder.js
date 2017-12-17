/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var hash = require('../../crypto/hash')
var crypto = require('../../crypto/index')
var util = require('../../tools/util')
var script = require('../script/script')
var txParser = require('./parser')

module.exports = builder;
function builder(transaction) {
    if (transaction)
        this.tx = transaction;
}

builder.prototype = {
    tx: null,
    signatures: [],
    signature: [],
    gensigned: 0,
    isCoinbase: false,
    coinBaseData: null,
    coinBaseAddr: null,
    coinBaseAmount: 0,
    result: "",
    setInputs: function (arr) {// [ [prevtx, index, address] ]
        this.inputs = arr;
        return this;
    },
    setCoinbase: function (data, addr, amount) {
        this.isCoinbase = 1;
        this.coinBaseData = data;
        this.coinBaseAddr = addr;
        this.coinBaseAmount = amount;
        return this;
    },
    setOutputs: function (outputs) {//[ [address, satoshi, israwscript] ]
        this.outputs = outputs;
        return this;
    },
    generate: function () {
        if (this.isCoinbase)
            return this.generateCoinBaseTx();

        if (this.tx) {

        } else {

            var ver = new Buffer("01000000", 'hex'),
                    n = new Buffer(util.numHex(this.inputs.length), 'hex');

            var index = util.littleEndian(this.index).toString('hex'),
                    seq = "ffffffff",
                    nouts = util.numHex(this.outputs.length), outlist = "", o, inlist = "";

            for (var i in this.inputs) {
                var index = this.inputs[i][1], tx = this.inputs[i][0], addr = this.inputs[i][2], sgs;
                if (this.signatures[i] == -1)
                    sgs = "";
                else if (this.signatures[i] === 1)
                    sgs = script.addrToScript(addr);
                else
                    sgs = this.signatures[i];

                var sgslen = util.numHex(sgs ? new Buffer(sgs, 'hex').length : 0)
                inlist += util.reverseBuffer(new Buffer(tx, 'hex')).toString('hex') + util.littleEndian(index).toString('hex') + sgslen + sgs + seq;
            }

            for (o in this.outputs) {

                var s = this.outputs[o],
                        addr = s[1], amount = s[0], frm = s[2],
                        sigo = (frm === 1 ? addr : script.addrToScript(addr)),
                        en = util.littleEndian(amount, 1).toString('hex');
                outlist += en + "" + util.numHex(new Buffer(sigo, 'hex').length) + "" + sigo;
            }


            var lock = new Buffer("00000000", 'hex'),
                    res =
                    ver.toString('hex') + n.toString('hex') + inlist + "" + nouts
                    + outlist + lock.toString('hex');

            this[this.gensigned ? 'signed' : 'rawunsigned'] = res;
        }
        return this;
    },
    sign: function (priv) {
        this.priv = priv;
        for (var i in this.inputs) {
            this.signatures[i] = -1;
        }

        for (var i in this.inputs) {
            this.signatures[i] = 1;
            this.generate();
            var tx = this.rawunsigned + "01000000";
            //console.log(tx)
            txb = new Buffer(tx, 'hex'),
                    sig256 = hash.sha256(hash.sha256(txb)),
                    cf = new crypto(priv),
                    sig = cf.ecdsa().sign(sig256, new Buffer(priv, 'hex')),
                    scriptSig = script.scriptSig(new Buffer(sig.toDER()), new Buffer(cf.private.getPublic(null, 'hex'), 'hex'));

            this.signatures[i] = -1;
            this.signature[i] = scriptSig;
        }

        this.signatures = this.signature;
        this.gensigned = 1;

        return this.generate();
    },
    verify: function () {

        var EC = require('elliptic').ec;
        var ec = new EC('secp256k1'), res = []
        for (var i in this.inputs) {
            var pubkey = this.getPublicKey(i);
            var sign = this.getSign(i);

            var key = ec.keyFromPublic(pubkey, 'hex');
            var signable = this.getSignableTransaction(i, this.inputs[i][2]);
            var hash2sign = hash.sha256(hash.sha256(new Buffer(signable, 'hex')));
            res[i] = key.verify(hash2sign, sign, 'hex');
        }

        var result = true;
        for (var i in res) {
            if (!res[i])
                result = false;
        }

        if (!result)
            throw new Error('can not verify signature of transaction');
        return result;

    },
    generateCoinBaseTx: function () {
        if (!this.result) {
            var ver = "01000000", inputcnt = "01",
                    prevtx = "0000000000000000000000000000000000000000000000000000000000000000",
                    prevout = "ffffffff", seq = "ffffffff";
            var databuff, datalen, sc = new Buffer(script.addrToScript(this.coinBaseAddr), 'hex'), sclen = util.numHex(sc.length)
            if (this.coinBaseData) {
                databuff = this.coinBaseData;
                if (!this.coinBaseData instanceof Buffer && !this.coinBaseData instanceof String)
                    throw new Error("only byteorder or string allowed n coinbase data");
                databuff = new Buffer(this.coinBaseData);
                datalen = util.numHex(databuff.length);
            } else {
                datalen = util.numHex(0), databuff = ""
            }

            this.result = (ver + inputcnt + prevtx + prevout + datalen
                    + databuff.toString('hex') + seq + "01"
                    + util.littleEndian(this.coinBaseAmount, 1).toString('hex')
                    + sclen + sc.toString('hex') + "00000000");
        }
        return this.result;
    },
    getId: function () {

        var tx = this.signed;
        var hash2 = hash.sha256(hash.sha256(new Buffer(tx, 'hex')));
        var buf = util.reverseBuffer(hash2).toString('hex');
        return buf;


    },
    getRaw: function () {
        return this.rawunsigned
    },
    getSigned: function () {
        return this.signed
    },
    getCoinBase: function () {
        if (!this.result)
            this.generateCoinBaseTx();
        return this.result;
    },
    getSignableTransaction: function (i, addr) {
        var arr = this.getHumanReadable();
        var p = "";
        for (var k in this.inputs) {
            if (i == k) {
                var sc = script.addrToScript(addr), len = util.numHex(new Buffer(sc, 'hex').length)
                p += arr.inputs[i][0] + arr.inputs[i][1]
                        + len + sc + "ffffffff"
            } else {
                p += arr.inputs[i][0] + arr.inputs[i][1]
                        + util.numHex(0) + "" + "ffffffff"

            }
        }

        var top = arr.version + arr.inputcnt, bottom = arr.outputscnt
                + arr.rawoutput
                + arr.locktime + "01000000";
        return top + p + bottom;
    },
    getSign: function (i) {
        var arr = this.getHumanReadable();
        return arr['input_scripts'][i].seq
                + arr['input_scripts'][i].derlen
                + arr['input_scripts'][i].intX
                + arr['input_scripts'][i].derXlen
                + arr['input_scripts'][i].derX
                + arr['input_scripts'][i].intY
                + arr['input_scripts'][i].derYlen
                + arr['input_scripts'][i].derY
    },
    getPublicKey: function (i) {
        var arr = this.getHumanReadable();
        return arr['input_scripts'][i].pubtype
                + arr['input_scripts'][i].pubkeyX
                + arr['input_scripts'][i].pubkeyY
    },
    getHumanReadable: function () {
        var arr = new txParser(this.signed).run();
        return arr;
    }
}