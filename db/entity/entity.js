/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var dbconnection = require('../../db/index').storage;

var entity = function (name) {
    this.name = name;
    this.init();
}

entity.prototype = {
    name: '',
    class: null,
    db: null, coll: null,
    init: function () {
        if (!this.db || !this.coll) {
            var dbconn = new dbconnection(this.name);
            var db = dbconn.get()
            var coll = db.gc(this.name);
            this.db = db;
            this.coll = coll;
        }


    },
    save: function (tx) {

        this.coll.insert(tx);
        return true;

    },
    get: function (hash) {
        var obj = this.coll.findOne({'hash': hash});
        return obj

    },
    remove: function (hash) {
        var obj = this.coll.findOne({hash: hash});
        this.coll.remove(obj);
        return true;
    },
    load: function (limit, offset, sortby) {

        if (!limit)
            limit = 1000

        if (!offset)
            offset = 0;

        var res = this.coll.chain().find().limit(limit).offset(offset);

        if (sortby)
            res = res.simplesort(sortby[0], !!sortby[1]);

        return res.data();

    },
    count: function () {
        return this.coll.chain().find().count();
    },
    getCollection: function () {
        return this.coll;
    },
    getDB: function () {
        return this.db
    },
    saveDb: function () {
        this.db.saveDatabase();
    }


}

module.exports = entity;