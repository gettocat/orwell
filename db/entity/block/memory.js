/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var kventity = require('../memory');
var util = require('util');
var obj = null;
var blockmemory = function () {//its disable loop-sync
    this.name = 'blockmemory';
    this.options = {inmemory: true};
    this.init();
}

util.inherits(blockmemory, kventity)

module.exports = obj ? obj : obj = new blockmemory;