/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var dgram = require('dgram')
var thunky = require('thunky')
var events = require('events')
var config = require('../config');
var protocol = require('./protocol');
var netevent = require('../events/network')

var noop = function () {}

module.exports = function (opts) {
    if (!opts)
        opts = {}

    var that = new events.EventEmitter()
    var port = typeof opts.port === 'number' ? opts.port : 66692
    var type = opts.type || 'udp4'
    var ip = opts.ip || opts.host || (type === 'udp4' ? '224.0.0.251' : null)
    var me = {address: ip, port: port}
    var destroyed = false

    if (type === 'udp6' && (!ip || !opts.interface)) {
        throw new Error('For IPv6 multicast you must specify `ip` and `interface`')
    }

    var socket = opts.socket || dgram.createSocket({
        type: type,
        reuseAddr: opts.reuseAddr !== false,
        toString: function () {
            return type
        }
    })

    socket.on('error', function (err) {
        console.log('network error', err)
        if (err.code === 'EACCES' || err.code === 'EADDRINUSE')
            that.emit('error', err)
        else
            that.emit('warning', err)
    })

    that.on("error", function (err) {
        netevent.emit("network.error", err);
    })

    that.on("warning", function (err) {
        netevent.emit("network.warn", err);
    })

    socket.on('message', function (message, rinfo) {
        if (config.debug.network)
            console.log("<< " + rinfo.address + " > " + (new Buffer(message).length / 1024), "Kb\n");

        function isSelf(rinfo) {
            var os = require('os');

            var finded = false;
            var interfaces = os.networkInterfaces();
            var addresses = [];
            for (var k in interfaces) {
                for (var k2 in interfaces[k]) {
                    var address = interfaces[k][k2];
                    if (address.family === 'IPv4' && !address.internal) {
                        addresses.push(address.address);

                        if (address.address == rinfo.address)
                            finded = true;
                    }
                }
            }

            var ip = '';
            return rinfo.address == me.ip || rinfo.address == '127.0.0.1' || finded
        }

        that.emit('packet', message, rinfo)
        protocol.emit(message, rinfo, isSelf(rinfo));
    })

    socket.on('listening', function () {
        if (config.debug.network)
            console.log("listening connection...")

        if (opts.multicast !== false) {
            try {
                socket.setBroadcast(true);
                socket.addMembership(ip, '0.0.0.0')
            } catch (err) {
                that.emit('error', err)
            }
            socket.setMulticastTTL(opts.ttl || 255)
            socket.setMulticastLoopback(opts.loopback !== false)
        }

        var address = socket.address();
        if (!port)
            port = me.port = address.port

        protocol.onSend(function (message, rinfo, cb) {
            var nodes = protocol.getNodeList();

            if (!(message instanceof Array))
                message = [message];

            for (var i in message) {
                setTimeout(function (i) {
                    var msg = new Buffer(message[i], 'hex');
                    if (msg.length > 65535)
                        throw new Error('Message length cant be more than 65KB (you message size: ' + (msg.length / 1024) + ').');//todo, split this message to datagrams < 65KB

                    if (!rinfo)
                        for (var i in nodes) {
                            if (config.debug.network)
                                console.log(">> " + nodes[i] + " > (" + msg.length / 1024 + "K bytes)\n");
                            socket.send(msg, 0, (msg).length, me.port, nodes[i], function () {
                                if (cb)
                                    cb();
                            });
                        }
                    else {
                        if (config.debug.network)
                            console.log(">> " + rinfo.address + " > (" + msg.length / 1025 + "K bytes)\n");
                        socket.send(msg, 0, (msg).length, rinfo.port, rinfo.address, function () {
                            if (cb)
                                cb();
                        });
                    }
                }, 100 * i, i)

            }

        });


        protocol.init();
        /*
         var nodes = protocol.getNodeList();
         for (var i in nodes) {
         if (config.debug.network)
         console.log(">> " + nodes[i] + " > " + initmessage + "\n");
         socket.send(initmessage, 0, (initmessage).length, me.port, nodes[i]);
         }*/

        if (config.debug.network)
            console.log("server listening " + address.address + ":" + address.port);
    })

    var bind = thunky(function (cb) {
        if (!port)
            return cb(null)
        socket.once('error', cb)
        socket.bind(port, "0.0.0.0", function () {
            socket.removeListener('error', cb)
            cb(null)
        })
    })

    bind(function (err) {
        if (err)
            return that.emit('error', err)
        that.emit('ready')
    })

    that.send = function (messagetype, data, cb) {
        if (!cb)
            cb = noop

        bind(function (err) {
            if (destroyed)
                return cb()
            if (err)
                return cb(err)

            var hash = 1;
            var message = protocol.createMessage(messagetype, {type: messagetype, hash: hash, data: data});
            socket.send(message, 0, (message).length, me.port, me.ip, cb)
        })
    }

    that.destroy = function (cb) {
        if (!cb)
            cb = noop
        if (destroyed)
            return process.nextTick(cb)
        destroyed = true
        netevent.emit("network.destroyed");
        socket.once('close', cb)
        socket.close()
    }

    return that
}
