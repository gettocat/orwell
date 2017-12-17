var error = require('../../serror')
var res = require('../../res');
var Block = require('../../../blockchain/block/block')


module.exports = function (params, cb) {
    var id = null;
    var b = new Block();

    var json = params[0] || "{}";
    var data = JSON.parse(json);

    if (!data.hash)
        return error(error.INVALID_PARAMS, 'invalid block')

    b.fromJSON(data);


    var bchain = require('../../../blockchain/index');
    var blockchain = new bchain();

    try {
        blockchain.appendBlock(b, false, function (block) {
            //send to all
            console.log("added new block ", block.hash);
            if (!block.validation_erros.length) {
                block.send();
                cb({})
            } else
                cb({error: block.validation_erros.join(","), code: error.INVALID_RESULT}, null)

        });
    } catch (e) {
        //already have this tx or not valid data
        console.log('block already exist', e)
        cb({error: 'block already exist', code: error.INVALID_PARAMS}, null)
    }

    return -1

}