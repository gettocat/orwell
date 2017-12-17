/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var nodes = require('../db/entity/network/nodes');
var config = require('../config');
var util = require('../tools/util')
var indexes = require('../db/entity/block/indexes')
var protocol = require('../network/protocol');
var netEvents = require('../events/network')
var protocolEvents = require('../events/protocol')
var netTime = require('../blockchain/block/nettime')

module.exports = function (data, self) {

    if (self)
        return false;

    var key = protocol.getAddressUniq(this.rinfo);
    var d = nodes.get("data/" + key);
    d.rinfo = this.rinfo;
    d.ackSended = 1;
    d.inited = 1;
    //d.lastMsg = new Date().getTime() / 1000;
    d.pingTime = new Date().getTime() / 1000 - d.startPing;
    if (d.pingTime < d.minPing)
        d.minPing = d.pingTime;
    delete d.startPing;
    nodes.set("data/" + key, d);
    nodes.set('address/' + key, data.nodeName);

    netEvents.emit("net.node.init" + key, key)
    protocolEvents.emit("protocol.node.added", key, protocol.getUniqAddress(key))

    var arr = [];
    if (d.services == 0) {//node
        if (indexes.get('top').height > d.top.height) {
            arr.push({
                sendBack: true,
                type: 'needupdate',
                response: {
                    lastblock: indexes.get('top')
                }
            })
        } else if (d.top.height > indexes.get('top').height) {
            arr.push({
                sendBack: true,
                type: 'getblocks',
                response: {
                    headhash: indexes.get('top').hash,
                    offset: 0
                }
            })
        }
    }

    arr.push({
        sendBack: true,
        type: 'activenodes',
        response: {
            addr: this.rinfo.remoteAddress.replace("::ffff:", ""),
            nodes: protocol.exceptNode(this.rinfo.remoteAddress.replace("::ffff:", ""))
        }
    });

    return arr;
}