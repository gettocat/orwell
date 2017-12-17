/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var evnet = require('../events/net');
var netEvents = require('../events/network');
var nodes = require('../db/entity/network/nodes')
var net = require('net');
var config = require('../config');
var split = require('split');


function serve() {

    var server = net.createServer({allowHalfOpen: false}, function (stream) {
        processData.server = "";
        stream.setNoDelay(false);
        stream.setKeepAlive(true);
        var st = stream.pipe(split(processData.sep));
        netEvents.emit("net.connection", stream)
        netEvents.emit("net.connection.add", stream, 'server');
        st.on("data", function (data) {
            data = processData.sep + data;
            processData.server += data;

            var res = processData('server');
            for (var i in res) {
                netEvents.emit("net.message", stream, res[i], 'server');
            }
        });

        st.on('close', function () {
            netEvents.emit("net.close", st, 'close');
            if (st && st.remoteAddress)
                netEvents.emit("net.connection.remove", st.remoteAddress + "/" + st.remotePort + "/" + st.localPort, 'server');
        })

        st.on("end", function () {
            netEvents.emit("net.close", st, 'end');
            if (st && st.remoteAddress)
                netEvents.emit("net.connection.remove", st.remoteAddress + "/" + st.remotePort + "/" + st.localPort, 'server');
        })

        st.on('error', function (e) {
            netEvents.emit("net.error", e, st);
            if (st && st.remoteAddress)
                netEvents.emit("net.connection.remove", st.remoteAddress + "/" + st.remotePort + "/" + st.localPort, 'server');
        })

    }).listen(config[config.net].port);

    server.on('listening', function () {
        netEvents.emit("net.server.init", server);
    });

    server.on('close', function () {
        netEvents.emit("net.server.close", server, 'close');
    })

    server.on("end", function () {
        netEvents.emit("net.server.close", server, 'end');
    })

    server.on('error', function (e) {
        netEvents.emit("net.server.error", e, server);
    })


    newClient('localhost', config[config.net].port)
    return server;
}

function newClient(host, port) {

    var client = net.connect(port, host);
    processData.client = "";
    var st = client.pipe(split(processData.sep));
    st.on('data', function (data) {
        data = processData.sep + data;
        processData.client += data;
        var res = processData('client');
        for (var i in res) {
            netEvents.emit("net.message", client, res[i]);
        }
    });

    client.on('close', function () {
        netEvents.emit("net.close", client);
    })

    client.on('error', function (e) {
        netEvents.emit("net.error", e, client);
    })

    client.on("end", function () {
        netEvents.emit("net.close", client, 'end');
    })


    return client;

}


var processData = function (key) {

    var res = processData[key].split(processData.sep);
    if (res.length == 1) {
        //its part of previous message
        return res;
    }

    var result = [], cnt = 0
    for (var i in res) {
        if (i == 0 && res[i] != '') {
            result.push(res[i]);
        } else if (res[i] && res[i].length > 0) {
            var r = processData.sep + res[i];
            result.push(r);
            cnt++;
        }
    }

    processData[key] = "";
    return result;

}

processData.sep = config[config.net].magic

module.exports = {
    serve: serve,
    newClient: newClient
}