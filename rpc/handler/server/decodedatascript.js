var error = require('../../serror')
var res = require('../../res');
var dscript = require('orwelldb').datascript
var orwelldb = require('../../../blockchain/orwelldb');
var hash = require('../../../crypto/hash')

module.exports = function (params, cb) {
    var hex = params[0];
    var dbname = params[1];
    var scripts = [];

    if (!hex)
        return error(error.INVALID_PARAMS, 'hex is required');

    if (dbname) {
        try {
            dbname = hash.getPublicKeyHashByAddr(dbname).toString('hex');
        } catch (e) {//not valid base58 is catched

        }
    }

    if (dbname) {//if have dbname - check with keystore
        var arr = dscript.readArray(hex);
        next(0, arr);

        function next(index, a) {
            if (!a[index] && index >= a.length) {
                fine();
                return;
            }

            if (!a[index])
                return next(index + 1, a);

            var d = new dscript(a[index]);
            var res = d.toJSON();
            if (!res.canRead) {

                orwelldb(dbname)
                        .then(function (db) {
                            return db.getPem(d.dataset)
                        })
                        .then(function (item) {
                            if (item.pem) {
                                d = new dscript(a[index], item.pem, item.algorithm ? item.algorithm : 'rsa');
                                res = d.toJSON();
                            }

                            scripts.push(res);
                            next(index + 1, a);
                        })


            } else {
                scripts.push(res);
                next(index + 1, a);
            }
        }

        function fine() {

            cb(null, scripts)

        }

        return -1;

    } else {

        var a = dscript.readArray(hex);
        for (var i in a) {

            if (a[i]) {
                var d = new dscript(a[i]);
                scripts.push(d.toJSON());
            }
        }

        return res(scripts);
    }

}