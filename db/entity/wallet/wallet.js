/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var entity = require('../entity');
var config = require('../../../config');

var wallet = function () {
    this.name = config.net == 'mainnet' ? 'wallet.dat' : 'wallet_testnet.dat';
    this.init();
}

util.inherits(wallet, entity);

module.exports = wallet;