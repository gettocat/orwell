var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var Transaction = require('../../../blockchain/transaction/transaction_new');
var diff = require('../../../blockchain/block/difficulty');
var time = require('../../../blockchain/block/time');
var config = require('../../../config');
var txindexes = require('../../../db/entity/tx/pool');
var merkle = require('../../../blockchain/merkle/tree');

module.exports = function (params) {
    console.log(params);
    var addr = params[0];
    var text = params[1];
    if (!addr) {
        return error(error.INVALID_PARAMS, "need coinbase addr to block template")
    } else {


        var list = [], fee = 0, txlist = [];
        var txs = txindexes.getOrderedList();
        for (var i in txs) {

            var tr = new Transaction();
            tr.fromJSON(txs[i]);
            txlist.push(tr);
            list.push(tr.toHex())
            fee += tr.getFee();

        }


        var t = new Transaction();
        var amount = diff.getBlockValue(fee, indexes.get('top').height + 1);
        t.fromCoinBase(text, addr, amount);

        var ids = [];
        ids.push(t.getId());
        //console.log(txlist);
        for (var i in txlist) {
            if (txlist[i]) {
                ids.push(txlist[i].getId())
            }
        }

        var hash = merkle.tree(ids);

        var obj = {
            "coinbasetxn": {
                "data": t.toHex()
            },
            "merkleRoot": hash,
            "previousblockhash": indexes.get('top').hash,
            //"transactions": list,
            //"expires": 120,
            "target": diff.bits2target(diff.bits()).toString('hex'),
            "difficulty": diff.difficulty(diff.bits()),
            "height": indexes.get('top').height + 1,
            "amount": amount,
            "version": config.blockchain.version,
            "curtime": time(),
            "bits": Number(diff.bits()).toString(16)
        };
        
        //if need
        obj.transactions = list;
        return res(obj)


    }
}