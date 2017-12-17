/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var demEvents = require('../events/democracy');
var hash = require('../crypto/hash')
var util = require('../tools/util')
var crypto = require('../crypto/index')
var script = require('../blockchain/script/script')
var demindex = require('../db/entity/democracy/index')
var config = require('../config')
var nodes = require('../db/entity/network/nodes')
var protocol = null;

var democracy = function (privateKey) {
    this.priv = privateKey;//only for create
    protocol = require('../network/protocol');
}

democracy.prototype = {
    LINE: .5,
    timeout: 120000, //2 minutes
    status: 'pending',
    result: null,
    /**
     * When node create new question to network
     */
    create: function (type, params, cb) {
        this.type = type;
        //send command to all
        //id
        var id = hash.sha256("" + util.rand(0, 10e6), 'hex');
        var hex = new Buffer(id + type + JSON.stringify(params));

        cf = new crypto(this.priv),
                sig = cf.ecdsa().sign(hex, new Buffer(this.priv, 'hex')),
                scriptSig = script.scriptSig(new Buffer(sig.toDER()), new Buffer(cf.private.getPublic(null, 'hex'), 'hex'));
        var f = this;

        //here: all active nodes, count of answered, percent of used
        demEvents.on("democracy.timedout" + id, function () {

            var info = demindex.get(id) || {};
            if (!info['status']) {

                if (config.debug.democracy)
                    console.log("democracy timedout " + id)

                info['status'] = 'timedout';
                f.end(id, 'timedout', null);
                demindex.set(id, info)

            }

        });

        setTimeout(function (_id) {
            demEvents.emit("democracy.timedout" + _id)
        }, this.timeout, id);

        demEvents.on("democracy.answer" + id, function (nodeName, answer) {

            if (config.debug.democracy)
                console.log("democracy answer from node " + nodeName, answer)

            var allconnections = (nodes.get("connections") || config[config.net].nodes).length;
            var allnodes = allconnections;
            var info = demindex.get(id) || {};

            if (!info['allconnected'])
                info['allconnected'] = allconnections + 1;

            if (!info['allnodes'])
                info['allnodes'] = allnodes;

            if (!info['done'])
                info['done'] = [];

            if (info['done'].indexOf(nodeName) === -1) {

                if (!info['answered'])
                    info['answered'] = 0;
                info['answered']++;

                info['done'].push(nodeName);

                if (!info['answers'])
                    info['answers'] = [];

                info['answers'].push(answer)
            }

            var persent = info['answered'] / info['allconnected'];

            if (config.debug.democracy)
                console.log("democracy percent " + (persent * 100) + "%", info['allconnected'] + " / " + info['answered'] + " / " + info['allnodes'])

            if (persent >= f.LINE && !info['status']) {
                info['status'] = 'reached';
                var balanced_value = false;
                if (type.indexOf("script.") != -1) {
                    try {
                        balanced_value = require('./balancing/' + type.replace("script.", ""))(info);
                    } catch (e) {
                        if (config.debug.democracy)
                            console.log("democracy not founded balancing script " + type)
                    }
                }

                info['balancing'] = balanced_value;
                f.end(id, 'reached', cb(info, balanced_value) || balanced_value);
            }

            demindex.set(id, info)

        })

        if (config.debug.democracy)
            console.log("democracy created " + id)

        protocol.sendAll('democracy.new', {
            id: id,
            type: type,
            params: params,
            sign: scriptSig
        });

        return id;
    },
    /**
     * When node reciving message democracy.new, need choose script and do answer
     */
    recived: function (rinfo, id, type, params) {
        //new question to all nodes, need answer

        if (config.debug.democracy)
            console.log("democracy recived question " + id)

        var result = this._exec(type, params);

        var hex = new Buffer(id + type + JSON.stringify(result));

        cf = new crypto(this.priv),
                sig = cf.ecdsa().sign(hex, new Buffer(this.priv, 'hex')),
                scriptSig = script.scriptSig(new Buffer(sig.toDER()), new Buffer(cf.private.getPublic(null, 'hex'), 'hex'));

        protocol.sendOne(rinfo, 'democracy.answer', {
            id: id,
            answer: result,
            sign: scriptSig,
            nodeName: protocol.getNodeName()
        });

    },
    end: function (id, reason, result) {

        var info = demindex.get(id) || {};
        if (config.debug.democracy)
            console.log("democracy ended " + id)

        protocol.sendAll('democracy.end', {
            id: id,
            reason: reason, //timedout or reached
            sign: scriptSig,
            result: result,
            type: this.type,
            details: {
                all: info['allconnected'],
                answered: info['answered'],
                persent: (info['answered'] / info['allconnected']) * 100
            }
        });

        this.status = reason;
        this.result = result;
        return true;
    },
    _exec: function (type, params) {

        var result = "";
        if (type.indexOf("script.") != -1) {
            try {
                result = require('../democracy/script/' + type.replace("script.", ""))(params);
            } catch (e) {
                if (config.debug.democracy)
                    console.log("democracy not founded script " + type)
            }
        } else {
            //todo text type and other 
        }

        return result;

    }
}

module.exports = democracy