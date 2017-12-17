/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var keyvalconnection = require('../index').keyval;

var keyvalentity = function (name, options) {
    if (name)
        this.name = name;
    if (options)
        this.options = options;
}

keyvalentity.prototype = {
    inmemory: false,
    init: function () {
        var kb = new keyvalconnection(this.name, this.options || {inmemory: !!this.inmemory});
        this.db = kb.get(this.name)
    },
    get: function (key) {
        return this.db.getItemSync(this.name + "/" + key);
    },
    set: function (key, val) {
        if (!this.inmemory)
            return this.db.setItem(this.name + "/" + key, val);
        else
            return this.db.setItemSync(this.name + "/" + key, val);
    },
    remove: function (key) {
        return this.db.removeItemSync(this.name + "/" + key);
    }
}

module.exports = keyvalentity;