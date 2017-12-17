var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');

module.exports = function (params) {
    var hash = params;

    if (!hash) {
        return error(error.INVALID_PARAMS, "need one or more hashes")
    } else {
        
        var bchain = require('../../../blockchain/index')
        var blockchain = new bchain();
        var tx = blockchain.getTx(hash);
        
        if (tx)
            tx = tx.toJSON();
        
        if (!tx){//search in mempool
            
            var pool = require('../../../db/entity/tx/pool')
            tx = pool.get(hash);
            
            if (tx)
                tx.fromMemoryPool = true;
        }
        
        if (!tx)
            return error(error.INVALID_RESULT, 'havent tx with this hash');
        
        return res(tx);
    }
}