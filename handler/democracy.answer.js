/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var demEvents = require('../events/democracy')
var democracy = require('../democracy/index')

module.exports = function (opts, self) {

    //todo check sig opts.sign 
    demEvents.emit("democracy.answer" + opts.id, opts.nodeName, opts.answer)

    return {};
}