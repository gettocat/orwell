var res = require('../../res');
var diff = require('../../../blockchain/block/difficulty');

module.exports = function (params) {
    return res(diff.difficulty(diff.bits()));
}