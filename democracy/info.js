/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

module.export = {
    events: {},
    add: function (name, eventemitter) {
        module.exports.events[name] = eventemitter;
    },
    remove: function (name, eventemitter) {
        module.exports.events[name].emit("remove");
        module.exports.events[name] = null;
    },
    solve: function (name) {
        module.exports.events[name].emit("solve");
    }

}