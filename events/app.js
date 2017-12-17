/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var appEvents = function () {

};

util.inherits(appEvents, EventEmitter);
var obj = null;

appEvents.prototype.exitHandler = function (exitCode) {
    if (exitCode != 0)
        this.emit("app.before.exit");
    if (exitCode != 0)
        console.log('orwell will stop in 5 seconds....');
    setTimeout(function () {
        if (exitCode != 0)
            console.log("bye-bye -('o_0)-/")
        process.exit(0);
    }, 5000);
}

module.exports = obj ? obj : obj = new appEvents();