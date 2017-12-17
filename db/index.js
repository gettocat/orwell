/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var cnf = require('../tools/config');
module.exports = {
    storage: require('./storage')(cnf.getLocalHomePath()),
}