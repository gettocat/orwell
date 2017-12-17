/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var Script = require('../script/script'),
        util = require('../../tools/util'),
        hash = require('../../crypto/hash')
        

var txParser = function (hex) {
    this.raw = hex;

}

txParser.parseOutputs = function (raw) {
    var outputs = [];
    if (raw) {
        var le = false, script = false, tmp = [], tmp2 = [], k = 8;
        for (var i = 0; i < raw.length; i++) {

            if (le === false && script === false) {
                le = true;
            }

            if (script === false && le !== false && k >= 0) {
                if (k != 0) {
                    tmp.push(raw[i]);
                    //console.log('tmp ' + k, new Buffer(tmp).toString('hex'));
                }
                k--;
            }

            if (script === false && le !== false && k < 0) {
                k = raw[i];
                le = false;
                script = true;
                continue;
            }

            if (le === false && script !== false && k >= 0) {
                if (k != 0) {
                    tmp2.push(raw[i]);
                    //console.log('script ' + k, new Buffer(tmp2).toString('hex'));
                }
                k--;
            }

            if (le === false && script !== false && (k < 0 || raw.length - 1 == i)) {
                k = 8;
                le = false;
                script = false;
                //console.log('end')
                if (tmp.length && tmp2.length) {
                    outputs.push([tmp, tmp2]);
                    tmp = [], tmp2 = [];
                    tmp.push(raw[i]);
                    k--;
                }
            }




        }
    }

    return outputs;
}
txParser.parseScript = function (raw) {
    if (!raw)
        return {};

    var arr = {
        0: 'pushdata47',
        1: 'seq',
        2: 'derlen',
        3: 'intX',
        4: 'derXlen'
    }
    var sel = '', out = {};
    for (var i = 0; i < raw.length; i++) {
        if (arr[i])
            sel = arr[i];

        if (arr[i] == 'derXlen') {
            arr[i + 1] = 'derX';
            arr[i + raw[i] + 1] = 'intY';
            arr[i + raw[i] + 2] = 'derYlen';
        }

        if (arr[i] == 'derYlen') {
            arr[i + 1] = 'derY';
            arr[i + raw[i] + 1] = 'sighash_all';
        }

        if (arr[i] == 'sighash_all') {
            arr[i + 1] = 'pushdata41';
        }

        if (arr[i] == 'pushdata41') {
            arr[i + 1] = 'pubtype';
        }

        if (arr[i] == 'pubtype') {
            arr[i + 1] = 'pubkeyX';
            var len = out['pushdata41'] - 1;
            arr[i + 1 + len / 2] = 'pubkeyY';
        }

        if (!out[sel])
            out[sel] = [];
        out[sel].push(raw[i]);
    }


    return out;
}

txParser.prototype = {
    bytesBody: null,
    prettyBody: null,
    run: function () {
        if (!this.prettyBody) {
            var tx = new Buffer(this.raw, 'hex');
            var vars = this._first(tx)

            vars['outputs'] = this._parseOuts(vars['rawoutput']);
            vars['input_scripts'] = [];

            for (var i in vars['inputs']) {
                if (new Buffer(vars['inputs'][i][0]).toString('hex') == '0000000000000000000000000000000000000000000000000000000000000000'
                        && new Buffer(vars['inputs'][i][1]).toString('hex') == 'ffffffff')
                    vars['coinbase'] = 1;

                if (vars['coinbase']) {
                    vars['input_scripts'][i] = vars['inputs'][i][3];
                } else
                    vars['input_scripts'][i] = this._parseScript(vars['inputs'][i][3]);
            }

            this.bytesBody = vars;
            return this.prettyBody = this.pretty(vars);
        } else
            return this.prettyBody;
    },
    _first: function (tx) {

        var arr = {
            0: 'version',
            4: 'inputcnt',
        }

        var vars = {}, sel = '', outs = [], i = 0, input = 0, inputtmp = [];
        for (; i < tx.length; i++) {


            if (arr[i] == 'scriptend') {
                input--;
                inputtmp.push([
                    vars['inputtx'],
                    vars['inputindex'],
                    vars['inputscriptlen'],
                    vars['inputscript'],
                    vars['scseq'],
                ]);

                arr['inputtx'] = 0;
                arr['inputscriptlen'] = 0;
                arr['inputindex'] = 0;
                arr['inputscript'] = 0;
                arr['inputend'] = 0;
                arr['scriptend'] = 0;
                arr['scseq'] = 0;

                vars['inputtx'] = [];
                vars['inputscriptlen'] = [];
                vars['inputindex'] = [];
                vars['inputscript'] = [];
                vars['inputend'] = [];
                vars['scseq'] = [];

                if (input > 0) {
                    arr[i] = 'inputtx';
                } else {
                    arr[i] = 'outputscnt';
                    arr[i + 1] = 'rawoutput';
                }
            }

            if (arr[i] == 'inputcnt') {
                input = tx[i];
                arr[i + 1] = 'inputtx';
            }

            if (arr[i] == 'inputtx') {
                arr[i + 32] = 'inputindex';
                arr[i + 36] = 'inputscriptlen';
            }

            if (arr[i] == 'inputscriptlen') {
                arr[i + 1] = 'inputscript';
                arr[i + tx[i] + 1] = 'scseq';
                arr[i + tx[i] + 5] = 'scriptend';
            }

            if (arr[i])
                sel = arr[i];

            if (tx.length - i < 5)
                sel = 'locktime';

            if (!vars[sel])
                vars[sel] = [];
            vars[sel].push(tx[i]);
        }

        vars['inputs'] = inputtmp;
        return vars;
    },
    _parseOuts: function (raw) {
        var outputs = txParser.parseOutputs(raw);
        for (var i in outputs) {
            outputs[i][1] = (Script.scriptToAddrHash(new Buffer(outputs[i][1])))
        }
        return outputs;
    },
    _parseScript: function (raw) {
        return txParser.parseScript(raw);
    },
    pretty: function (vars) {
        var buffs = [];
        for (var i in vars) {
            try {
                if (i == 'coinbase') {
                    buffs[i] = vars[i];
                    continue;
                }

                if (i == 'inputs') {

                    var aa = [];
                    for (var p in vars[i]) {
                        aa.push([
                            new Buffer(vars[i][p][0]).toString('hex'),
                            new Buffer(vars[i][p][1]).toString('hex'),
                            new Buffer(vars[i][p][2]).toString('hex'),
                            new Buffer(vars[i][p][3]).toString('hex'),
                            new Buffer(vars[i][p][4]).toString('hex')])
                    }

                    buffs[i] = aa;
                } else if (i == 'input_scripts') {


                    if (!vars['coinbase']) {
                        var sc = {};
                        for (var m in vars[i]) {//arr of scripts
                            for (var p in vars[i][m]) {//object
                                if (vars[i][m][p]) {
                                    if (!sc[m])
                                        sc[m] = {};
                                    sc[m][p] = (new Buffer(vars[i][m][p]).toString('hex'))
                                }
                            }
                        }
                    } else {
                        var sc = [new Buffer(vars[i][0]).toString('hex')]
                    }

                    buffs[i] = sc;
                } else if (i == 'outputs') {

                    var aa = [];
                    for (var p in vars[i]) {
                        aa.push([new Buffer(vars[i][p][0]).toString('hex'), new Buffer(vars[i][p][1]).toString('hex')])
                    }

                    buffs[i] = aa;

                } else
                if (vars[i].length > 0)
                    buffs[i] = new Buffer(vars[i]).toString('hex');
            } catch (e) {
                console.log(e)
                buffs[i] = vars[i];
                continue;
            }
        }

        return buffs;
    },
    getBytes: function (name) {
        return this.bytesBody[name];
    },
    getHash: function () {
        return util.reverseBuffer(hash.sha256(hash.sha256(new Buffer(this.raw, 'hex')))).toString('hex');
    },
    toJSON: function () {
        //todo: make json and equal as bitcoin
        if (global.blockchainInited) {
            var bchain = require('../../blockchain/index')
            var blockchain = new bchain();
        }

        var json = {
            ver: util.fromLittleEndian(new Buffer(this.prettyBody['version'], 'hex')).toString(10),
            coinbase: !!this.prettyBody['coinbase'],
            inputs: [
            ],
            block_height: 0,
            outputs: [
            ],
            "lock_time": util.fromLittleEndian(new Buffer(this.prettyBody['locktime'], 'hex')).toString(10),
            "size": new Buffer(this.raw).length,
            "double_spend": false,
            //"time": 1500374033,
            //"tx_index": 268739658,
            "vin_sz": Number(this.prettyBody['inputcnt'], 16),
            "hash": this.getHash(),
            "vout_sz": Number(this.prettyBody['outputscnt'], 16),
        }

        var inval = 0, outval = 0;

        for (var i in this.bytesBody['inputs']) {
            if (!json['inputs'])
                json['inputs'] = [];
            json['inputs'][i] = {
                tx: util.reverseBuffer(new Buffer(this.prettyBody['inputs'][i][0], 'hex')).toString('hex'),
                script: this.prettyBody['inputs'][i][3],
                index: util.fromLittleEndian(new Buffer(this.prettyBody['inputs'][i][1], 'hex')),
                sequence: this.prettyBody['inputs'][i][4],
            }

            var out;
            if (json['inputs'][i].tx != "0000000000000000000000000000000000000000000000000000000000000000" && global.blockchainInited) {//not a coinbase
                out = blockchain.getOut(json['inputs'][i].tx, json['inputs'][i].index);
                inval += out.value;
            }

        }

        for (var i in this.bytesBody['outputs']) {
            if (!json['outputs'])
                json['outputs'] = [];
            json['outputs'][i] = {
                //"spent": true,
                //"tx_index": 268735986,
                //"type": 0,
                //"n": 0,
                "addr": hash.generateAddresFromAddrHash(this.prettyBody['outputs'][i][1]),
                "value": util.fromLittleEndian(new Buffer(this.prettyBody['outputs'][i][0], 'hex'), 1),
                "script": Script.addrHashToScript(new Buffer(this.prettyBody['outputs'][i][1], 'hex'))
            }

            outval += json['outputs'][i].value;
        }

        json.fee = this.fee = inval / outval;
        json.size = this.size = new Buffer(this.raw).length;
        return json;
    },
    fromJSON: function (json_str) {
        //make raw from json
        var ver = util.littleEndian(json_str.ver).toString('hex'),
                incnt = util.numHex(json_str.vin_sz),
                outcnt = util.numHex(json_str.vout_sz),
                lock = util.littleEndian(json_str.lock_time).toString('hex'), outs = "", ins = "";

        for (var i in json_str.inputs) {

            var prevtx = util.reverseBuffer(new Buffer(json_str.inputs[i].tx, 'hex')).toString('hex'),
                    index = util.littleEndian(json_str.inputs[i].index).toString('hex'), sc = json_str.inputs[i].script,
                    sclen = util.numHex(new Buffer(sc, 'hex').length),
                    seq = json_str.inputs[i].sequence;

            ins += prevtx + index + sclen + sc + seq;
        }

        for (var i in json_str.outputs) {

            var sc = json_str.outputs[i].script, sclen = util.numHex(new Buffer(sc, 'hex').length);
            outs += util.littleEndian(json_str.outputs[i].value, 1).toString('hex') + sclen + sc;

        }

        this.size = json_str.size;
        this.fee = json_str.fee;
        this.raw = ver + incnt + ins + outcnt + outs + lock;
    },
    getSize: function () {
        if (!this.size)
            this.toJSON();
        return this.size;
    },
    getFee: function () {
        if (!this.fee)
            this.toJSON();
        return this.fee;
    }
}

module.exports = txParser;