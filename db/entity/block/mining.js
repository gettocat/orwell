/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var kventity = require('../memory');
var bitPony = require('bitpony');
var util = require('util');
var obj = null;
var works = function () {
    this.name = 'works';
    this.options = {inmemory: true};
    this.init();
}

util.inherits(works, kventity)

works.prototype.createWorkId = function (prevblockhash, height, bits, txcount) {
    return bitPony.tool.sha256(Buffer.concat([
        bitPony.var_int.write(txcount),
        new Buffer(prevblockhash, 'hex'),
        bitPony.var_int.write(height),
        bitPony.var_int.write(typeof bits == 'string' ? parseInt(bits, 16) : bits)
    ])).toString('hex')
}


module.exports = obj ? obj : obj = new works;