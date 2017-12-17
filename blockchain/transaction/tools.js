/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var Tx = require('./transaction_new')
module.exports = {
    
    createFromJSON: function(json) {
        
        var t = new Tx();
        t.fromJSON(json);
        return t;
        
    }
    
}