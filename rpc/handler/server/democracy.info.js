var error = require('../../serror')
var res = require('../../res');
var demCache = require('../../../db/entity/democracy/index')

module.exports = function (params) {

    if (!params[0]) {
        return error(error.INVALID_PARAMS, "need id of question")
    } else {
        var info = demCache.get(params[0]);
        
        if (!info)
            return error(error.INVALID_PARAMS, "question with this id not founded")

        return res(info);
    }
}