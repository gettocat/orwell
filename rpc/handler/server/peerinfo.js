var error = require('../../serror')
var res = require('../../res');
var protocol = require('../../../network/protocol');
var nodes = require('../../../db/entity/network/nodes')

module.exports = function (params) {

    var peers = protocol.getNodeList(), peerinfo = {};
    for (var i in peers) {
        var d = nodes.get("data/" + peers[i]);
        var rinfo = protocol.getUniqAddress(peers[i]);
        if (rinfo.remoteAddress == '127.0.0.1')
            continue;

        d.lastMsg = new Date().getTime() / 1000 - d.lastRecv;
        peerinfo[rinfo.remoteAddress + "//" + rinfo.port] = d;
    }

    return res(peerinfo);
}