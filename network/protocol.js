/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var networkMessage = require('./networkmessage');
var config = require('../config');
var thisnode = require('./self');
var util = require('../tools/util');
var hash = require('../crypto/hash');
var netevent = require('../events/network')
var indexes = require('../db/entity/block/indexes')
var bitPony = require('bitpony');
var nodes = require('../db/entity/network/nodes')
var netTime = require('../blockchain/block/nettime')

module.exports = protocol = {
    addrtimer: null,
    pingtimer: null,
    nodestimer: null,
    chunks: [],
    delimeter: "3c213e",
    nodename: '',
    f_send: function () {
        throw new Error('not implementet yet');
    },
    createMessage: function (type, data) {

        var msg = JSON.stringify(data);
        /*var m = new Buffer(msg);
         if (m.length > 128 * 1024) {
         
         //throw new Error('this message is too big');
         //todo protocol/fix multimessage issue
         var arr = util.splitBuffer(m, 64 * 1024), msgs = []
         var rand = util.rand(0, 0xffffffff);
         
         for (var i in arr) {
         
         var buff = new Buffer(config[config.net].magic, 'hex');
         var writer = new bitPony.writer(buff);
         //magic
         writer.uint32(parseInt(config[config.net].magic, 16), true);
         writer.uint32(rand, true)//message round number
         
         writer.uint32(i, true);//message order in list (used if messages count > 1). Can split big message to some small
         writer.uint32(arr.length, true);//messages count
         //command,
         writer.string(type, true);
         //checksum,
         writer.hash(hash.sha256(hash.sha256(type + msg)).toString('hex'), true);
         //payload_raw,
         writer.string(msg, true);
         
         msgs.push(writer.getBuffer().toString('hex'))
         }
         
         return msgs;
         
         } else {*/

        //magic
        var buff = new Buffer(config[config.net].magic, 'hex');
        var writer = new bitPony.writer(buff);
        writer.uint32(util.rand(0, 0xffffffff), true)//message round number

        writer.uint32(0, true);//message order in list (used if messages count > 1). Can split big message to some small
        writer.uint32(1, true);//messages count
        //command,
        writer.string(type, true);
        //checksum,
        writer.hash(hash.sha256(hash.sha256(type + msg)).toString('hex'), true);
        //payload_raw,
        writer.string(msg, true);

        //var bfr = new Buffer(packet_str, 'hex'),
        //sizr = util.littleEndian(bfr.length).toString('hex')
        //console.log("send length "+bfr.length, sizr);
        return writer.getBuffer()

        //}
    },
    readMessage: function (buff) {

        if (!(buff instanceof Buffer))
            buff = new Buffer(buff, 'hex');

        if (buff.toString('hex').indexOf(config[config.net].magic) != 0) {
            protocol.chunks.push(buff);
            buff = Buffer.concat(protocol.chunks);
            //return false;
        }

        var package = {}, data = null
        var reader = new bitPony.reader(buff);
        var res = reader.uint32(0);

        package.magic = res.result;
        res = reader.uint32(res.offset);
        package.rand = res.result;
        res = reader.uint32(res.offset);
        package.order = res.result;
        res = reader.uint32(res.offset);
        package.messages = res.result;
        res = reader.string(res.offset);
        package.command = res.result.toString('utf8');
        res = reader.hash(res.offset);
        package.checksum = res.result;
        res = reader.string(res.offset);
        package.payload = res.result;

        if (package.messages > 1) {
            if (!protocol.chunks[package.rand])
                protocol.chunks[package.rand] = {};
            protocol.chunks[package.rand][package.order] = package.payload;
            data = null;
            if (Object.keys(protocol.chunks[package.rand]).length >= package.messages) {
                var buffer = Buffer.concat(protocol.chunks[package.rand]);
                data = buffer.toString('utf8');
                protocol.chunks[package.rand] = null;
                delete protocol.chunks[package.rand];
            }
        }

        if (package.messages == 1)
            data = package.payload.toString('utf8');

        if (!data)//multiple message
            return false;

        var myhash = hash.sha256(hash.sha256(package.command + data)).toString('hex');
        if (myhash != package.checksum) {
            //not full message, wait another chunks
            protocol.chunks = [];
            protocol.chunks[0] = buff;
            if (config.debug.protocol)
                console.log("!! cant read message, hash is not valid or size of message is not equals, size (" + package.checksum + "," + myhash + ")")

            return false;
        }

        return [
            package.command,
            data ? JSON.parse(data) : {}
        ]
    },
    init: function () {
        global.config.init_started = 1;
        netevent.emit("network.init.start");

        var nodes = protocol.getNodeList();
        for (var i in nodes) {
            protocol.initNode(nodes[i])
        }

        /*return this.sendAll('version', {
         version: config.blockchain.version || 0,
         lastblock: indexes.get('top'),
         nodeName: thisnode.name = protocol.getNodeName(),
         })*/
    },
    initNode: function (addr, afterInit) {
        netevent.emit("net.node.add", addr, function (rinfo) {


            netevent.on("net.node.init" + protocol.getAddressUniq(rinfo), function () {
                //here we can send any message
                netevent.removeAllListeners("net.node.init" + protocol.getAddressUniq(rinfo));
                if (afterInit instanceof Function)
                    afterInit(rinfo);
            });


            var d = nodes.get("data/" + protocol.getAddressUniq(rinfo));
            d.initiator = 1;
            nodes.set("data/" + protocol.getAddressUniq(rinfo), d);
            protocol.sendOne(rinfo, 'version', {
                version: config.blockchain.version || 0,
                lastblock: indexes.get('top'),
                nodeName: thisnode.name = protocol.getNodeName(),
                agent: protocol.getUserAgent(),
                services: config.services,
                relay: config.relay
            })
        });

    },
    getNodeName: function () {
        if (!global.config['publicKey'])
            throw new Error('error, to start node need generate KeyPair');
        return protocol.nodename = hash.generateAddres(global.config['publicKey'])
    },
    getNodeList: function () {

        var list = nodes.get("connections");
        if (!list || !(list instanceof Array))
            list = [];

        if (!list.length)
            list = config.nodes;

        return list;
    },
    checkNodes: function () {


        var list = protocol.getNodeList();
        for (var i in list) {

            var socket = nodes.get("connection/" + list[i]);

            if (config.debug.peers)
                console.log("check peer " + list[i] + " OK: ", !(!socket || socket.destroyed === true));

            if (!socket || socket.destroyed === true) {
                if (config.debug.peers)
                    console.log("remove peer " + list[i])
                netevent.emit("net.connection.remove", list[i]);
            }


        }

    },
    emit: function (data, rinfo, self) {

        var a = protocol.readMessage(data);
        if (a) {
            if (config.debug.protocol)
                console.log("< recv " + a[0] + " < " + JSON.stringify(a[1]))

            netevent.emit("network.newmessage", {type: a[0], data: a[1], self: self || a[1].nodeName == protocol.nodename});
            new networkMessage(protocol, a[0], a[1], rinfo, self || a[1].nodeName == protocol.nodename);
            return a[1].nodeName;
        }

        return false;
    },
    sendAll: function (type, data) {
        //data.nodeName = protocol.nodename;
        if (config.debug.protocol)
            console.log("> send [ all ] " + type + " > " + JSON.stringify(data))
        netevent.emit("network.emit", {type: type, data: data});
        netevent.emit("net.send", protocol.createMessage(type, data))
    },
    sendOne: function (rinfo, type, data) {
        //data.nodeName = protocol.nodename;
        if (config.debug.protocol)
            console.log("> send [ one ] " + type + " > " + JSON.stringify(data))
        netevent.emit("network.send", {type: type, data: data, rinfo: rinfo});
        netevent.emit("net.send", protocol.createMessage(type, data), rinfo)
    },
    addNode: function (nodeAddr, cb) {

        var a = protocol.getUniqAddress(nodeAddr);

        nodeAddr = nodeAddr.replace("::ffff:", "")
        if (thisnode.addr == a.remoteAddress)
            return false;

        var adding = true;
        var list = nodes.get("connections");
        if (!list || !(list instanceof Array))
            list = [];


        var finded = false;
        for (var i in list) {
            if (list[i] && (list[i].indexOf(a.remoteAddress.replace("::ffff:", "")) >= 0 || list[i] == nodeAddr)) {
                finded = true;
                adding = false;
                break;
            }
        }

        if (!finded) {
            protocol.initNode(nodeAddr.replace("::ffff:", ""), cb);
            thisnode.nodeCount = list.length + 1;
        }

        return adding;
    },
    getAddressUniq: function (rinfo) {
        return rinfo.remoteAddress.replace("::ffff:", "") + "/" + rinfo.remotePort + "/" + rinfo.port
    },
    getUniqAddress: function (key) {
        if (!key)
            throw new Error('undefined key');
        var a = key.split("/");
        return {
            remoteAddress: a[0],
            remotePort: a[1],
            port: a[2]
        }
    },
    exceptNode: function (addr) {
        var arr = [];

        var list = nodes.get("connections");
        if (!list || !(list instanceof Array))
            list = [];

        if (!list.length)
            list = config.nodes;

        for (var i in list)
            if (list[i] != addr) {
                var a = protocol.getUniqAddress(list[i]);

                if (a.remoteAddress.indexOf("127.0.0.1") >= 0 || (addr && a.remoteAddress.indexOf(addr) >= 0))
                    continue;

                var key = a.remoteAddress.replace("::ffff:", "") + "//" + a.port;
                if (arr.indexOf(key) < 0)
                    arr.push(key);
            }

        return arr;
    },
    getRandomNode: function () {
        var list = protocol.exceptNode(""), n = list[util.rand(0, list.length - 1)];
        return n;
    },
    getUserAgent: function () {
        var os = require('os'), process = require('process')
        var ua = "%agent%:%agent_ver%/%net%:%blockchain_ver%/%platform%:%platform_ver%/%os%:%os_ver%/%services%:%relay%/%uptime%";
        
        return ua
                .replace("%agent%", config.agent)
                .replace("%agent_ver%", config.agent_version)
                .replace("%net%", config.net)
                .replace("%blockchain_ver%", config.blockchain.version)
                .replace("%platform%", 'nodejs')
                .replace("%platform_ver%", process.version)
                .replace("%os%", os.platform())
                .replace("%os_ver%", os.release())
                .replace("%services%", config.services)
                .replace("%relay%", !!config.relay)
                .replace("%uptime%", process.uptime());
    },
    createPingAllTask: function (seconds) {
        setTimeout(function () {
            var pings = [];
            var list = protocol.getNodeList();
            for (var i in list) {

                var time = nodes.getLastMsg(list[i]);
                if (time > config.network.timeout && list[i].indexOf("127.0.0.1") < 0 && list[i].indexOf(thisnode.addr) < 0)
                    pings.push(list[i]);


            }


            if (pings.length) {
                console.log("have maybe timedout nodes: ", pings);
                for (var i in pings) {

                    var rinfo = protocol.getUniqAddress(pings[i]);
                    if (rinfo.remoteAddress == '127.0.0.1')
                        continue;

                    var key = "data/" + pings[i];
                    var d = nodes.get(key);

                    d.startPing = new Date().getTime();
                    nodes.set(key, d)

                    protocol.sendOne(rinfo, 'ping', {
                    });

                }

            }


            protocol.createPingAllTask(seconds);

        }, seconds);
    },
    createAddrAllTask: function (seconds) {
        setTimeout(function () {

            protocol.sendAll('addr', {
                top: indexes.get('top'),
                nodes: protocol.exceptNode("")
            })

            protocol.createAddrAllTask(seconds);

        }, seconds);
    },
    createTimeTask: function (seconds) {
        setTimeout(function () {

            netTime.askTime();
            protocol.createTimeTask(seconds);

        }, seconds);
    },
    createCheckNodeTask: function (seconds) {
        setTimeout(function () {

            protocol.checkNodes();
            protocol.createCheckNodeTask(seconds)

        }, seconds);
    }
};
