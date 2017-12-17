/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var txParser = require('./parser_new');
var config = require('../../config');
var util = require('../../tools/util');
var hash = require('../../crypto/hash')
var script = require('../script/script')
var txtool = require('./tools')
var txBuilder = require('./builder_new')
var dscript = require('orwelldb').datascript
var dscript_validator = require('../validators/datascript')

var validate = function (tx) {
    this.hex = tx.toHex();
    this.data = tx.toJSON();
    this.result = this.run();
}

validate.isValid = function (tx) {
    var val = new validate(tx);
    return val.isValidTx();
};

validate.prototype = {
    raw: null,
    tx: null,
    prevtx: null,
    result: false,
    debug: [],
    run: function () {

        this.debug = [];
        this.errors = [];

        if (!this.data)
            return false;
        /*
         The transaction’s syntax and data structure must be correct.
         Neither lists of inputs or outputs are empty.
         The transaction size in bytes is less than MAX_BLOCK_SIZE.
         Each output value, as well as the total, must be within the allowed range of values (less than 21m coins, more than 0).
         nLockTime is less than or equal to INT_MAX.
         The transaction size in bytes is greater than or equal to 100.
         */
        var f1 = this.checkStructure();
        /*
         !!! Using the referenced output transactions to get input values, check that each input value, as well as the sum, are in the allowed range of values (less than 21m coins, more than 0).
         Reject if the sum of input values is less than sum of output values.
         */
        var f2 = this.checkOuts();
        /*
         The unlocking scripts (scriptSig) for each input must validate against the corresponding output locking scripts (scriptPubKey).
         None of the inputs have hash=0, N=–1 (coinbase transactions should not be relayed). 
         [The unlocking script (scriptSig) can only push numbers on the stack, |checked on testsign], and the locking script (scriptPubkey) must match isStandard forms (this rejects "nonstandard" transactions).
         
         **/
        var f3 = this.checkIns();
        /**
         For each input, look in the main branch and the transaction pool to find the referenced output transaction. 
         If the output transaction is missing for any input, this will be an orphan transaction. Add to the orphan transactions pool, if a matching transaction is not already in the pool.
         For each input, if the referenced output exists in any other transaction in the pool, the transaction must be rejected.
         A matching transaction in the pool, or in a block in the main branch, must exist.
         For each input, if the referenced output transaction is a coinbase output, it must have at least COINBASE_MATURITY (100) confirmations.
         For each input, the referenced output must exist and cannot already be spent.
         */
        var f4 = this.checkdb();
        var f5 = this.dataScript();

        this.result = f1 && f2 && f3 && f4 && f5;
        if (config.debug['blockchain'].txvalidate)
            console.log('tx.verify', this.data.hash, this.result, this.debug);

        return this.result;

    },
    checkStructure: function () {
        var items = this.data;
        var arr = {
            'version == config.blockchain.txversion': items.version >= config.blockchain.txversion,
            'inputcnt > 0': items.in.length > 0,
            'outputscnt > 0': items.out.length > 0,
            'checkinputs': function (validator) {

                var res = true;
                if (!items['coinbase'])
                    for (var i in items['in']) {
                        var sc = script.sigToArray(items['in'][i].scriptSig);
                        if (!sc[0] || !sc[1]) {
                            res = false;
                            validator.debug.push("in[" + i + "] signature does not exist: false");
                            validator.errors.push("unsigned")
                        }

                        if (!sc[1]) {
                            res = false;
                            validator.debug.push("in[" + i + "] pubkey does not exist: false");
                            validator.errors.push("haventpubkey")
                        }
                    }

                return res;

            }
        }
        return this._execute(arr);

    },
    checkOuts: function () {
        var items = this.data;
        var l = new Buffer(this.hex, 'hex').length;

        var arr = {
            'tx.size > 70 && tx.size < block_size': l > 70 && l < config.blockchain.block_size,
            'outputs': function (validator) {
                var l = items.out;
                var le = true;
                for (var i in l) {
                    if ((l[i].amount > 0 || (l[i].amount == 0 && items.datascript)) && l[i].amount / config.blockchain.satoshicoin <= config.blockchain.max_coins) {
                        validator.debug.push("out[" + i + "] amount " + l[i].amount + " > 0 && < config.blockchain.max_coins: true");
                    } else {
                        le = false;
                        validator.debug.push("out[" + i + "] amount " + l[i].amount + " > 0 && < config.blockchain.max_coins: false");
                        validator.errors.push("badamount")
                    }
                }

                return le;
            }
        }

        var res = this._execute(arr);
        return res;
    },
    checkIns: function () {
        var items = this.data;
        var txhex = this.hex;

        var in_tx = [], in_index = [], in_body = [], in_parser = [];
        if (!items['coinbase'])
            for (var i in items['in']) {
                var prevtxid = items['in'][i].hash
                in_tx.push(prevtxid);

                //console.log("prev tx-> " + prevtxid);
                in_index.push(items['in'][i].index);
            }

        if (!items['coinbase'])
            for (var i in in_tx) {
                var b = this.getPreviousTxBody(in_tx[i]);
                if (!b)
                    throw new Error('cant find in db body of transaction ' + in_tx[i]);
                in_body.push(b);
            }

        var arr = {
            'in.amount>=out.amount': function (validator) {
                var l = items.out;
                var outamount = 0;
                for (var k in l) {
                    var res = l[k].amount;
                    outamount += res;
                }

                var inamount = 0;
                for (var k in in_tx) {

                    var p = in_body[k].out[in_index[k]];
                    if (p) {
                        inamount += p.amount;
                    }
                }
                var res = inamount >= outamount || items['coinbase'];
                if (!res)
                    validator.errors.push("inamountrange")
                return res;
            },
            'signed': function (validator) {

                if (items.coinbase)
                    return true;

                var addresses = [];
                for (var k in in_tx) {
                    addresses.push(script.scriptToAddr(new Buffer(in_body[k].out[in_index[k]].scriptPubKey, 'hex')))
                }

                var Tx = require('./transaction_new')
                var tx = new Tx();
                tx.setInputs(items.in);
                tx.setOutputs(items.out);
                tx.setVersion(items.version)
                tx.setLockTime(items.lock_time);
                if (items.datascript)
                    tx.setDataScript(items.datascript);
                tx.build(addresses);

                var res = (tx.toHex() == txhex);
                if (!res)
                    validator.errors.push("hexinvalid")
                return res;
            }
        }

        var res = this._execute(arr), resall = [];
        resall.push(res);


        for (var i in in_tx) {
            var prevout = in_body[i].out[in_index[i]];
            var arr = {
                'prevtxexist': function (validator) {

                    var res = !!in_body[i]
                    if (!res)
                        validator.errors.push("prevtxisnotexist")
                    return res;
                }, //or is null
                'outexist': function (validator) {
                    var res = !!prevout
                    if (!res)
                        validator.errors.push("prevoutnotexist");
                    return res;
                },
                'scriptPubKeyIsStandardForm': function (validator) {
                    //only Pay To Public Key Hash (P2PKH), Pay To Script Hash (P2SH) or Multisig
                    //now implementet only P2PKH, in future: Multisig too
                    var res = script.isP2PKH(new Buffer(prevout.scriptPubKey, 'hex'));
                    if (!res)
                        validator.errors.push("script_isnotstandart");
                    return res;
                },
                isSpendable: function (validator) {
                    var addrhash = script.scriptToAddrHash(prevout.scriptPubKey).toString('hex');
                    var sig = items['in'][i].scriptSig;
                    var a = script.sigToArray(sig);
                    var k = hash.generateAddres(a[1]);
                    var addrhashmy = script.scriptToAddrHash(script.addrToScript(k)).toString('hex');
                    var res = addrhashmy == addrhash
                    if (!res)
                        validator.errors.push("notspendable");
                    return res;
                },
            }

            res = this._execute(arr);
            resall.push(res);
            res = false;
        }

        res = true;
        for (var i in resall) {
            if (!resall[i])
                res = false;
        }

        return res;

    },
    dataScript: function () {
        var items = this.data;
        var hex = this.hex;

        if (items['coinbase'] && !items.datascript)
            return true;
        else if (items['coinbase'] && items.datascript) {
            this.errors.push("datascript_in_coinbase")
            return false;//coinbase cant contain datascript!
        }

        var prev_body = [];
        for (var i in items['in']) {
            var b = this.getPreviousTxBody(items['in'][i].hash);
            if (!b)
                throw new Error('cant find in db body of transaction ' + items['in'][i].hash);
            prev_body.push(b);
        }

        var arr = dscript_validator(this.hex, items, prev_body);
        return this._execute(arr)
    },
    checkdb: function () {
        var items = this.data;

        var in_tx = [], in_index = [], in_body = [];
        for (var i in items['in']) {
            in_tx.push(items['in'][i].hash);
            in_index.push(items['in'][i].index);
        }

        for (var i in in_tx) {
            var b = this.getPreviousTxBody(in_tx[i]);
            in_body.push(b);
        }

        var indexes = require('../../db/entity/block/indexes');
        var utxo = require('../../db/entity/tx/utxo');
        var mempool = require('../../db/entity/tx/pool');

        for (var i in in_tx) {
            if (items.coinbase) {

            } else if (in_index[i] == 0 && in_body.coinbase)
                var prevout = {coinbase: true};
            else
                var prevout = in_body[i].out[in_index[i]];


            var arr = {
                'ifcoinbaseprev': function (validator) {
                    if (items.coinbase)
                        return true;
                    //if previous input of prevtx is coinbase - check conformation count 
                    if (prevout.coinbase) {//iscoinbase
                        return (function (tx) {
                            //TODO: db/here im need go to db and check, that conformation more than config.blockchain.coinbase_maturity
                            //get block
                            var txindex = indexes.get("tx/" + tx.hash);
                            //get block height
                            var blockindex = indexes.get("block/" + txindex.block);
                            //get top
                            var top = indexes.get('top');
                            //compare
                            if (top.height - blockindex.height >= config.blockchain.coinbase_maturity) {
                                return true;
                            } else {
                                validator.errors.push("coinbase_maturity")
                                return false;
                            }
                        })(in_body[i]);
                    }

                    return true;
                },
                'notSpended': function (validator) {
                    //find utxo for each input

                    if (items.coinbase)
                        return true;
                    var res = [];
                    for (var i in items.in) {

                        if (utxo.inBlockValidateStage())
                            utxo.addUsage(items.hash, items.in[i].hash, items.in[i].index);

                        var s = script.sigToArray(items.in[i].scriptSig);
                        var addr = hash.generateAddres(s[1]);
                        if (utxo.have(addr, items.in[i].hash, items.in[i].index, items.hash)) {
                            res.push(1);
                        } else {
                            res.push(0);
                            validator.debug.push("tx input[" + i + "] have utxo for addr " + addr + ", " + items.in[i].index + ":" + items.in[i].hash + ": false");
                            validator.errors.push("badutxo")
                        }


                    }

                    var sum = 0;
                    for (var i in res) {
                        sum += res[i]
                    }
                    //check have hash == 'thistxhash' or spent = false
                    return res.length == sum;
                },
                'isNotOrphan': function (validator) {
                    if (items.coinbase)
                        return true;
                    //if in mempool have one of the input - its false

                    var res = [];
                    for (var i in items.in) {
                        if (mempool.have(items.in[i].hash)) {
                            res.push(0);
                            validator.debug.push("tx input[" + i + "] now in mempool " + items.in[i].index + ":" + items.in[i].hash + ". Input can be used right now: false");
                            validator.errors.push("utxoinmempool")
                        } else {
                            res.push(1);
                        }
                    }


                    var sum = 0;
                    for (var i in res) {
                        sum += res[i]
                    }

                    return res.length == sum;
                },
            }
        }


        var res = this._execute(arr);
        return res;
    },
    _execute: function (rules) {
        var it = true;
        for (var i in rules) {
            var res = (rules[i] instanceof Function ? rules[i](this) : rules[i]);
            this.debug.push(i + ": " + !!res);

            if (i == 'version == config.blockchain.txversion' && !res) {
                this.errors.push("badversion");
            }

            if (i == 'inputcnt > 0' && !res) {
                this.errors.push("emptyinputs");
            }

            if (i == 'outputscnt > 0' && !res) {
                this.errors.push("emptyoutputs");
            }

            if (i == 'tx.size > 70 && tx.size < block_size' && !res) {
                this.errors.push("badsize");
            }

            if (i == 'tx.size > 70 && tx.size < block_size' && !res) {
                this.errors.push("badsize");
            }

            if (i == 'ds_countisvalid' && !res) {
                this.errors.push("ds/malformed");
            }

            if (i == 'dbisexist' && !res) {
                this.errors.push("ds/dbisnotexist");
            }

            if (i == 'settingsCanChangeOnlyOwner' && !res) {
                this.errors.push("ds/changesettingstryisnotowner");
            }
            
            if (i == 'settingsCanChangeOnlyOwner' && !res) {
                this.errors.push("ds/changesettingstryisnotowner");
            }
            
            if (i == 'createOnlyOnce' && !res) {
                this.errors.push("ds/dbalreadycreated");
            }
            
            if (i == 'canWrite' && !res) {
                this.errors.push("ds/cannotwritetodb");
            }
            
            if (i == 'canEdit' && !res) {
                this.errors.push("ds/cannoteditentry");
            }
            
            if (i == 'fee' && !res) {
                this.errors.push("invalidfee");
            }
            
            if (i == 'fee' && !res) {
                this.errors.push("ds/invalidfee");
            }

            if (!res)
                it = false;
        }

        return it;
    },
    isValidTx: function () {
        return this.result;
    },
    getDebug: function () {
        return this.debug;
    },
    getPreviousTxBody: function (txid) {
        if (txid == "0000000000000000000000000000000000000000000000000000000000000000")
            return "";

        var bchain = require('../../blockchain/index')
        var txindexes = require('../../db/entity/tx/pool')
        var blockchain = new bchain();
        try {
            var tx = blockchain.getTx(txid);
        } catch (e) {
            //no have in blockchain, tye seach in memory pool
            var tx = txindexes.get(txid);
        }

        if (tx && tx.in) {
            var t = txtool.createFromJSON(tx);
            return t.toJSON();

        } else
            throw Error('cant find previous tx body ' + txid);

    },
    getErrors: function () {
        return this.errors;
    },
}

module.exports = validate;