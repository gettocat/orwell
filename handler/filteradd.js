/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var chainEvents = require('../events/chain')
var nodes = require('../db/entity/network/nodes')
var protocol = require('../network/protocol')
require('../tools/bitpony_extends');
var bitPony = require('bitpony');

module.exports = function (opts, self) {

    if (self) {
        return false;
    }

    var key = "data/" + protocol.getAddressUniq(this.rinfo);
    var d = nodes.get(key);
    d.filter = opts.filter;

    var res = bitPony.filterload.read(d.filter);
    var items = bitPony.filteradd.read(opts.filter);
    res.vData = res.vData.concat(items)
    var filter = bitPony.filterload.write(res.vData, res.nHashFuncs, res.nTweak, res.nFlags);
    d.filter = filter.toString('hex');
    nodes.set(key, d);
    //add mean that new key added, if you import key - create new filterload message to recalc 

    return false;
}