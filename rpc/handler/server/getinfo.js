var res = require('../../res');
var diff = require('../../../blockchain/block/difficulty');
var config = require('../../../config')
var wallet = require('../../../wallet/index')
var nodes = require('../../../db/entity/network/nodes')
var txindexes = require('../../../db/entity/tx/pool')

module.exports = function (params) {
    var bchain = require('../../../blockchain/index')
    var blockchain = new bchain();

    return res({
        "version": config.blockchain.version,
        "protocolversion": config.blockchain.version,
        "walletversion": config.agent_version,
        "balance": wallet.getBalance(0),
        "blocks": blockchain.getCount(),
        "timeoffset": 0,
        "connections": nodes.get("connections").length,
        "proxy": "",
        "difficulty": diff.difficulty(diff.bits()),
        "testnet": config.net == 'testnet',
        "keypoololdest": txindexes.getOldest(),
        "keypoolsize": txindexes.getCount(),
        "paytxfee": wallet.fee,
        "datasetfee": config.wallet.operationfee
    }
    );
}
