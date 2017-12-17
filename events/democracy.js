/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var democracyEvents = function () {

};

util.inherits(democracyEvents, EventEmitter);
var obj = null;

module.exports = obj ? obj : obj = new democracyEvents();