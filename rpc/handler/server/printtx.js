var error = require('../../serror')
var res = require('../../res');
var Script = require('../../../blockchain/script/script')
var Transaction = require('../../../blockchain/transaction/transaction_new')
var h = require('../../../crypto/hash')
var config = require('../../../config')
var dscript = require('orwelldb').datascript

module.exports = function (params) {
    var hash = params[0];
    var returnRawData = params[1];

    if (!hash) {
        return error(error.INVALID_PARAMS, "need one or more hashes")
    } else {

        var bchain = require('../../../blockchain/index')
        var blockchain = new bchain();
        try {
            var tx = blockchain.getTx(hash);
        } catch (e) {
            console.log(e)
            var tx = null
        }


        if (!tx) {//search in mempool

            var pool = require('../../../db/entity/tx/pool')
            tx = pool.get(hash);

            if (tx)
                tx.fromMemoryPool = true;
        }

        if (!tx)
            return error(error.INVALID_RESULT, 'havent tx with this hash');


        tx.commonInput = 0;

        var blockchain = new bchain();
        for (var i in tx.in) {
            if (tx.coinbase) {
                tx.in[i].coinbase = true;
                tx.in[i].coinbaseText = new Buffer(tx.in[i].scriptSig, 'hex').toString();
            } else {
                var a = Script.sigToArray(tx.in[i].scriptSig);
                tx.in[i].der = a[0];
                tx.in[i].publicKey = a[1];
                tx.in[i].fromAddress = h.generateAddres(a[1]);
                tx.in[i].sequenceHex = "0x" + Number(tx.in[i].sequence).toString(16);

                var out = blockchain.getOut(tx.in[i].hash, tx.in[i].index);
                if (out)
                    tx.commonInput += out.amount / config.blockchain.satoshicoin;

            }
        }

        tx.commonOut = 0;
        for (var i in tx.out) {
            tx.out[i].amountOrwl = tx.out[i].amount / config.blockchain.satoshicoin;
            tx.commonOut += tx.out[i].amountOrwl;
        }

        if (returnRawData)
            tx.dslist = [];
        
        if (tx.coinbase)
            tx.commonInput = tx.commonOut;

        tx.dataScriptContent = [];
        if (tx.datascript) {
            var list = [];
            var a = dscript.readArray(tx.datascript);
            for (var i in a) {
                if (returnRawData)
                    tx.dslist.push(a[0])
                var d = new dscript(a[i]);
                list.push(d.toJSON())
            }

            tx.dataScriptContent = list;
        }

        if (returnRawData) {
            var tx_ = new Transaction();
            tx_.fromJSON(tx);
            tx.hex = tx_.toHex();
        }

        tx.feeOrwl = tx.fee / config.blockchain.satoshicoin;

        return res(tx);
    }
}