/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var blockSync = function () {

};

util.inherits(blockSync, EventEmitter);
var obj = null;

blockSync.prototype.index = {};
blockSync.prototype.for = function (arr) {
    this.list = arr;
    return this
}

blockSync.prototype.with = function (d) {
    this.data = d;
    return this
}

blockSync.prototype.push = function (key, index, cb) {
    this.index[key] = index;
    this.on("release_" + key, cb);
    return this
}

blockSync.prototype.release = function (key) {
    this.emit("release_" + key, key, this.list, this.data);
    this.removeAllListeners("release_"+key);
    return this
}

module.exports = obj ? obj : obj = new blockSync();