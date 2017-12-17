/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */
var BloomFilter = require('bloom-filter');
var bchain = require('../blockchain/index');
var indexes = require('../db/entity/block/indexes');
var config = require('../config');
var txindexes = require('../db/entity/tx/pool');
require('../tools/bitpony_extends')
var bitPony = require('bitpony');

function inv(type, tophash, offset, filter) {

    this.filter = null;

    if (filter)
        this.filter = new BloomFilter(bitPony.filterload.read(filter));

    this.type = type;
    this.offset = offset || 0;
    this.hash = tophash;
    try {
        this.init();
    } catch (e) {
        console.log(e);
    }
}

inv.prototype = {
    result: null,
    init: function () {
        switch (this.type) {
            case 'block':
                this.findBlocks();
                break;
            case 'blockdata':
                this.findBlock();
                break;
            case 'tx':
                this.findTxs();
                break;
            case 'txdata':
                this.findMempoolTx();
                break;
            case 'newtx':
                this.emitTx();
                break;
            case 'newblock':
                this.emitBlock();
                break;
            default:
                throw new Error('inv has unknow type ' + this.type);
        }

    },
    findBlock: function () {
        //return block full content if not have filter,
        //else - merkleblock if have in filter, else - nothing.
        var blockchain = new bchain();
        var item = blockchain.getBlock(this.hash);

        if (this.filter)
            item = blockchain.containInBloom(item, this.filter);

        var arr = [];
        if (item)
            arr.push(item);

        this.list = {
            synced: true,
            object_type: this.filter ? 'merkleblock' : 'blockdata',
            object_listed: arr.length,
            object_count: arr.length,
            object_list: arr,
            object_queryhash: this.hash,
        }

    },
    findMempoolTx: function () {
        var blockchain = new bchain(), tx = null;
        try {
            tx = blockchain.getTx(this.hash);
        } catch (e) {
            tx = txindexes.get(this.hash);
        }

        this.list = {
            synced: true,
            object_type: 'txdata',
            object_listed: 1,
            object_count: 1,
            object_list: [tx],
            object_queryhash: this.hash,
        }
    },
    findBlocks: function () {

        if (indexes.get('top').hash == this.hash) {
            var arr = [], list = [];
        } else {
            var blockchain = new bchain();
            var arr = blockchain.findBlockHeaders(this.hash), list = [];//asc
            if (arr.length > config.limits.invblocks) {
                var i = this.offset + config.limits.invblocks;
                if (i >= arr.length - 1)
                    i = arr.length - 1;

                list = arr.slice(this.offset, i);
            } else {
                list = arr;
            }
        }

        this.list = {
            synced: this.hash == indexes.get('top').hash,
            object_type: this.type,
            object_count: arr.length,
            object_offset: this.offset,
            object_next_offset: arr.length > config.limits.invblocks ? (arr.length < this.offset ? 0 : this.offset + config.limits.invblocks) : 0,
            object_listed: list.length,
            object_list: list,
            object_queryhash: this.hash,
        };


    },
    findTxs: function () {

        var arr = txindexes.getList(), list = [];
        if (arr.length > config.limits.invtx) {
            var i = this.offset + config.limits.invtx;
            if (i >= arr.length - 1)
                i = arr.length - 1;

            list = arr.slice(this.offset, i);
        } else {
            list = arr;
        }


        this.list = {
            synced: arr.length <= this.offset,
            object_type: this.type,
            object_count: arr.length,
            object_offset: this.offset,
            object_next_offset: arr.length > config.limits.invtx ? (arr.length < this.offset ? 0 : this.offset + config.limits.invtx) : 0,
            object_listed: list.length,
            object_list: list,
            object_queryhash: this.hash,
        };


    },
    emitTx: function () {

        var item = null;
        if (this.filter) {
            var Tx = require('./transaction/transaction_new')
            item = Tx.checkTxFilter(this.offset, this.filter);
        } else {
            item = this.offset;
        }

        var arr = [];
        if (item)
            arr.push(item);

        if (this.offset)//hack: offset in this case - content of tx
            this.list = {
                synced: true,
                object_type: 'newtx',
                object_listed: 1,
                object_count: 1,
                object_list: [this.offset], //offset its content of tx in this case
            }

    },
    emitBlock: function () {
        if (this.offset)//hack offset in this case - content of block
            this.list = {
                synced: true,
                object_type: 'newblock',
                object_listed: 1,
                object_count: 1,
                object_list: [this.offset], //offset its content of block in this case
            }

    },
    getList: function () {
        return this.list;
    }
}

module.exports = inv;