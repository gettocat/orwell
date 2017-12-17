/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var shortenSTUN = true; // set to true if your STUN server disconnects too early
var localIP = '0.0.0.0';

var net = require('net');
var stun = require('vs-stun');
var events = require('events');

var PublicTCP = function (cb) {
    if (cb)
        this.on('refresh', cb);
}

PublicTCP.prototype = new events.EventEmitter;

PublicTCP.prototype.start = function (addr, port) {
    stunserver = {host: addr, port: port};
    var self = this;
    var sock = this.socket = net.connect({port: stunserver.port, host: stunserver.host, localAddress: localIP},
            function () {
                stun.resolve_tcp(sock, stunserver, function (err, value) {
                    if (err) {
                        console.log('Something went wrong: ' + err);
                    } else {
                        console.log("STUN Response:")
                        console.log(value);
                        self.emit('refresh', value);
                    }
                }, {short: shortenSTUN});
            });
}

PublicTCP.prototype.close = function () {
    this.emit('close');
    this.socket.end();
}

module.exports = PublicTCP
