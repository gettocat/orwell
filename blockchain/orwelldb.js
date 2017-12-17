/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var cnf1 = require('../tools/config');
var config = require('../config');
var orwell = require('orwelldb');
var $ = orwell.$;

var cache = {};

var getConfig = function (databasename, public_key) {
    if (!cache[databasename]) {
        var cnf = config.orwelldb;
        cnf.name = databasename;
        cnf.public_key = public_key;
        cnf.path = cnf.path.replace("%home%", cnf1.getLocalHomePath())
        cnf1.initDir(cnf.path);
        cache[databasename] = cnf;
    }

    return cache[databasename];
}

var db = function (databasename, public_key) {
    var cnf = getConfig(databasename, public_key)
    return $(cnf);
}

db.import = function (databasename, public_key, hex) {
    var cnf = getConfig(databasename, public_key)
    return orwell.import(cnf, hex);
}

db.export = function (databasename, public_key, cb) {
    var cnf = getConfig(databasename, public_key)
    return orwell.export(cnf, cb);
}

db.syncdb = function (dbname) {

    return new Promise(function (resolve) {

        var bchain = require('./index')
        var blockchain = new bchain();
        var arr = blockchain.getDatascriptList(dbname, true);

        var next = function (index, a) {
            if (!a[index] && a.length >= index)
                return done();

            db.import(dbname, a[index].writer, a[index].ds)
                    .then(function () {
                        next(index + 1, a);
                    })
                    .catch(function (e) {
                        next(index + 1, a)
                    })

        }

        var done = function () {
            resolve();
        }

        next(0, arr)

    });


}


module.exports = db