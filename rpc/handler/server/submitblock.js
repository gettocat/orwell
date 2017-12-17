var error = require('../../serror')
var res = require('../../res');
var Block = require('../../../blockchain/block/block')
var miningworks = require('../../../db/entity/block/mining')
var indexes = require('../../../db/entity/block/indexes')

module.exports = function (params, cb) {
    var id = null;
    var b = new Block();

    console.log(params);

    var blockhex = params[0], workid = params[1];
    if (blockhex) {

        //if block vaild and work id exist - remove block id
        b.fromHex(blockhex);
        var bchain = require('../../../blockchain/index');
        var blockchain = new bchain();

        try {
            b.height = indexes.get('top').height + 1;
            blockchain.appendBlock(b, false, function (block) {
                //send to all
                console.log("added new block ", block.hash);
                if (workid)
                    miningworks.remove(workid);

                if (block.validation_erros.length == 0) {
                    block.send();
                    cb(null, [])
                } else {
                    cb(null, block.validation_erros[0]);
                }
            });
        } catch (e) {
            //already have this tx or not valid data
            console.log('block already exist', e)
            return error(error.INVALID_PARAMS, 'block already exist')
        }

        return -1;
    } else {
        return error(error.INVALID_PARAMS, 'invalid block hex')
    }

}