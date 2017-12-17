var error = require('../../serror')
var res = require('../../res');
var democracy = require('../../../democracy/builder');
var demCache = require('../../../db/entity/democracy/index')

module.exports = function (params) {

    if (!params[0]) {
        return error(error.INVALID_PARAMS, "need type of question")
    } else {
        var d = new democracy(global.config['privateKey'], params[0], params[1] ? JSON.parse(params[1]) : [], function (info, default_balancing) {
            //info.balancing = default_balancing;
            //console.log(JSON.stringify(info));
        })

        return res(d.getId());
    }
}