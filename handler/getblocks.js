/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */
var nodes = require('../db/entity/network/nodes');
var protocol = require('../network/protocol');
var chainEvents = require('../events/chain')

module.exports = function (opts, self) {

    if (self) {
        return false;
    }

    var key = protocol.getAddressUniq(this.rinfo);
    var d = nodes.get("data/" + key);

    chainEvents.emit("chain.inventory.need", {
        filter: d.filter,
        rinfo: this.rinfo,
        type: 'block',
        head: opts.headhash,
        offset: opts.offset || 0,
    });

    return {};
}