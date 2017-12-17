var error = require('../../serror')
var res = require('../../res');
var diff = require('../../../blockchain/block/difficulty');

module.exports = function (params) {

    return res("0x" + Number(diff.bits()).toString(16));

}