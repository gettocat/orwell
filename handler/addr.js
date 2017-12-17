/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var thisnode = require('../network/self');
var protocol = require('../network/protocol')
var nodes = require('../db/entity/network/nodes');
var indexes = require('../db/entity/block/indexes')
var config = require('../config')

module.exports = function (data, self) {

    if (self)
        return false;

    var key = protocol.getAddressUniq(this.rinfo);
    var d = nodes.get("data/" + key);
    d.top = data.top;
    d.lastMsg = new Date().getTime() / 1000;
    nodes.set("data/" + key, d);

    //recv some addr, check and add if not exist
    for (var i in data.nodes) {
        protocol.addNode(data.nodes[i]);
    }

    var arr = [];
    if (indexes.get('top').height > data.top.height) {
        arr.push({
            sendBack: true,
            type: 'needupdate',
            response: {
                lastblock: indexes.get('top')
            }
        })
    } else if (data.top.height > indexes.get('top').height && !indexes.haveblock(data.top.hash)) {
        arr.push({
            sendBack: true,
            type: 'getblocks',
            response: {
                headhash: indexes.get('top').hash,
                offset: 0
            }
        })
    }

    return arr

}