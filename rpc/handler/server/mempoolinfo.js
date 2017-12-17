var error = require('../../serror')
var res = require('../../res');
var txindexes = require('../../../db/entity/tx/pool');

module.exports = function (params) {

    var list = txindexes.getList(), arr = [];
    for (var i in list) {
        var time = txindexes.get("time/"+list[i]);
        arr.push({time: time, hash: list[i]});
    }
    return res(arr);

}