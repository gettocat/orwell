var rpc = require('node-json-rpc');
var config = require('../config');
var handler = require('./index')
var rpcEvents = require('../events/rpc');
var serv = null;

function start() {
    if (!serv) {
        serv = new rpc.Server(config.rpc.server);

        var items = [];

        var methods = handler.getAllMethods();
        for (var i in methods) {

            items.push(methods[i]);
            var method = methods[i];
            var cb = new Function('handler', 'return function (params, callback) {handler(\''+method+'\', params, callback);}');
            serv.addMethod(methods[i], cb(handler));

        }

        if (config.debug.rpc)
            console.log("rpc - added methods " + items.join(","));

        serv.start(function (error) {

            if (config.debug.rpc)
                console.log("starting server: " + ((error) ? "fail" : "success"))
            // Did server start succeed ? 
            if (error)
                throw error;
            else {
                if (config.debug.rpc)
                    console.log('RPC server running ...');

                rpcEvents.emit("rpc.server.start", serv)
            }
        });
    }

    return serv;

}

module.exports = start

