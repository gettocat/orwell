var consensus = require('../../../democracy/consensus')

module.exports = function (params, cb) {

    consensus(function (info) {
        cb(null, info);
    });
    
    
    return -1;

}