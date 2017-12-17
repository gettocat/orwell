/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var protocol = require('../network/protocol');
var thisnode = require('../network/self');

module.exports = function (data, self) {
    if (data.addr)
        thisnode.addr = data.addr.replace("::ffff:", "");

    if (self)
        return false;

    for (var i in data.nodes) {
        protocol.addNode(data.nodes[i]);
    }
    //todo PORT

    return [{
            sendBack: false,
            type: 'ping',
            response: {}
        }];

}