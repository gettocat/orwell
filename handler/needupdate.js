/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var indexes = require('../db/entity/block/indexes')
var chainEvents = require('../events/chain')

module.exports = function (opts, self) {

    
    if (opts.lastblock.height > indexes.get('top').height){
        chainEvents.emit("chain.update.need", this.rinfo);
    }
   
}