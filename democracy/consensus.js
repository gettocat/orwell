/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var democracy = require('./builder')

module.exports = function (cb) {

    new democracy(global.config['privateKey'], "script.consensus", [], function (info, default_balancing) {
        cb(default_balancing)
    })

}