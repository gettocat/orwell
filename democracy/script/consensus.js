/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var indexes = require('../../db/entity/block/indexes')
var dif = require('../../blockchain/block/difficulty')

module.exports = function () {
    return {
        block: indexes.get('top').hash,
        height: indexes.get('top').height,
        bits: Number(dif.bits()).toString(16),
        target: dif.bits2target(dif.bits()).toString('hex')
    };
}