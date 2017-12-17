/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/


var appEvents = require('./events/app')
var listeners = require('./events/listeners/index')
//var genesis = require('./blockchain/block/genesis')


new listeners();



appEvents.emit("app.started");