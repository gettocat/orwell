var error = require('../../serror')
var res = require('../../res');
var indexes = require('../../../db/entity/block/indexes');
var Transaction = require('../../../blockchain/transaction/transaction_new');
var diff = require('../../../blockchain/block/difficulty');
var time = require('../../../blockchain/block/time');
var config = require('../../../config');
var txindexes = require('../../../db/entity/tx/pool');
var merkle = require('../../../blockchain/merkle/tree');
var miningworks = require('../../../db/entity/block/mining')

module.exports = function (params) {

    var top = indexes.get('top'), bits = diff.bits();
    var txs = txindexes.getOrderedList();
    var workid = miningworks.createWorkId(top.hash, top.height, bits, txs.length);
    var work = miningworks.get(workid);
    console.log(workid, work.workid ? 'hit' : 'miss')
    if (work.workid)
        return res(work);

    var list = [], fee = 0, txlist = [];
    for (var i in txs) {

        var tr = new Transaction();
        tr.fromJSON(txs[i]);
        txlist.push(tr);
        var data = tr.toHex(), hash = tr.getHash(), f = tr.getFee();
        list.push({
            data: data,
            txid: hash,
            hash: hash,
            depends: [],
            fee: f,
            sigops: 0,
            weight: 0
        });

        fee += f;

    }

    var amount = diff.getBlockValue(fee, top.height + 1);

    var work = {
        capabilities: [],
        version: config.blockchain.version,
        rules: [],
        previousblockhash: top.hash,
        coinbaseaux: {flags: ""},
        coinbasevalue: amount,
        target: diff.bits2target(bits).toString('hex'),
        mintime: parseInt(new Date().getTime() / 1000 - 3600),
        noncerange: "00000000ffffffff",
        sigoplimit: config.blockchain.max_block_sigops,
        sizelimit: config.blockchain.block_size,
        weightlimit: 4000000,
        curtime: parseInt(new Date().getTime() / 1000),
        bits: typeof bits != 'string' ? parseInt(bits).toString(16) : bits,
        mutable: [
            "time",
            "transactions",
            "prevblock"
        ],
        height: top.height + 1,
        transactions: list,
        workid: workid
    };
    
    console.log(work);

    miningworks.set(workid, work);
    return res(work);

}