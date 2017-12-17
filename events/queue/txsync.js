/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var txSync = function () {

};

util.inherits(txSync, EventEmitter);
var obj = null;

txSync.prototype.index = {};
txSync.prototype.for = function (arr) {
    this.list = arr;
    return this
}

txSync.prototype.with = function (d) {
    this.data = d;
    return this
}

txSync.prototype.push = function (key, index, cb) {
    this.index[key] = index;
    this.on("release_" + key, cb);
    return this
}

txSync.prototype.release = function (key) {
    this.emit("release_" + key, key, this.list, this.data);
    return this
}

module.exports = obj ? obj : obj = new txSync();