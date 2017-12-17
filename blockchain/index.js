/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var bitPony = require('bitpony');
var pool = require('../db/entity/block/pool')
var genesis = require('./block/genesis')
var chainEvents = require('../events/chain')
var indexes = null, txindexes = null
var Block = require('../blockchain/block/block')
var config = require('../config')
var Script = require('../blockchain/script/script')

var blockchain = function (act) {
    this.action = act || 'seek';//seek, sync
    this.db = new pool()
    indexes = require('../db/entity/block/indexes');
}

blockchain.prototype = {
    action: '',
    db: null,
    getTx: function (hash) {
        var txk = indexes.get("tx/" + hash);

        if (txk) {

            var b = this.getBlock(txk.block);
            var tx = b.tx[txk.index];
            tx.confirmation = indexes.get('top').height - b.height + 1;
            tx.fromBlock = b.hash;
            tx.fromIndex = txk.index;
            tx.time = b.time;
            return tx;

        } else {
            throw new Error('can not find tx ' + hash);
            //do inv with this hash
            return null;
        }

    },
    getOut: function (hash, index) {
        var tx = this.getTx(hash);
        return tx.out[index]
    },
    addOutIndex: function (type, tx, addr, amount, events) {
        if (config.debug.blockchain.indexing)
            console.log("add index " + addr, tx, amount)
        var addrind = indexes.get("address/" + addr);
        if (!addrind || !(addrind instanceof Array))
            addrind = [];

        var obj = {
            type: type, //input||output
            tx: tx,
            amount: amount
        };
        addrind.push(obj);

        if (events) {
            obj.address = addr;
            chainEvents.emit("chain.event.address", obj)
        }

        indexes.set("address/" + addr, addrind)
        return addrind
    },
    index: function (b, height, events) {
        //indexes.set(b.hash, b);

        for (var i in b.vtx) {
            var tx = b.vtx[i].toJSON();
            indexes.set("tx/" + tx.hash, {block: b.hash, index: i});
            if (tx.hash) {

                var utxo = require('../db/entity/tx/utxo')
                utxo.setContext(indexes.getContext())
                utxo.addTx(tx);
                utxo.setContext(null);

                if (i != 0 && tx.coinbase)
                    throw new Error('coinbase tx can not be not first in list of block tx');//resync or maybe something like this

                if (i == 0 && tx.coinbase) {//so.. havent inputs
                    var out = tx.out[0];
                    this.addOutIndex('input', tx.hash, out.addr, out.amount, events);

                } else {


                    for (var o in tx.out) {
                        var out = tx.out[o];
                        this.addOutIndex('input', tx.hash, out.addr, out.amount, events);
                    }

                    for (var inp in tx.in) {
                        var inpt = tx.in[inp];
                        var prevout = this.getOut(inpt.hash, inpt.index);
                        this.addOutIndex('output', tx.hash, prevout.addr, prevout.amount, events);
                    }

                    if (tx.datascript) {
                        this.addDSIndex(tx.hash, tx.out[0], events)
                    }

                    var mempool = require('../db/entity/tx/pool')
                    mempool.removeTx(tx.hash)
                }


            }
        }

        indexes.set("index/" + height, b.hash);
        indexes.set("time/" + b.hash, b.time);
        indexes.set("block/" + b.hash, {
            prev: b.prev_block || b.hashPrevBlock,
            height: height
        });
    },
    getDatascriptList: function (dbname, raw, byDataset) {
        var addrind = indexes.get("ds/address/" + dbname);
        if (!addrind)
            addrind = [];

        if (raw) {
            txindexes = require('../db/entity/tx/pool');
            var uncomfaddrind = txindexes.get("ds/address/" + dbname);
            if (!uncomfaddrind)
                uncomfaddrind = [];

            for (var i in uncomfaddrind) {//add to end of confirmed ds index - uncpmfirmed operations.
                addrind.push(uncomfaddrind[i]);
            }
        }

        var dscript = require('orwelldb').datascript;
        if (byDataset)
            var dslist = {};
        else
            var dslist = [];

        for (var i in addrind) {
            var tx = null;
            try {
                tx = this.getTx(addrind[i]);
            } catch (e) {
                //this tx from mempool 
                if (raw)
                    tx = txindexes.get(addrind[i]);
            }

            if (!tx)
                continue;//its fiasco

            if (!tx.datascript)
                continue;//how,why?

            if (tx.coinbase)
                continue;//can not be coinbase

            var h = Script.sigToArray(tx.in[0].scriptSig);
            var publicKey = h[1];

            if (byDataset && !raw) {
                var list = dscript.readArray(tx.datascript);
                for (var k in list) {
                    var data = new dscript(list[k]).toJSON();
                    data.writer = publicKey;
                    if (!dslist[data.dataset])
                        dslist[data.dataset] = [];
                    dslist[data.dataset].push(data);
                }

            } else if (!byDataset && !raw) {
                var list = dscript.readArray(tx.datascript);
                for (var k in list) {
                    var data = new dscript(list[k]).toJSON();
                    data.writer = publicKey;
                    dslist.push(data);
                }
            }

            if (raw)
                dslist.push({ds: tx.datascript, writer: publicKey})

        }

        return dslist;
    },
    getDatascriptSlice: function (dbname, dataset, limit, offset) {
        var addrind = indexes.get("ds/address/" + dbname);
        if (!addrind)
            addrind = [];

        var dscript = require('orwelldb').datascript;
        var dslist = [], actual = {}, create = {};

        for (var i in addrind) {

            var tx = this.getTx(addrind[i]);
            if (!tx.datascript)
                continue;//how,why?

            if (tx.coinbase)
                continue;//can not be coinbase

            var h = Script.sigToArray(tx.in[0].scriptSig);
            var publicKey = h[1];

            var list = dscript.readArray(tx.datascript);
            for (var k in list) {
                var data = new dscript(list[k]).toJSON();

                if (data.dataset != dataset)
                    continue;

                if (data.operator == 'create')
                    create = data;

                if (data.operator == 'create' || data.operator == 'settings')
                    actual = data;

                data.writer = publicKey;
                dslist.push(data);
            }
        }

        if (actual.content && create.content)
            if (!actual.content.owner_key)
                actual.content.owner_key = create.content.owner_key;

        var items = dslist.slice(offset, offset + limit);
        return {
            actualSettings: actual,
            limit: limit,
            offset: offset,
            count: dslist.length,
            items: items.length,
            list: items
        }
    },
    getDataSets: function (dbname) {
        var addrind = indexes.get("ds/address/" + dbname);
        if (!addrind)
            addrind = [];

        var dscript = require('orwelldb').datascript;
        var dslist = [];

        for (var i in addrind) {

            var tx = this.getTx(addrind[i]);
            if (!tx.datascript)
                continue;//how,why?

            if (tx.coinbase)
                continue;//can not be coinbase

            var h = Script.sigToArray(tx.in[0].scriptSig);
            var publicKey = h[1];

            var list = dscript.readArray(tx.datascript);
            for (var k in list) {
                var data = new dscript(list[k]).toJSON();

                if (data.operator != 'create')
                    continue;

                data.writer = publicKey;
                dslist.push(data);
            }


        }

        return dslist;
    },
    getDatabases: function (limit, offset) {
        var arr = indexes.getAllDSAddresses();
        if (!arr || !(arr instanceof Array))
            arr = []

        var items = arr.slice(offset, offset + limit);
        return{
            limit: limit,
            offset: offset,
            count: arr.length,
            items: items.length,
            list: items
        }
    },
    addDSIndex: function (txid, out, events) {
        out.address = Script.scriptToAddr(out.scriptPubKey);
        out.addrHash = Script.scriptToAddrHash(out.scriptPubKey).toString('hex');

        if (config.debug.blockchain.indexing)
            console.log("add ds index " + out.addrHash, txid)
        var addrind = indexes.get("ds/address/" + out.addrHash);
        if (!addrind || !(addrind instanceof Array))
            addrind = [];

        addrind.push(txid);

        if (events) {
            chainEvents.emit("chain.event.ds", {
                address: out.addrHash,
                txid: txid
            })
        }

        indexes.set("ds/address/" + out.addrHash, addrind)
        return addrind
    },
    indexBlocks: function (blocks) {
        var last = 0, dbheight = 0, m = 0, commonCnt = blocks.length, synced = false;

        if (config.debug.blockchain.indexing)
            console.log("blockchain indexing: started");

        try {
            if (indexes.get('top').hash == blocks[blocks.length - 1].hash)
                synced = true;
        } catch (e) {
            console.log(e);
        }

        if (synced) {
            if (config.debug.blockchain.indexing)
                console.log("blockchain indexing: already synced");
        } else {
            for (var i in blocks) {
                var b = blocks[i];

                if (!b)
                    continue;

                if (!(b instanceof Block)) {
                    var b1 = new Block();
                    b = b1.fromJSON(b);
                }

                if (config.debug.blockchain.indexing && m % 10 == 0)
                    console.log("blockchain indexing: " + (parseInt((m / commonCnt) * 100)) + "%");

                indexes.setContext(dbheight);
                this.index(b, dbheight, false);
                indexes.setContext(null);

                //todo add txHash -> block hash to find tx fast
                last = b.hash;
                dbheight++;
                m++;
            }

            if (config.debug.blockchain.indexing)
                console.log("blockchain indexing: done. head block: " + last + ", height: " + (dbheight - 1));

            indexes.updateTop({
                hash: last,
                height: dbheight - 1,
            })
        }
    },
    getBlock: function (hash) {
        var block = this.db.getBlock(hash)
        if (block.hash) {
            delete block.meta
            delete block.$loki;
            block.confirmation = indexes.get('top').height - block.height + 1;
        }

        return block;
    },
    hardReIndexing: function () {
        if (config.debug.blockchain.indexing)
            console.log("hardresync indexes, close db");
        var f = this;
        indexes.deleteDB()
                .then(function () {
                    if (config.debug.blockchain.indexing)
                        console.log("hardresync indexes, open db, resync");
                    f.sync();
                })
    },
    replaceBlock: function (height, hash, replaceblock) {

        try {
            var block = this.getBlock(hash);
            this.db.removeBlock(block);
            //remove index for this height
            replaceblock.height = height;
            this.db.save(replaceblock);
            this.db.saveDb();

            indexes.setContext(height);
            //index this block (for sync new chain only, next - reindex all blockchain)
            var b = new Block();
            b.fromJSON(replaceblock);

            this.index(b, height, false);
            indexes.setContext(null);

        } catch (e) {
            console.log(e)
        }
    },
    getChilds: function (hash) {
        return this.db.findBlocks({prev_block: hash});
    },
    bestChain: function () {

        var top = indexes.get('top').hash;
        var gen = genesis().hash;
        var hash = top, chain = [];
        while (hash != gen) {
            chain.push(hash);
            hash = indexes.get("block/" + hash).prev;
        }
        return chain;
    },
    sync: function () {
        chainEvents.emit("chain.localsync.start");

        this.resync();

        chainEvents.emit("chain.localsync.end", {
            topblock: indexes.get('top'),
        });
    },
    resync: function () {
        var commonCnt = this.db.blockCount(), m = 0;

        if (config.debug.blockchain.sync)
            console.log("blockchain local sync: finded " + commonCnt + " records, reading:");


        var offset = 0, cnt = 1000, arr = [], blocks = []
        do {
            arr = [];
            arr = this.db.loadBlocks(commonCnt);//asc//todo, fix limit,offset
            for (var i in arr) {
                if (arr[i]) {
                    var b = new Block();
                    b.fromJSON(arr[i])
                    blocks.push(b);
                    m++;

                    if (config.debug.blockchain.sync && m % 100 == 0)
                        console.log("blockchain local sync: " + (parseInt((m / commonCnt) * 100)) + "%");
                }
            }


            offset += 1000;
        } while (!1)//arr.length

        if (config.debug.blockchain.sync)
            console.log("blockchain local sync: 100%");

        if (!Object.keys(blocks).length) {
            var gen = genesis();
            var b = this.db.get(gen.hash);
            if (!b || !b.hash) {
                indexes.updateTop({hash: gen.hash, height: 0});
                gen.height = 0;
                gen.genesis = 1;
                blocks.push(gen);
                this.appendBlock(gen, 1);
            }
        }


        this.indexBlocks(blocks);
    },
    appendBlock: function (block, isgenesis, cb) {
        if (!block instanceof Block)
            throw new Error('block object must be instanceof Block class to appending in Blockchain');

        var b = false;
        try {
            b = this.getBlock(block.hash);
            block.validation_erros = [];
            block.validation_erros.push('duplicate');
        } catch (e) {

        }
        if (b && b.hash) {
            if (cb instanceof Function)
                cb(block, 1, 1);
            return;
            //throw new Error('block ' + block.hash + ' already exist');
        }

        var prevblockinfo = indexes.get("block/" + block.hashPrevBlock);

        var blockvalid = block.isValid()

        if (block.hash == genesis().hash)
            isgenesis = 1;


        var inMainChain = 0;
        if (blockvalid && !isgenesis) {
            var top = indexes.get('top').hash;


            this.index(block, prevblockinfo.height + 1, this.action == 'seek');

            block.height = prevblockinfo.height + 1;
            if (block.hashPrevBlock == top) {
                indexes.updateTop({
                    hash: block.hash,
                    height: prevblockinfo.height + 1
                });

            }

            inMainChain = 1;
            this.db.save(block.toJSON());
        } else if (isgenesis) {

            indexes.setContext(0)
            this.index(block, 0, false);
            indexes.setContext(null)

            indexes.updateTop({
                hash: block.hash,
                height: 0
            });


            inMainChain = 1;
            this.db.save(block.toJSON());
        }

        if (cb instanceof Function)
            cb(block, 0, inMainChain);
    },
    appendBlockFromJSON: function (json, cb) {
        var b = new Block();
        b.fromJSON(json);
        return this.appendBlock(b, false, cb);
    },
    findBlockHeaders: function (hashto) {
        var makeHash = function (hash) {

            try {
                blockinfo = this.getBlock(hash);
                return bitPony.header.write(
                        blockinfo.ver,
                        blockinfo.prev_block,
                        blockinfo.mrkl_root,
                        blockinfo.time,
                        blockinfo.bits,
                        blockinfo.nonce).toString('hex');
            } catch (e) {

            }

            return "";

        }

        var ghash = genesis().getHash();

        var isExistBlockInChain = 0;

        var existHash = null;
        try {
            existHash = this.getBlock(hashto);
        } catch (e) {

        }
        if (existHash && existHash.hash)
            isExistBlockInChain = 1;

        var hash = indexes.get('top').hash;
        var arr = [];
        arr.unshift(makeHash.apply(this, [hash]));
        if (isExistBlockInChain)
            do {
                var p = indexes.get("block/" + hash);
                if (!p && !p.prev)
                    hash1 = this.getBlock(hash).hashPrevBlock
                else
                    hash1 = p.prev;

                arr.unshift(makeHash.apply(this, [hash1]));
                hash = hash1
            } while (hash != hashto && hash != ghash);

        return arr;

    },
    findLastBlocks: function (count, offset) {
        return this.db.getLastBlocks(count, offset);
    },
    findPreviousBlocks: function (from, count) {
        //and from too;
        if (!count)
            count = 1;
        var list = [], i = 0, block = null;
        try {
            do {
                if (block)
                    list.push(block);

                var prev = from;
                if (block)
                    prev = block.hashPrevBlock || block.prev_block;
                block = this.getBlock(prev);

                if (from)
                    from = null
            } while (i++ < count && block.hash);
        } catch (e) {
            console.log(e);
        }

        return list;
    },
    getCount: function () {
        return this.db.blockCount();
    },
    containInBloom: function (blockJson, filter) {
        var targets = [],  txcount = blockJson.tx.length;
        var Tx = require('./transaction/transaction_new')
        //check all data in block - for filter
        //tx hash, tx.out scriptPubKey, tx.in.scriptSig
        for (var k in blockJson.tx) {
            if (Tx.checkTxFilter(blockJson.tx[k], filter)) 
                targets.push({hash: blockJson.tx[k].hash, index: parseInt(k)});
        }

        if (!targets.length)
            return null;

        //some another algorith then bitcoin BIP 034
        var merkle = require('./merkle/tree')
        blockJson.total_transactions = txcount;
        blockJson.proofs = [];
        blockJson.flags = [];

        //for each target we create index, and push info in three arrays (flags, proofs). Target hash is first in all cases in struct: proofs.
        for (var i in targets) {
            var proof = merkle.getProof(blockJson, targets[i].index);
            var proof_hashes = [], proof_flags = [];
            for (var k in proof) {
                if (proof[k].right) {//right = 0, left = 1
                    proof_flags.push(0);
                    proof_hashes.push(proof[k].right)
                } else {
                    proof_flags.push(1);
                    proof_hashes.push(proof[k].left)
                }
            }

            //now we have proof_hashes, proof_flags (bit array). We can make join!
            proof_hashes.unshift(targets[i].hash);
            blockJson.proofs.push(proof_hashes);
            blockJson.flags.push(parseInt(proof_flags.reverse().join(""), 2))
        }

        delete blockJson.tx;
        return blockJson;
    }
}

module.exports = blockchain