var error = require('../../serror')
var res = require('../../res');
var protocol = require('../../../network/protocol');

module.exports = function (params) {
    var nodeaddr = params[0];
    var port = params[1];

    if (port)
        nodeaddr += "//" + port;

    protocol.initNode(nodeaddr)
    return res(true);
}