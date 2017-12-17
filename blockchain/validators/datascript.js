/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

var script = require('../script/script')
var hash = require('../../crypto/hash')
var dscript = require('orwelldb').datascript
var config = require('../../config')


var validator = function (hex, tx, prev_body) {

    var getDatascriptList = function (dbname, raw, byDataSet) {
        var bchain = require('../index')
        var blockchain = new bchain();
        return blockchain.getDatascriptList(dbname, raw, byDataSet);
    }

    var checkfee = function (datascripts_arr) {
        var opfee = 0;
        for (var dataset in datascripts_arr) {
            for (var k in datascripts_arr[dataset]) {
                opfee += config.wallet.operationfee[datascripts_arr[dataset][k].operator]
            }
        }

        var size = new Buffer(hex, 'hex').length;
        opfee += size * config.wallet.fee.minimum;

        var l = tx.out;
        var outamount = 0;
        for (var k in l) {
            var res = l[k].amount;
            outamount += res;
        }

        var inamount = 0;
        for (var k in tx.in) {

            var p = prev_body[k].out[tx.in[k].index];
            if (p) {
                inamount += p.amount;
            }
        }

        return inamount - outamount >= opfee;
    }

    var getLastSettings = function (datasetname) {
        var lastsett = null, owner = null
        var l = list[datasetname];
        for (var i in l) {
            if (l[i].operator == 'settings' || l[i].operator == 'create') {
                lastsett = l[i];
                if (!owner && lastsett.content && lastsett.content.owner_key)
                    owner = lastsett.content.owner_key
            }
        }

        if (!lastsett) {
            for (var i in datascripts[datasetname]) {
                if (datascripts[datasetname][i].operator == 'settings' || datascripts[datasetname][i].operator == 'create') {
                    lastsett = datascripts[datasetname][i];
                    if (!owner && lastsett.content && lastsett.content.owner_key)
                        owner = lastsett.content.owner_key
                }
            }
        }

        if (lastsett && lastsett.content)//hack. Settings does not have owner_key (its little bit a bug)
            lastsett.content.owner_key = owner;

        return lastsett;
    }

    var checkOwner = function (ds) {
        if (ds.operator == 'settings') {

            var lastsett = getLastSettings(ds.dataset);
            if (!lastsett)//not possible situation (in ordinary way)
                return false;

            return lastsett.owner_key == pubkey;
        }

        return true;
    }

    var checkDomainHistory = function (pubkey, content) {
        var writers = [], l = list['domain'];

        for (var k in l) {
            var history = l[k];
            if (history.operator != 'write')
                continue;

            if (history.content && history.content.domain == content.domain && history.writer)
                writers.push(history.writer)

        }

        if (writers.length > 0) {//update
            //check owner or previous writer
            if (writers.indexOf(pubkey) >= 0)
                return true;
            else {
                return false;
            }
        }

        return true;//insert
    }



    if (!tx.datascript)
        return checkfee([]);

    var arr = dscript.readArray(tx.datascript);
    var datascripts = {}, dsvalid = 0;
    for (var i in arr) {
        var ds = new dscript(arr[i]).toJSON();
        if (!datascripts[ds.dataset])
            datascripts[ds.dataset] = [];
        if (ds.success) {
            dsvalid++;
            datascripts[ds.dataset].push(ds);
        }
    }



    var dbname = script.scriptToAddrHash(tx.out[0].scriptPubKey).toString('hex');
    var a = script.sigToArray(tx.in[0].scriptSig);
    var pubkey = a[1];
    var list = getDatascriptList(dbname, false, true);

    var arr = {
        'ds_countisvalid': arr.length == dsvalid,
        'dbisexist': function (validator) {
            //get all ds list to this db
            //check - first ds !!!must be create only!!!
            //transaction with datascript ins:
            //0 - one input with scriptSig, which contain pubkey from privileges
            //transaction with datascripts outs:
            //0 - destination db with amount > opfee
            //1 - change
            var res = [];

            for (var datasetname in datascripts) {
                var ds = datascripts[datasetname];

                var first = null;
                if (list[datasetname] && list[datasetname].length) {
                    first = list[datasetname][0];
                } else {
                    first = ds[0];
                }

                if (first.operator != 'create') {
                    res.push(0);
                    validator.debug.push("datasciprt[" + i + "] dataset " + datasetname + " already created correctly: false");
                } else
                    res.push(1);

            }


            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length

        },
        'settingsCanChangeOnlyOwner': function (validator) {
            var res = [];

            for (var datasetname in datascripts) {
                var ds = datascripts[datasetname];

                for (var k in ds) {

                    if (ds[k] == 'settings') {

                        if (!checkOwner(ds[k])) {
                            res.push(0);
                            validator.debug.push("datascript[" + i + "].settings changed by owner: false");
                        } else
                            res.push(1);

                    }

                }

            }


            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length
        },
        'createOnlyOnce': function (validator) {
            var res = [];

            for (var datasetname in datascripts) {
                var ds = datascripts[datasetname];

                var findedCreate = 0;
                for (var k in ds) {
                    if (ds[k].operator == 'create')
                        findedCreate++;
                }

                var findedInDB = false;
                if (list[datasetname]) {
                    var first = list[datasetname][0];
                    if (first && first.operator == 'create')
                        findedInDB = true;
                }

                if (findedInDB) {
                    if (findedCreate == 0) {
                        res.push(1);
                    } else {
                        validator.debug.push("datascript in dataset " + datasetname + " is create op, have in db: true, have in ds only one: false");
                        res.push(0);
                    }
                } else {
                    if (findedCreate == 1) {
                        res.push(1);
                    } else {
                        res.push(0)
                        validator.debug.push("datascript in dataset " + datasetname + " is create op, have in db: false, have in ds only one: false");
                    }
                }

            }



            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length
        },
        'canWrite': function (validator) {
            //get db settings writeScript, check privileges
            var res = [];

            for (var datasetname in datascripts) {
                var ds = datascripts[datasetname];
                var lastsett = getLastSettings(datasetname);


                if (!lastsett) {
                    validator.debug.push("datascript.lastsettings (settings or create script) found: false");
                    res.push(0);
                    continue;
                }

                if (!lastsett.content) {
                    validator.debug.push("datascript.lastsettings.content not empty: false");
                    res.push(0);
                    continue;
                }

                if (!lastsett.content.writeScript) {
                    res.push(1);
                    continue;
                }

                if ((lastsett.content.writeScript == '5560' || lastsett.content.writeScript == 5560)) {
                    if ((lastsett.content.privileges.indexOf(pubkey) >= 0 || lastsett.content.owner_key == pubkey)) {
                        res.push(1);
                        continue;
                    } else {
                        validator.debug.push("datascript.writeScript rule x55 x60 - can write only owner success: false");
                        res.push(0);
                        continue;
                    }
                } else if (!lastsett.content.writeScript)
                    res.push(1);
            }



            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length
        },
        'canEdit': function (validator) {
            //if entry is exist in db, and send this entry with similar oid - check, that previously sender send data (or owner|have privileges). And for writeScript = '' TOO!
            var res = [];

            for (var datasetname in datascripts) {
                var ds = datascripts[datasetname];
                var lastsett = getLastSettings(datasetname);

                if (!lastsett) {
                    validator.debug.push("dataset[" + datasetname + "] finded dataset_settings: false");
                    res.push(0)
                    continue;
                }

                if (!list[datasetname] || !list[datasetname].length)
                    continue;//no have history, havent edit yet

                for (var i in ds) {
                    var writers = [];
                    if (ds[i].operator == 'write' && ds[i].content) {//only with public datascript. Private datascripts dont check with this rule.
                        for (var k in list[datasetname]) {
                            var history = list[datasetname][k];
                            if (history.operator != 'write')
                                continue;

                            if (history.content && history.content.oid == ds[i].content.oid && history.writer) {
                                writers.push(history.writer)
                            }
                        }

                        if (writers.length > 0) {
                            //check owner or previous writer
                            if (writers.indexOf(pubkey) >= 0 || lastsett.content.privileges.indexOf(pubkey) >= 0 || lastsett.content.owner_key == pubkey)
                                res.push(1);
                            else {
                                res.push(0);
                                validator.debug.push("datascript[" + i + "] edit can only owner, or privileged keys or previous writer: false");
                            }
                        }
                    }
                }


            }


            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length
        },
        'fee': checkfee(datascripts),
        'domaincheck': function (validator) {
            var res = [];

            if (dbname == 'b96d613764d55f0866c6f0445166ad729a0b2a10') {//special rule for this db/domain

                for (var datasetname in datascripts) {
                    if (datasetname == 'domain') {

                        var ds = datascripts[datasetname];

                        for (var k in ds) {

                            if (ds[k].operator == 'write' && ds[k].content) {
                                var content = ds[k].content;
                                //now we in db b96d613764d55f0866c6f0445166ad729a0b2a10/domain and ds[k].content is try to write in this db
                                //we need, that format of entry will be valid {oid: 'somehex', domain: 'something regexp', address: 'validaddress'}
                                //and if address with this entry already have - check that previous writer change it.
                                if (!content.domain || !content.address) {
                                    res.push(0);
                                    validator.debug.push("datascript[" + k + "] valid domain entry format: false");
                                    validator.errors.push("domain/domainformatinvalid")
                                    continue;
                                }

                                if (!hash.isValidAddress(content.address)) {
                                    res.push(0);
                                    validator.debug.push("datascript[" + k + "] valid address format: false");
                                    validator.errors.push("domain/domainformatinvalid")
                                    continue;
                                }

                                if (!hash.isValidDomain(content.domain)) {
                                    res.push(0);
                                    validator.debug.push("datascript[" + k + "] valid address format: false");
                                    validator.errors.push("domain/addressformatinvalid")
                                    continue;
                                }

                                if (!checkDomainHistory(pubkey, content)) {
                                    res.push(0);
                                    validator.debug.push("datascript[" + k + "] can edit domain: false");
                                    validator.errors.push("domain/canteditdomain")
                                    continue;
                                }


                            }

                        }



                    }

                }

            }

            var sum = 0;
            for (var i in res) {
                sum += res[i];
            }

            return sum == res.length

        }
    };

    return arr;
}


module.exports = validator