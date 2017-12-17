var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');

module.exports = function (params) {
    if (!parseInt(params[0])) 
        return error(error.INVALID_PARAMS, "index must be a number")
    
    return res(indexes.get("index/"+params[0]));
}