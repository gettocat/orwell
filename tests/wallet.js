/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var assert = require('assert');
var dbconnection = require('../db/index').storage;
var dbconn_wallet = new dbconnection('wallet.dat');

dbconn_wallet.create().then(function () {


    var wallet = require('../wallet/index')
    describe('wallet bestUnspent', function () {

        it('one greater', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'}
            ], 5 * 1e8);

            assert.equal(list.outs.length, 1)
            assert.equal(list.outs[0].hash, 'test1')
            assert.equal(list.change / 1e8, parseFloat(6.2 - 5).toFixed(1))

        })

        it('few greater min', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 12.2 * 1e8, hash: 'test2'},
                {amount: 8.21255 * 1e8, hash: 'test3'}
            ], 5 * 1e8);

            assert.equal(list.outs.length, 1)
            assert.equal(list.change / 1e8, parseFloat(6.2 - 5).toFixed(1))

        })

        it('few greater middle', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 12.2 * 1e8, hash: 'test2'},
                {amount: 8.21255 * 1e8, hash: 'test3'}
            ], 7 * 1e8);

            assert.equal(list.outs.length, 1)
            assert.equal(list.change / 1e8, parseFloat(8.21255 - 7).toFixed(5))

        })

        it('few greater max', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 12.2 * 1e8, hash: 'test2'},
                {amount: 8.21255 * 1e8, hash: 'test3'}
            ], 11.8 * 1e8);

            assert.equal(list.outs.length, 1)
            assert.equal(list.change / 1e8, parseFloat(12.2 - 11.8).toFixed(1))

        })

        it('one lesser (not have money for transaction)', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
            ], 7.8 * 1e8);

            assert.equal(list, false)

        });

        it('two lesser', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 4.5 * 1e8, hash: 'test2'},
            ], 7.8 * 1e8);

            assert.equal(list.outs.length, 2)
            assert.equal(list.change / 1e8, parseFloat(6.2 + 4.5 - 7.8).toFixed(1))

        })

        it('three lesser', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 4.5 * 1e8, hash: 'test2'},
                {amount: 1.03 * 1e8, hash: 'test3'},
            ], 11.4 * 1e8);

            assert.equal(list.outs.length, 3)
            assert.equal(list.change / 1e8, parseFloat(6.2 + 4.5 + 1.03 - 11.4).toFixed(2))

        })

        it('three lesser (no have money)', function () {

            var list = wallet.bestUnspent([
                {amount: 6.2 * 1e8, hash: 'test1'},
                {amount: 4.5 * 1e8, hash: 'test2'},
                {amount: 1.03 * 1e8, hash: 'test3'},
            ], 112.314 * 1e8);

            assert.equal(list, false)

        })

    });

    describe('wallet createTransaction', function () {

        it('simple tx', function () {

            /*var list = wallet.createTransaction(account_id, address_destination, amount);

            assert.equal(list.outs.length, 1)
            assert.equal(list.outs[0].hash, 'test1')
            assert.equal(list.change / 1e8, parseFloat(6.2 - 5).toFixed(1))*/

        })

    })


})
