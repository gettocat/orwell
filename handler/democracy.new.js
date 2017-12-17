/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var demEvents = require('../events/democracy')
var democracy = require('../democracy/index')

module.exports = function (opts, self) {

    var d = new democracy(global.config['privateKey']);
    //todo check sig opts.sign 
    d.recived(this.rinfo, opts.id, opts.type, opts.params)
    
    return {};
}