/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

//deprecated, to delete
var storage = require('node-persist');

var db = {};
module.exports = function (path) {

    var connection = function (dbname, options) {

        this.dbname = dbname ? dbname : 'treedb';
        this.options = options;

        if (!db[this.dbname]) {
            db[this.dbname] = storage.create();
            
            var opts = {
                stringify: JSON.stringify,
                parse: JSON.parse,
                encoding: 'utf8',
                logging: false, // can also be custom logging function
                continuous: !this.options.inmemory, // continously persist to disk
                interval: (!this.options.inmemory ? 4000 : false),
                ttl: false,
                expiredInterval: 2 * 60 * 1000,
                forgiveParseErrors: false,
                dir: path + "/" + this.dbname,
            };
            
            db[this.dbname].initSync(opts);
            
        }

    }

    connection.prototype = {
        get: function (name) {
            return db[name]
        },
        //setter and getter need to be sync only for !inmemory
    }

    return connection;

}