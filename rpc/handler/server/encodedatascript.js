var error = require('../../serror')
var res = require('../../res');
var dscript = require('orwelldb').datascript
var orwelldb = require('../../../blockchain/orwelldb');
var hash = require('../../../crypto/hash')

module.exports = function (params, cb) {
    var json_array = params[0];//[{operation: 'create', dataset: '...', content: ....}, {operation: 'write', dataset: '...', content: ...}, ....]
    var dbname = params[1];

    if (!json_array)
        return error(error.INVALID_PARAMS, 'json array is required');

    var arr = [];
    try {
        arr = JSON.parse(json_array);
    } catch (e) {
        try {
            var base64 = new Buffer(json_array, 'base64').toString('utf8');
            arr = JSON.parse(base64)
        } catch (e) {
            return error(error.INVALID_PARAMS, 'json array is not vaild json')
        }
    }

    if (!(arr instanceof Array) || !arr.length)
        return error(error.INVALID_PARAMS, 'only array is accepted');

    console.log("dbname", dbname);

    if (dbname) {
        try {
            dbname = hash.getPublicKeyHashByAddr(dbname).toString('hex');
        } catch (e) {//not valid base58 is catched

        }
    }

    if (dbname) {//if have dbname - check with keystore
        var list = [];
        next(0, arr);

        function next(index, a) {
            if (!a[index] && index >= a.length) {
                fine();
                return;
            }

            if (!a[index])
                return next(index + 1, a);

            orwelldb(dbname)
                    .then(function (db) {
                        return db.getPem(a[index].dataset)
                    })
                    .then(function (item) {
                        console.log('pem', item);
                        if (item.pem) {
                            a[index].algorithm = item.algorithm;//its a bug of orwelldb.
                            d = new dscript(a[index], item.pem, item.algorithm ? item.algorithm : 'rsa');
                        } else {
                            d = new dscript(a[index]);
                        }


                        res = d.toHEX();
                        list.push(res);
                        next(index + 1, a);
                    })
                    .catch(function (e) {
                        console.log('err', e)
                    })

        }

        function fine() {

            cb(null, dscript.writeArray(list))

        }

        return -1;

    } else {

        var list = [];
        for (var i in arr) {

            if (arr[i]) {
                var d = new dscript(arr[i]);
                list.push(d.toHEX());
            }
        }

        return res(dscript.writeArray(list));
    }

}