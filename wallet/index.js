/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var wdb = require('../db/entity/wallet/wallet')
var crypto = require('../crypto/crypto')
var hash = require('../crypto/hash');
var config = require('../config')
var obj = null;
var Tx = require('../blockchain/transaction/transaction_new')
var Script = require('../blockchain/script/script')
var dscript = require('orwelldb').datascript;

var wallet = function () {
    this.db = new wdb()
}

wallet.prototype = {
    fee: config.wallet.fee.minimum,
    db: null,
    createAccount: function (id, force) {

        if (!this.findAddrByAccount(id) || force) {
            var privateKey, publicKey;
            var data = crypto.createKeyPair();
            privateKey = data.private;
            publicKey = data.public;

            var addr = hash.generateAddres(publicKey);
            var obj = {hash: id, added: new Date().getTime() / 1000, address: addr, publicKey: publicKey, privateKey: privateKey};
            this.db.save(obj)
            return obj
        } else
            return this.findAddrByAccount(id);

    },
    getAccount: function (id) {

        var obj = this.findAddrByAccount(id);
        if (!obj)
            obj = this.createAccount(id);

        return obj;

    },
    findAccountByAddr: function (addr) {
        var obj = this.db.getCollection().chain().find({address: addr}).simplesort('added', true).limit(1).data({removeMeta: true});
        return obj[0];
    },
    findAddrByAccount: function (id) {
        var obj = this.db.getCollection().chain().find({hash: id}).simplesort('added', true).limit(1).data({removeMeta: true});
        return obj[0];
    },
    getAccountAddresses: function (id) {
        var obj = this.db.getCollection().chain().find({hash: id}).simplesort('added', true).data({removeMeta: true});

        var addr = [];
        for (var i in obj) {
            addr.push(obj[i].address);
        }

        return addr;
    },
    getBalance: function (id) {
        var addresses = this.getAccountAddresses(id)
        var unspent = this.getAddressessUnspent(addresses);
        var amount = 0;
        for (var i in unspent) {
            amount += unspent[i].amount
        }
        return amount
    },
    getBalanceAddress: function (address) {

        var arr = this.getAddressUnspent(address), balance = 0;

        for (var i in arr) {
            balance += arr[i].amount;
        }

        return balance;

    },
    getAddressUnspent: function (addr) {
        var utxo = require('../db/entity/tx/utxo')
        var arr = utxo.get("address/" + addr);
        if (!arr) {
            arr = [];
        }

        var a = [];
        for (var i in arr) {
            if (!arr[i].spent && !arr[i].spentHash && !arr[i].locked)
                a.push(arr[i]);
        }

        /**
         {
         tx: tx,
         index: index,
         amount: amount,
         spent: false
         }
         */
        return a;

    },
    getAddressessUnspent: function (arr) {
        var res = [];
        for (var i in arr) {
            res = res.concat(this.getAddressUnspent(arr[i]));
        }

        return res;
    },
    bestUnspent: function (unspentList, target) {

        if (!unspentList.length)
            return false;

        var lessers = [], greaters = [];

        for (var i in unspentList) {
            if (unspentList[i].amount > target) {
                greaters.push(unspentList[i]);
            } else
                lessers.push(unspentList[i])
        }

        if (greaters.length > 0) {
            var min = null;
            for (var i in greaters) {

                if (!min || greaters[i].amount < min.amount) {
                    min = greaters[i];
                }

            }

            if (min) {
                var change = min.amount - target;
                return {
                    outs: [min],
                    change: change
                }
            }
        }

        lessers = lessers.sort(function (a, b) {
            return b.amount - a.amount;
        });

        var result = []
        accum = 0
        for (var a in lessers) {
            result.push(lessers[a])
            accum += lessers[a].amount
            if (accum >= target) {
                change = accum - target
                return {
                    outs: result,
                    change: change
                }
            }
        }
        return false;



    },
    findAddress: function (address) {
        var obj = this.db.getCollection().chain().find({address: address}).simplesort('added', true).limit(1).data({removeMeta: true});
        return obj[0];
    },
    createTransaction: function (account_id, address_destination, amount, datascript, fee) {
        if (!fee)
            fee = 0;

        var addresses = this.getAccountAddresses(account_id)
        var unspent = this.getAddressessUnspent(addresses);
        var res = this.bestUnspent(unspent, amount + fee);

        if (!res)
            return {
                status: false,
                code: -1,
                error: 'can not send ' + (amount + fee) + ' satoshi to address ' + address_destination + ' not have unspent coins',
            }



        //make tx with out1 - address_destination, address2 - change out to new address of account_id
        var tx = new Tx();
        var bchain = require('../blockchain/index')
        var blockchain = new bchain();

        var inputs = [], privates = [];
        for (var i in res.outs) {
            var prevout = blockchain.getOut(res.outs[i].tx, res.outs[i].index);
            var addrinfo = this.findAddress(prevout.addr);

            if (!addrinfo || !addrinfo.privateKey)
                return {
                    status: false,
                    code: -2,
                    error: 'can not find in wallet.dat info about address  ' + prevout.addr,
                    address: prevout.addr,
                }

            privates.push(addrinfo.privateKey);

            inputs.push({
                hash: res.outs[i].tx,
                index: res.outs[i].index,
                sequence: 0xffffffff,
                prevAddress: prevout.addr,
            })
        }

        tx.setInputs(inputs);

        var outputs = [];
        outputs.push({
            amount: amount,
            scriptPubKey: Script.addrToScript(address_destination)
        })

        var changeaddress;
        if (config.wallet.changeAddress && fee)//if fee exist its mean we have second round of sending, can create new address.
            changeaddress = this.createAccount(account_id, true);
        else
            changeaddress = this.getAccount(account_id);

        if (!changeaddress.address)
            throw new Error('cant create new address');

        outputs.push({
            amount: res.change,
            scriptPubKey: Script.addrToScript(changeaddress.address)
        })

        tx.setOutputs(outputs)
        tx.setVersion(config.blockchain.txversion)
        tx.setLockTime(0);
        if (datascript)
            tx.setDataScript(datascript)
        tx.sign(privates)

        return tx;

    },
    createMultiTransaction: function (account_id, addr_amount_arr, datascript, fee) {
        if (!fee)
            fee = 0;

        var amount = 0, out_addresses = []
        for (var i in addr_amount_arr) {
            amount += addr_amount_arr[i]
        }

        var addresses = this.getAccountAddresses(account_id)
        var unspent = this.getAddressessUnspent(addresses);
        var res = this.bestUnspent(unspent, amount + fee);

        if (!res)
            return {
                status: false,
                code: -1,
                error: 'can not send ' + (amount + fee) + ' satoshi to address ' + out_addresses.join(", ") + ' not have unspent coins',
            }



        //make tx with out1 - address_destination, address2 - change out to new address of account_id
        var tx = new Tx();
        var bchain = require('../blockchain/index')
        var blockchain = new bchain();

        var inputs = [], privates = [];
        for (var i in res.outs) {
            var prevout = blockchain.getOut(res.outs[i].tx, res.outs[i].index);
            var addrinfo = this.findAddress(prevout.addr);

            if (!addrinfo || !addrinfo.privateKey)
                return {
                    status: false,
                    code: -2,
                    error: 'can not find in wallet.dat info about address  ' + prevout.addr,
                    address: prevout.addr,
                }

            privates.push(addrinfo.privateKey);

            inputs.push({
                hash: res.outs[i].tx,
                index: res.outs[i].index,
                sequence: 0xffffffff,
                prevAddress: prevout.addr,
            })
        }

        tx.setInputs(inputs);

        var outputs = [];
        for (var i in addr_amount_arr) {
            outputs.push({
                amount: addr_amount_arr[i],
                scriptPubKey: Script.addrToScript(i)
            })
        }

        var changeaddress;
        if (config.wallet.changeAddress && fee)//if fee exist its mean we have second round of sending, can create new address.
            changeaddress = this.createAccount(account_id, true);
        else
            changeaddress = this.getAccount(account_id);

        if (!changeaddress.address)
            throw new Error('cant create new address');

        outputs.push({
            amount: res.change,
            scriptPubKey: Script.addrToScript(changeaddress.address)
        })

        tx.setOutputs(outputs)
        tx.setVersion(config.blockchain.txversion)
        tx.setLockTime(0);
        if (datascript)
            tx.setDataScript(datascript)
        tx.sign(privates)

        return tx;

    },
    createTransactionFromAddress: function (address, address_destination, amount, datascript, fee) {
        if (!fee)
            fee = 0;

        var unspent = this.getAddressUnspent(address);
        var res = this.bestUnspent(unspent, amount + fee);

        if (!res)
            return {
                status: false,
                code: -1,
                error: 'can not send ' + (amount + fee) + ' satoshi to address ' + address_destination + ' not have unspent coins',
            }



        //make tx with out1 - address_destination, address2 - change out to new address of account_id
        var tx = new Tx();
        var bchain = require('../blockchain/index')
        var blockchain = new bchain();

        var inputs = [], privates = [];
        for (var i in res.outs) {
            var prevout = blockchain.getOut(res.outs[i].tx, res.outs[i].index);
            var addrinfo = this.findAddress(prevout.addr);

            if (!addrinfo || !addrinfo.privateKey)
                return {
                    status: false,
                    code: -2,
                    error: 'can not find in wallet.dat info about address  ' + prevout.addr,
                    address: prevout.addr,
                }

            privates.push(addrinfo.privateKey);

            inputs.push({
                hash: res.outs[i].tx,
                index: res.outs[i].index,
                sequence: 0xffffffff,
                prevAddress: prevout.addr,
            })
        }

        tx.setInputs(inputs);

        var outputs = [];
        outputs.push({
            amount: amount,
            scriptPubKey: Script.addrToScript(address_destination)
        })

        var changeaddress = this.findAccountByAddr(address);//change addressess is not working for datascript transactions

        if (!changeaddress.address)
            throw new Error('cant create new address');

        outputs.push({
            amount: res.change,
            scriptPubKey: Script.addrToScript(changeaddress.address)
        })

        tx.setOutputs(outputs)
        tx.setVersion(config.blockchain.txversion)
        tx.setLockTime(0);
        if (datascript)
            tx.setDataScript(datascript)
        tx.sign(privates)

        return tx;

    },
    createMultiTransactionFromAddress: function (addressfrom, addr_amount_arr, datascript, fee) {
        if (!fee)
            fee = 0;

        var amount = 0, addresses = [];
        for (var i in addr_amount_arr) {
            addresses.push(i);
            amount += addr_amount_arr[i]
        }

        var unspent = this.getAddressUnspent(addressfrom);
        var res = this.bestUnspent(unspent, amount + fee);

        if (!res)
            return {
                status: false,
                code: -1,
                error: 'can not send ' + (amount + fee) + ' satoshi to addressess ' + addresses.join(", ") + ' not have unspent coins',
            }



        //make tx with out1 - address_destination, address2 - change out to new address of account_id
        var tx = new Tx();
        var bchain = require('../blockchain/index')
        var blockchain = new bchain();

        var inputs = [], privates = [];
        for (var i in res.outs) {
            var prevout = blockchain.getOut(res.outs[i].tx, res.outs[i].index);
            var addrinfo = this.findAddress(prevout.addr);

            if (!addrinfo || !addrinfo.privateKey)
                return {
                    status: false,
                    code: -2,
                    error: 'can not find in wallet.dat info about address  ' + prevout.addr,
                    address: prevout.addr,
                }

            privates.push(addrinfo.privateKey);

            inputs.push({
                hash: res.outs[i].tx,
                index: res.outs[i].index,
                sequence: 0xffffffff,
                prevAddress: prevout.addr,
            })
        }

        tx.setInputs(inputs);

        var outputs = [];
        for (var i in addr_amount_arr) {
            outputs.push({
                amount: addr_amount_arr[i],
                scriptPubKey: Script.addrToScript(i)
            })
        }

        var changeaddress = this.findAccountByAddr(addressfrom);//change addressess is not working for datascript transactions

        if (!changeaddress.address)
            throw new Error('cant create new address');

        outputs.push({
            amount: res.change,
            scriptPubKey: Script.addrToScript(changeaddress.address)
        })

        tx.setOutputs(outputs)
        tx.setVersion(config.blockchain.txversion)
        tx.setLockTime(0);
        if (datascript)
            tx.setDataScript(datascript)
        tx.sign(privates)

        return tx;

    },
    setFee: function (amount) {
        this.fee = amount;
    },
    calculateFee: function (tx) {
        var bytes = new Buffer(tx.toHex(), 'hex').length + 10;//10 bytes just because second tx in bytes can be bigger than first on 1-2 byte. Need that second tx be bigger fee, because it can be not validated
        var operationFee = 0;

        var data = tx.toJSON();
        if (data.datascript) {
            var scripts = dscript.readArray(data.datascript);
            for (var i in scripts) {
                var d = new dscript(scripts[i]);
                //console.log(scripts[i])
                var f = d.toJSON();
                operationFee += config.wallet.operationfee[f.operator];
            }
        }
        //console.log('opfee: ', operationFee, 'bytes: ', bytes, "fee: ", this.fee, " bytes fee: ", bytes * this.fee)

        return bytes * this.fee + operationFee;
    },
    sendFromAddress: function (addr, address_destination, amount, datascript) {
        var tx = this.createTransactionFromAddress(addr, address_destination, amount, datascript, 0);

        if (tx.status == false)
            return tx;

        //create transaction with new amount (with fee)
        var fee = this.calculateFee(tx);
        var tx = this.createTransactionFromAddress(addr, address_destination, amount, datascript, fee);

        if (tx.status == false)
            return tx;

        var txValid = require('../blockchain/transaction/validator')
        //console.log(tx)
        var val = (txValid.isValid(tx));

        var hash;
        if (val) {
            hash = tx.send();
            this.makesUnspentLocked(tx);
        } else {
            return {
                status: false,
                code: 'notvalid'
            }
        }


        return {
            fee: fee,
            status: true,
            code: 1,
            hash: hash,
            tx: tx
        }
    },
    send: function (account_id, address_destination, amount, datascript) {
        var tx = this.createTransaction(account_id, address_destination, amount, datascript, 0);

        if (tx.status == false)
            return tx;

        //create transaction with new amount (with fee)
        var fee = this.calculateFee(tx);
        var tx = this.createTransaction(account_id, address_destination, amount, datascript, fee);

        if (tx.status == false)
            return tx;

        var txValid = require('../blockchain/transaction/validator')
        //console.log(tx)
        //console.log(txValid.isValid(tx));
        if (txValid.isValid(tx)) {
            var hash = tx.send();
            this.makesUnspentLocked(tx);
        }
        return {
            fee: fee,
            status: true,
            code: 1,
            hash: hash,
            tx: tx
        }

    },
    sendMulti: function (account_id, addr_amount_arr, datascript) {
        var tx = this.createMultiTransaction(account_id, addr_amount_arr, datascript, 0);

        if (tx.status == false)
            return tx;

        //create transaction with new amount (with fee)
        var fee = this.calculateFee(tx);
        var tx = this.createMultiTransaction(account_id, addr_amount_arr, datascript, fee);

        if (tx.status == false)
            return tx;

        var txValid = require('../blockchain/transaction/validator')
        //console.log(tx)
        //console.log(txValid.isValid(tx));
        if (txValid.isValid(tx)) {
            var hash = tx.send();
            this.makesUnspentLocked(tx);
        }
        return {
            fee: fee,
            status: true,
            code: 1,
            hash: hash,
            tx: tx
        }

    },
    sendMultiFromAddress: function (addr, addr_amount_arr, datascript) {
        var tx = this.createMultiTransactionFromAddress(addr, addr_amount_arr, datascript, 0);

        if (tx.status == false)
            return tx;

        //create transaction with new amount (with fee)
        var fee = this.calculateFee(tx);
        var tx = this.createMultiTransactionFromAddress(addr, addr_amount_arr, datascript, fee);

        if (tx.status == false)
            return tx;

        var txValid = require('../blockchain/transaction/validator')
        //console.log(tx)
        var val = (txValid.isValid(tx));

        var hash;
        if (val) {
            hash = tx.send();
            this.makesUnspentLocked(tx);
        } else {
            return {
                status: false,
                code: 'notvalid'
            }
        }


        return {
            fee: fee,
            status: true,
            code: 1,
            hash: hash,
            tx: tx
        }
    },
    makesUnspentLocked: function (tx) {
        var changed = 0;
        var utxo = require('../db/entity/tx/utxo')
        for (var i in tx['inputs']) {

            var inp = tx['inputs'][i];

            var addrind = utxo.get("address/" + inp.prevAddress);
            if (!addrind || !(addrind instanceof Array))
                addrind = [];

            var finded = 0;
            for (var i in addrind) {
                if (addrind[i].tx == inp.hash && addrind[i].index == inp.index) {
                    addrind[i].spentHash = tx.getHash();
                    addrind[i].spent = 1;
                    addrind[i].locked = 1;
                    changed++;
                    break;
                }
            }

            utxo.set("address/" + inp.prevAddress, addrind);

        }

        return changed;
    }
}

module.exports = obj ? obj : obj = new wallet();