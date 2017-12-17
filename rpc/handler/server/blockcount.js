var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');

module.exports = function (params) {
    return res({height: indexes.get('top').height || 0});
}