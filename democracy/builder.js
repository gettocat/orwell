/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var democracy = require('./index')

var builder = function (pk, type, params, cb) {

    this.obj = new democracy(pk);
    this.id = this.obj.create(type, params, cb);


}

builder.prototype = {
    getId: function () {
        return this.id;
    },
    getStatus: function(){
        return this.obj.getStatus();
    },
    getResult: function() {
        return this.obj.result
    }
}

module.exports = builder;