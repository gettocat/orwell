var config = require('../config');
var fs = require('fs')

var handle = function (name, params, cb) {


    if (!params)
        params = [];
    if (config.debug.rpc)
        console.log("handled " + name)
    var error, result;
    var res = require('./handler/server/' + name)(params, cb)

    // error = {code: -32602, message: "Invalid params"};

    if (res != -1) {
        if (!res)
            res = [];
        //error = res[0];
        //result = res[1];

        cb.apply(null, res);
    }
}

handle.getAllMethods = function () {

    try {
        var list = fs.readdirSync(__dirname + "/handler/server");
    } catch (e) {
        var list = [];//cant read directory if exec from binary file. its okay.
    }
    
    var arr = [];
    for (var i in list) {
        if (list[i] == "." || list[i] == '..')
            continue;
        arr.push(list[i].replace(".js", "").trim())
    }

    return arr;

}

module.exports = handle
