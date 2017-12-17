/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var chainEvents = require('../events/chain')
var nodes = require('../db/entity/network/nodes')
var protocol = require('../network/protocol')

module.exports = function (opts, self) {

    if (self) {
        return false;
    }
    
    var key = "data/" + protocol.getAddressUniq(this.rinfo);
    var d = nodes.get(key);
    d.filter = opts.filter;
    nodes.set(key, d);

    /*chainEvents.emit("chain.inventory.need", {
        rinfo: this.rinfo,
        type: 'filter',
        head: opts.filter
    });*/

    return false;
}