var config = require('../../../config');

module.exports = function (argv) {

    console.log(config.client.name + " client " + config.client.version)
    nl()
    console.log("Usage:")
    console.log(config.client.cliname + " [option] <command>\tsend command to " + config.client.name)
    console.log(config.client.cliname + " <command> help\t help about command")
    console.log(config.client.cliname + " help\t commands list")
    nl()
    console.log("Available Commands:")
    console.log("> addresses:")
    console.log(config.client.cliname + " getaddressbalance <address>")//done
    console.log(config.client.cliname + " getaddressmempool <address>")//done
    console.log(config.client.cliname + " getaddresstxids <address>")//done
    nl()
    console.log("> blockchain:")
    console.log(config.client.cliname + " getbestblockhash")//done
    console.log(config.client.cliname + " getblock <hash1,...,hashN>")//done
    console.log(config.client.cliname + " getblockcount")//done
    console.log(config.client.cliname + " getblockhash <index>")//done
    console.log(config.client.cliname + " getblockheader <hash1,...,hashN>")//done
    console.log(config.client.cliname + " getdifficulty")//done
    console.log(config.client.cliname + " getmempoolinfo")//done
    console.log(config.client.cliname + " getrawmempool")//done
    console.log(config.client.cliname + " gettxout <txid> <n>")//done
    console.log(config.client.cliname + " consensus")//done
    console.log(config.client.cliname + " gettx <hash>")//done
    console.log(config.client.cliname + " printtx <hash>")//done

    console.log(config.client.cliname + " getblockchaininfo")//
    console.log(config.client.cliname + " getspentinfo")
    console.log(config.client.cliname + " gettxoutproof [<txid>,...] ( blockhash )")//
    console.log(config.client.cliname + " verifychain [checklevel] [numblocks]")//
    console.log(config.client.cliname + " getblockhashes <timestamp>")//?
    nl()
    console.log("> control:")
    console.log(config.client.cliname + " help");//done
    console.log(config.client.cliname + " stop")//done

    console.log(config.client.cliname + " debug controlbytes")//
    nl()
    console.log("> democracy:")
    console.log(config.client.cliname + " democracy.create <type> [paramsjsonarray]")//create question
    console.log(config.client.cliname + " democracy.info <id>")//get info about question
    nl()
    console.log("> Mining:")
    console.log(config.client.cliname + " getblocktemplate <jsonobj>")//done
    console.log(config.client.cliname + " submitblock <json>")//done

    console.log(config.client.cliname + " getmininginfo")//
    nl()
    console.log("> Network:")
    console.log(config.client.cliname + " getconnectioncount")//
    console.log(config.client.cliname + " getnetworkinfo")//
    console.log(config.client.cliname + " getpeerinfo")//done
    console.log(config.client.cliname + " ping")//
    console.log(config.client.cliname + " addnode <host//port> ")//done
    console.log(config.client.cliname + " addnode <host> [port]")//done
    nl()
    console.log("> Rawtransactions:")
    console.log(config.client.cliname + " createrawtransaction [ [tx, indexoutinthistx, addrin] ] [ [amountinsatoshi, address] ] ( locktime )")//need update
    console.log(config.client.cliname + " createrawtransaction <hex> ( locktime )");//need update
    console.log(config.client.cliname + " sendrawtransaction [ [tx, indexoutinthistx, addrin] ] [ [amountinsatoshi, address] ] ( locktime )");//need update
    console.log(config.client.cliname + " sendrawtransaction <hex>");//need update
    console.log(config.client.cliname + " getrawtransaction <txid>");//need update
    console.log(config.client.cliname + " sendrawtransaction <hex>");//need update

    console.log(config.client.cliname + " decoderawtransaction <hex> ");
    console.log(config.client.cliname + " decodescript <hex>");//

    nl()
    console.log("> Datascript:")
    console.log(config.client.cliname + " decodedatascript <hex> [dbname]");//done //dbname used only if need decrypt datascript with keystore
    console.log(config.client.cliname + " encodedatascript <json_array_of_dscommand> [dbname]");//done //dbname used for encryption. If dbname is not specified - dont use encryption
    //pack datascript with create command and send tx to network:
    console.log(config.client.cliname + " senddatascript <fromaddress> <toaddress> <hex>");//done
    console.log(config.client.cliname + " dbcreate <fromaddress> <toaddress> <dataset> <privileges> [is_private=false]");//done //is_private - is writeScript. If true - use 0x55 0x60 (that mean check privileges table), else write for all
    console.log(config.client.cliname + " dbsettings <fromaddress> <toaddress> <dataset> <settings_json>");//done //can change only privileges and writeScript in this version.
    console.log(config.client.cliname + " dbwrite <fromaddress> <toaddress> <dataset> <data_json_array>");//done //data is array of json_content or json_content. 
    //dbgetsettings
    //address to dbname
    //dbname to address
    //work with localdb
    console.log(config.client.cliname + " syncdb <dbname>")//sync db from blockchain to local database
    console.log(config.client.cliname + " cleardb <dbname>")//clear local database
    
    
    nl()
    console.log("> Keystore:")
    console.log(config.client.cliname + " addpem <path/to/file> <dbname> [datasetname]");//done
    console.log(config.client.cliname + " rempem <dbname> [datasetname]");//done
    console.log(config.client.cliname + " getpem <dbname> [datasetname]");//done
    //todo: import/export keystore

    nl()
    console.log("> Wallet:")
    console.log(config.client.cliname + " backupwallet <path/to>")
    console.log(config.client.cliname + " dumpprivkey <address>")//done
    console.log(config.client.cliname + " dumpwallet <path/to>")
    console.log(config.client.cliname + " importwallet <path/from>")
    console.log(config.client.cliname + " importprivkey <key>")

    console.log(config.client.cliname + " getaccount <address>")//done
    console.log(config.client.cliname + " getaccountaddress <account_name>")//done
    console.log(config.client.cliname + " getaddressesbyaccount <account_name>")//done
    console.log(config.client.cliname + " getnewaddress <account_name>")//done
    console.log(config.client.cliname + " getbalance <account_name>")//done
    console.log(config.client.cliname + " getreceivedbyaccount <account_name> [confirmation=6]")
    console.log(config.client.cliname + " getreceivedbyaddress <address> [confirmation=6]")
    console.log(config.client.cliname + " printtx <txid>")//done
    console.log(config.client.cliname + " getunconfirmedbalance ")
    console.log(config.client.cliname + " getwalletinfo <account_name>")
    console.log(config.client.cliname + " listaccounts [confirmation=6]")
    console.log(config.client.cliname + " listaddressgroupings ")
    console.log(config.client.cliname + " listlockunspent ")
    console.log(config.client.cliname + " listreceivedbyaccount [minconf=6]")
    console.log(config.client.cliname + " listreceivedbyaddress [minconf=6] ")
    console.log(config.client.cliname + " listtransactions <account_name> [count=500] [fromhash]")
    console.log(config.client.cliname + " move <fromaccount> <toaccount> amount")
    console.log(config.client.cliname + " sendmany <fromaccount> {'address':amount,...}")//done
    console.log(config.client.cliname + " sendfrom <fromaccount> <address> <amount> [datascript]")//done
    console.log(config.client.cliname + " sendtoaddress <address> <amount> [datascript]")//done using 0 account
    console.log(config.client.cliname + " setaccount <address> <account>")
    console.log(config.client.cliname + " settxfee <amount>")
    console.log(config.client.cliname + " signmessage <address> <message>")


    nl()
    console.log("> Util:")
    console.log(config.client.cliname + " validateaddress <address>");
    console.log(config.client.cliname + " verifymessage <address> <signature> <message>");
}

function nl() {
    console.log("\n");
}

