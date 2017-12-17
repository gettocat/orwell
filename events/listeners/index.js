/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var bitpony = require('bitpony')
var networkEvents = require('../network')
var appEvents = require('../app')
var protocolEvents = require('../protocol')
var rpcEvents = require('../rpc')
var chainEvents = require('../chain')
var protocol = require('../../network/protocol')
var cnf = require('../../tools/config');
var config = require('../../config');
var dbconnection = require('../../db/index').storage;
var network = require('../../network/tcp');
var util = require('../../tools/util');
var blockSync = require('../queue/blocksync')
var txSync = require('../queue/txsync')
var rpcServer = require('../../rpc/server')

var nodes = null;
var indexes = null;
var txindexes = null;
var recvblocks = {};


process.on('exit', appEvents.exitHandler);
//catches ctrl+c event
process.on('SIGINT', appEvents.exitHandler);
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', appEvents.exitHandler);
process.on('SIGUSR2', appEvents.exitHandler);

process.on('uncaughtException', function (err) {
    console.log('UNCAUGHT EXCEPTION:', err);
});

module.exports = function (events) {

    var handlers = {
        network: networkEvents,
        app: appEvents,
        protocol: protocolEvents,
        chain: chainEvents,
        rpc: rpcEvents,
    }

    for (var i in events) {
        if (i.indexOf("network.") > 0 || i.indexOf("net.") > 0)
            handlers['network'].on(i, events[i]);

        if (i.indexOf("app.") > 0)
            handlers['app'].on(i, events[i]);

        if (i.indexOf("protocol.") > 0)
            handlers['protocol'].on(i, events[i]);

        if (i.indexOf("chain.") > 0)
            handlers['chain'].on(i, events[i]);

        if (i.indexOf("rpc.") > 0)
            handlers['rpc'].on(i, events[i]);
    }

    networkEvents.on("network.init.start", function () {
        //console.log(hash.generateAddres(global.config['publicKey']))
        console.log("network.init started");

        rpcServer();
    })

    networkEvents.on("network.newmessage", function (msg) {
        //recv new message msg.data, msg.type, !!msg.self
    });

    networkEvents.on("network.emit", function (msg) {
        //send message to all network msg.data, msg.type
    })

    networkEvents.on("network.send", function (msg) {
        //send message to one node msg.data, msg.type, msg.rinfo
    })

    networkEvents.on("network.warm", function (error) {
        //    console.log('network warning: ', error)
    })

    networkEvents.on("network.error", function (error) {
        //    console.log('network error: ', error)
    });

    networkEvents.on("network.destroyed", function () {
        //    console.log("connection terminated");
    })

    networkEvents.on("net.close", function (client) {
        //    console.log('close client', client)
    })

    networkEvents.on("net.error", function (e) {
        //    console.log('net error', e)
    });

    networkEvents.on("net.server.close", function (client) {
        console.log('close server client', client)
    })

    networkEvents.on("net.server.error", function (e) {
        console.log('net server error', e)
    })

    protocolEvents.on("protocol.node.added", function (key, rinfo) {
        //enable connection on protocol layer with node key
        if (config.debug.protocol)
            console.log("protocol new node: ", key);
        if (key.indexOf("127.0.0.1") == -1) {
            if (!global['txPoolInited']) {


                //update tx pool
                if (config.blockchain.synctxpool)
                    chainEvents.emit("chain.netsync.tx.start", rinfo);
                else
                    chainEvents.emit("chain.netsync.tx.end");

            }
        }
    })

    appEvents.on("app.started", function () {

        //initialization
        cnf.init();

        global.blockchainInited = true;
        var dbconn = new dbconnection(config.net == 'mainnet' ? 'blockchain.dat' : 'blockchain_testnet.dat');
        var dbconn_wallet = new dbconnection(config.net == 'mainnet' ? 'wallet.dat' : 'wallet_testnet.dat');
        var dbconn_index = new dbconnection(config.net == 'mainnet' ? 'dbindex' : 'dbtestnetindex');
        var dbconn_inmemory_index = new dbconnection('memindex');
        Promise.all([
            dbconn_index.create(false, true), //for indexes storage
            dbconn_wallet.create(),
            dbconn.create(),
            dbconn_inmemory_index.create(true), //in memory
        ])
                .then(function () {

                    var wallet = require('../../wallet/index')
                    var account = wallet.getAccount(0);
                    if (!global.config['privateKey']) {
                        global.config['privateKey'] = account.privateKey;
                        global.config['publicKey'] = account.publicKey;
                        cnf.put();
                    }

                    global.indexesInited = true;
                    indexes = require('../../db/entity/block/indexes');
                    nodes = require('../../db/entity/network/nodes');
                    txindexes = require('../../db/entity/tx/pool');

                    appEvents.emit("app.inited");
                })
    });

    appEvents.on("app.inited", function () {
        var bchain = require('../../blockchain/index');

        try {
            var blockchain = new bchain('sync');
            blockchain.sync();
        } catch (e) {
            console.log(e)
        }

        //ping every 60 seconds
        if (!protocol.pingtimer) {
            protocol.createPingAllTask(60000);
            protocol.pingtimer = new Date().getTime() / 1000;
        }

        if (!protocol.addrtimer) {
            protocol.createAddrAllTask(60000 * 7);
            protocol.addrtimer = new Date().getTime() / 1000;
        }

        if (!protocol.nodestimer) {
            protocol.createCheckNodeTask(60000);
            protocol.nodestimer = new Date().getTime() / 1000;
        }

    });

    appEvents.on("app.stop", function () {

    });

    protocolEvents.on("protocol.resived.*", function (msg) {//all messages, also can catch unique messages with protocol.resived.something, like protocol.resived.ping e.t.c. 
        //all messages from protocol, msg.type, msg.data, !!msg.self, msg.rinfo
    });

    protocolEvents.on("protocol.sended.*", function (msg) {//all messages, also can catch unique messages with protocol.sended.something, like protocol.sended.ping e.t.c. 
        //all messages sended from protocol layer, msg.type, msg.data, !!msg.emit (emit = true - send for all network), msg.rinfo (used only when emit = false)
    });

    protocolEvents.on("protocol.unknowmessage", function (msg) {
        console.log("unknow message catched " + msg.type)
    })

    chainEvents.on("chain.localsync.start", function () {
//start blokchain locak index and sync
        console.log('chain synclocal start')
    });


    chainEvents.on("chain.localsync.end", function (params) {

        /*
         //fake blocks fill:
         var bchain = require('../../blockchain/index');
         var blockchain = new bchain();
         var prevhash = require('../../blockchain/block/genesis')().hash;
         var Block = require('../../blockchain/block/block');
         
         for (var i = 0; i < 1000; i++) {
         var newhash = hash.sha256(new Buffer("item" + i)).toString('hex');
         var b = null;
         b = new Block({
         version: 1,
         hashPrevBlock: prevhash,
         time: 1500307916, //time(),
         bits: 0x1f1fffff, //log2N=245 //dif.bits(), //todo: dif/get difficulty from network
         nonce: util.rand(0, 10e6),
         hash: newhash
         });
         
         b.addTx('0100000003660d6958506811b96bb82dc19409536709504901ac85ec4e2177cea599f056bb010000006b483045022100ccce639c5f37fbf80d6c204acdf3e8c5be00a3413162c7ea50abda443084462e022078e4e9197f1013c0ec7fe3dd136eaef1dc46719b9a7a2916347e52d6b4779b170121020633d13c837c96ed79bb752f0e080029390b6f97c425412eabbcdcee2904a0bbffffffff0ce648be24615e414c7d11895e3a3d0e2e5624ee35aef1ec780a7bb1e57972870a0000006b483045022100d0a56541d1af69cb23c20055a5bbb19f245f7c273f3551c7d6dacee99fef265102200540c4a1725b179ceb3941ab89984562d0722ce5e7c78a06cc1ca1c91c4bf2b3012102371b3ee1bdac7a2f61aa9a6607df792c1cde5cb859358384400f13737ab2fc27ffffffff366407ec789706ff45182281bac6d5a8146305ca472d101b7ea63f009ddd479f000000006b483045022100bf6362042d5cf96b6382b1b9b259aadeae00d5f6e770863a7848247616d2995d02205dad7eead9033994f412e9af881c4b1a17b1da6a56f42856644bb121e1faeab4012102f5e6d7883ea2226ee1758baae21ada86a888ab97e82584d8cbacc9c82921fac8ffffffff010ea62b00000000001976a914de27e285131a808aa9c9df32b04fd7a5292bf93088ac00000000');
         b.generate();
         console.log(prevhash + "->" + newhash);
         prevhash = newhash;
         b.generate();
         blockchain.appendBlock(b);
         }
         
         
         //console.log(blockchain.bestChain());*/

        console.log('chain synclocal stop', params)

        //params.topblock
//end blokchain localА index and sync

        network();
    });

    chainEvents.on("chain.inventory.need", function (params) {//node - name of node to witch send inv, type: (blockhash|block|tx)m hash - hash, from wich need inventory (or 500 max)

        try {
            var inv = require('../../blockchain/inventory');
            if (params.type == 'blockdata' || params.type == 'txdata') {
                var arr = params.head, sended = 0;
                
                var count = 200, msg = params.filter ? 'merkleblock' : 'blockdata';
                if (params.type == 'txdata'){
                    count = 2000;
                    msg = 'txdata';
                }
                
                if (!(params.head instanceof Array))
                    arr = [params.head];

                arr = arr.slice(0, count);//only first N messages. 

                for (var i in arr) {
                    var inventory = new inv(params.type, arr[i], params.offset, params.filter);
                    var list = inventory.getList()
                    if (list.object_listed > 0) {
                        protocol.sendOne(params.rinfo, 'inv', list);
                        sended++;
                    }
                }

                if (arr.length > 1 || params.filter) {//when we have spv connected client - send empty merkleinv is important to notice client.
                    //send empty inv, to say "this portion is end, call next"
                    protocol.sendOne(params.rinfo, 'inv', {
                        synced: true,
                        object_type: msg,
                        object_listed: 0,
                        object_count: 0,
                        object_list: [],
                        object_queryhash: params.head[0] + params.head[params.head.length - 1]
                    });
                }

            } else {
                var inventory = new inv(params.type, params.head, params.offset, params.filter);
                protocol.sendOne(params.rinfo, 'inv', inventory.getList());
            }
        } catch (e) {
            console.log(e)
        }


    });

    chainEvents.on("chain.block.seek", function (info) {

        //if (!indexes.haveblock(info.hash)) {
        chainEvents.on("chain.block." + info.hash, function (block, addedInMainChain) {
            chainEvents.removeAllListeners(block.hash);
            if (config.debug.blockchain.orphanblock)
                console.log("orphan| new block finded " + block.hash + ", check")
            //var orphan = require('../../db/entity/block/orphan');
            //orphan.check(block.hash);
        })

        var rinfo = nodes.get('updater');
        if (rinfo.remoteAddress) {
            protocol.sendOne(rinfo, 'getblockdata', info);
        } else
            protocol.sendAll('getblockdata', info);
        //}

    });

    chainEvents.on("chain.inventory.chunk", function (params) {

        /*{
         rinfo:,
         type: ,
         count:,
         offset:,
         next_offset:,
         list_cnt:,
         list:,
         }*/

        if (params.type == 'blockdata') {
            nodes.set('updater', params.rinfo)
            var bchain = require('../../blockchain/index');
            var blockchain = new bchain('sync');
            //todo check this block ant tx inner
            blockchain.appendBlockFromJSON(params.list[0], function (block, isExist, isAddedToMainChain) {
                if (config.debug.blockchain.sync)
                    console.log("block " + block.hash + " existing before: " + isExist + " added to mainhain " + isAddedToMainChain)
                if (!isAddedToMainChain && !indexes.haveblock(block.hash)) {
                    if (config.debug.blockchain.sync)
                        console.log("block " + block.hash + " maybe wrong, but save him to memblock storage ")
                    var memblock = require('../../db/entity/block/memory');
                    memblock.set(block.hash, block);//its maybe not valid. Just for 
                }
                blockSync.release(block.hash);
                chainEvents.emit("chain.block." + block.hash, block);

            });

        }

        if (params.type == 'txdata') {
            nodes.set('updater', params.rinfo)
            //todo check this block ant tx inner
            txindexes.addTx(params.list[0], function (tx) {

                txSync.release(tx.hash);

            })
        }

        if (params.type == 'block') {
            nodes.set('updater', params.rinfo)
            if (params.list_cnt && !params.synced) {

                params.list = util.uniquely(params.list)

                for (var i in params.list) {

                    if (i == 0)
                        continue;

                    blockSync.for(params.list).with(params).push(util.blockhash(params.list[i - 1]), i, function (key, list, params) {
                        var i = this.index[key], blockhash = util.blockhash(list[i]);
                        chainEvents.emit("chain.netsync.block.process", params.count, parseInt(params.offset) + parseInt(i));

                        if (!indexes.haveblock(blockhash))
                            protocol.sendOne(params.rinfo, 'getblockdata', {
                                hash: blockhash
                            });
                        else {
                            if (config.debug.blockchain.sync)
                                console.log("block " + blockhash + " already exist in db, skip")
                            blockSync.release(blockhash);
                        }

                    });



                }


                //maybe here loose last hash. Try to update this part of code.
                blockSync.for(params.list).with(params).push(util.blockhash(params.list[params.list.length - 1]), 0, function (key, list, params) {
                    if (params.next_offset)
                        protocol.sendOne(params.rinfo, 'getblocks', {
                            headhash: params.queryhash,
                            offset: params.next_offset
                        });
                    else {
                        chainEvents.emit("chain.netsync.block.end");
                    }
                });

                chainEvents.emit("chain.netsync.block.process", params.count, parseInt(params.offset) + parseInt(0));
                var forkState = 0;

                var firsthash = util.blockhash(params.list[0]);
                if (params.list.length == 1 && params.queryhash != firsthash)//now we in fork state
                    forkState = 1;

                if (!indexes.haveblock(firsthash) || forkState)
                    protocol.sendOne(params.rinfo, 'getblockdata', {
                        hash: firsthash
                    });
                else {
                    if (config.debug.blockchain.sync)
                        console.log("block " + firsthash + " already exist in db, skip")
                    blockSync.release(util.blockhash(params.list[0]));
                }


            } else
                chainEvents.emit("chain.netsync.block.end");
        }

        if (params.type == 'tx') {
            nodes.set('updater', params.rinfo)
            if (params.list_cnt && !params.synced) {

                for (var i in params.list) {

                    if (!txindexes.get(params.list[i])) {
                        if (i == 0)
                            continue;

                        txSync.for(params.list).with(params).push(params.list[i - 1], i, function (key, list, params) {
                            var i = this.index[key];
                            chainEvents.emit("chain.netsync.tx.process", params.count, parseInt(params.offset) + parseInt(i));
                            if (!txindexes.get(list[i]).hash) {
                                protocol.sendOne(params.rinfo, 'gettxdata', {
                                    hash: list[i]
                                });
                            } else {
                                console.log("tx " + list[i] + " in mempool already exist, skip")
                                txSync.release(list[i]);
                            }

                        });

                    }

                }


                //maybe here loose last hash. Try to update this part of code.
                txSync.for(params.list).with(params).push(params.list[params.list.length - 1], 0, function (key, list, params) {
                    if (params.next_offset)
                        protocol.sendOne(params.rinfo, 'gettx', {
                            count: txindexes.getList(),
                            offset: params.next_offset
                        });
                    else
                        chainEvents.emit("chain.netsync.tx.end");
                });

                if (!txindexes.get(params.list[0]).hash) {
                    chainEvents.emit("chain.netsync.tx.process", params.count, parseInt(params.offset) + parseInt(0));
                    protocol.sendOne(params.rinfo, 'gettxdata', {
                        hash: params.list[0]
                    });
                } else {
                    console.log("tx " + params.list[0] + " in mempool already exist, skip")
                    txSync.release(params.list[0]);
                }



            } else
                chainEvents.emit("chain.netsync.tx.end");
        }

        if (params.type == 'newtx') {//come from all nodes, if this tx already have in memory pool - nothing to do, else - emit all nodes and add to mempool
            if (params.list_cnt) {

                //var txVal = require('../../blockchain/transaction/validator')

                for (var i in params.list) {
                    if (config.debug.blockchain.indexing)
                        console.log("mempool tx: ", params.list[i].hash)

                    if (config.debug.blockchain.indexing)
                        console.log("tx not exist already in mempool: ", !txindexes.have(params.list[i].hash))

                    if (params.list[i].hash && !txindexes.have(params.list[i].hash)) {

                        //add to mempool
                        txindexes.addTx(params.list[i], function (txJSON, t, valid) {
                            if (!txJSON) {
                                console.log("try to relay coinbase tx, cancel")
                                return;//coinbase not relayed
                            }
                            //emit to others nodes. ! only if not have in ournode mempool
                            if (valid) {
                                if (config.debug.blockchain.indexing)
                                    console.log("added new tx to mempool ", txJSON.hash);
                                chainEvents.emit("chain.newtx", t, txJSON)
                                t.send();
                            } else {
                                if (config.debug.blockchain.indexing)
                                    console.log("tx is not valid", txJSON.errors)
                                //todo: emit reject to sender.
                                t.setErrors(txJSON.errors)
                                t.reject(params.rinfo);
                            }
                        }, true);


                    }

                }
            }
        }

        if (params.type == 'newblock') {
            if (params.list_cnt) {

                for (var i in params.list) {

                    var bchain = require('../../blockchain/index');
                    var blockchain = new bchain();
                    blockchain.appendBlockFromJSON(params.list[0], function (block, isExist) {

                        var recivedAlready = recvblocks[block.hash];

                        if (!isExist && !recivedAlready) {
                            //send to all
                            if (config.debug.blockchain.indexing)
                                console.log("added new block ", block.hash);
                            recvblocks[block.hash] = new Date().getTime();
                            chainEvents.emit("chain.newblock", block);
                            chainEvents.emit("chain.tick");
                            block.send();
                        }
                    });



                }
            }
        }

    });

    chainEvents.on("chain.update.need", function (rinfo) {
        var nodeInfo = {rinfo: rinfo};
        //need update blockchain
        /*
         var n = protocol.getRandomNode();
         var nodeInfo;
         if (!n) {
         var nodeInfo = {rinfo: rinfo};
         } else {
         nodeInfo = nodes.get(n);
         }
         
         console.log("need update catched, select random node: ", n || protocol.getAddressUniq(rinfo))*/
        /*if (nodeInfo.rinfo != null) {
         chainEvents.emit("chain.netsync.block.start");
         nodes.set('updater', nodeInfo.rinfo)
         protocol.sendOne(nodeInfo.rinfo, 'getblocks', {
         headhash: indexes.get('top').hash,
         });
         }*/

        protocol.sendAll('getblocks', {
            headhash: indexes.get('top').hash,
        });

    })

    networkEvents.on("network.inited", function () {
        //this node connected to network and emited to all nodes, can start sync
        console.log("network inited");
    });

    chainEvents.on("chain.netsync.block.start", function () {
        if (config.debug.blockchain.netsync)
            console.log('chain netsync block start')
    });

    chainEvents.on("chain.netsync.block.process", function (need_update, updated_count) {
        if (config.debug.blockchain.netsync)
            console.log('netsync block: ' + parseInt((updated_count / need_update) * 100) + "%")
    });

    chainEvents.on("chain.netsync.block.end", function () {
        if (config.debug.blockchain.netsync)
            console.log('chain netsynced block', indexes.get('top'));

        var bchain = require('../../blockchain/index');
        var blockchain = new bchain();
        blockchain.resync();

    });

    chainEvents.on("chain.netsync.tx.start", function () {

        if (config.debug.blockchain.netsync)
            console.log('chain netsync tx mempool start');

        var nodeInfo = {rinfo: nodes.get('updater')};
        if (!nodeInfo.rinfo.address) {
            var vals = [], n = protocol.getNodeList()
            for (var i in n) {
                vals.push(n[i]);
            }


            var node = vals[util.rand(0, vals.length - 1)];
            nodeInfo = nodes.get("data/" + node);
            if (!nodeInfo && !nodeInfo.rinfo)
                nodeInfo = {rinfo: {address: node}}
        }

        protocol.sendOne(nodeInfo.rinfo, 'gettx', {
            count: txindexes.getCount(),
        });

    });

    chainEvents.on("chain.netsync.tx.process", function (need_update, updated_count) {
        if (config.debug.blockchain.netsync)
            console.log('netsync tx: ' + parseInt((updated_count / need_update) * 100) + "%")
    });

    chainEvents.on("chain.netsync.tx.end", function () {
        if (config.debug.blockchain.netsync && config.blockchain.synctxpool)
            console.log('chain netsynced tx cnt: ' + txindexes.getCount());
        global['txPoolInited'] = 1;
        chainEvents.emit("chain.synced");
    });

    chainEvents.on("chain.synced", function () {
        if (config.debug.blockchain.netsync)
            console.log('chain full synced');

    });

    rpcEvents.on("rpc.server.start", function (server) {


    });

    chainEvents.on("chain.newblock", function (block) {
        //new block recived and emitted
        if (config.debug.blockchain.events)
            console.log("new event block " + block.hash);
    });

    chainEvents.on("chain.newtx", function (tx, txjson) {
        //new tx recived and emitted
        if (config.debug.blockchain.events)
            console.log("new event tx " + txjson.hash)
    })

    chainEvents.on("chain.event.address", function (data) {
        /*data = {
         address: 'addr',
         type: type, //input||output
         tx: 'hash',
         amount: 'amount'
         }*/
        if (config.debug.blockchain.events)
            console.log("new event to address " + data.address, data)
    });

    chainEvents.on("chain.event.unconfirmed.address", function (data) {
        /*data = {
         address: 'addr',
         type: type, //input||output
         tx: 'hash',
         amount: 'amount'
         }*/
        if (config.debug.blockchain.events)
            console.log("new unconfirmed event to address " + data.address, data)
    });

    chainEvents.on("chain.tick", function () {
        //one blockchain tick. update wallets and other data when come tick
        if (config.debug.blockchain.events)
            console.log("blockchain tick event")
    })

    chainEvents.on("chain.utxo.unspent", function (obj) {
        //new unspend income on address obj.address
        /*data = {
         address: 'addr'
         tx: 'hash',
         index: 'index',
         amount: 'amount',
         spent: false
         }*/
    })


    chainEvents.on("chain.utxo.spent", function (obj) {
        //new spending at address obj.address 
        /*data = {
         address: 'addr'
         tx: 'hash',
         index: 'index',
         amount: 'amount',
         spent: true
         }*/
    })



}
