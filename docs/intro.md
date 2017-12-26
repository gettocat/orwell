# Orwell protocol documentation

## Introduction
 
Orwell full node now based on javascript language on nodejs technology (without native C/C++ plugins). 
 Version 0.0.1 was developed between 07.07.2017 and 07.10.2017, during this time, the following modules were developed:
* Nodejs bitcoin protocol implementation
https://github.com/gettocat/bitPony - independent module for serializing byte sequences from ordinary scalar and vector types (and vice versa) used in the bitcoin algorithm (and orwell). The algorithm is necessary in order to transfer transactions in byte sequence format and to sign them. Implements all the basic bitcoin data types, such as: var_str, var_int, tx_in, tx_out, tx, blockheader, block. It is 100% test covered. Used in the orwell kernel.

* Db to blockchain sync module
https://github.com/gettocat/orwelldb - independent module that allows you to synchronize data from the database to the block system and vice versa. This module converts the data into a sequence of datascript-bytes of strings with the possibility of subsequent writing in the transaction to the block system (without special modifications of the core of the block system) or vice versa, synchronizing the contents of the blocking system to the database. It is test covered on 80%. Used in the orwell kernel.

In addition, orwell, the algorithm for serializing jsonhex (hexon) and datascript was developed.

The types of data described below are bitcoin data types, you can read about them in the documentation of the bitcoin itself:
* Var_int - https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
* Var_str -  https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_string

These data types are used in bitcoin to save space. They are also implemented in the bitPony library described above and all the following protocols are based on these types of data.



# Contents

1. [Jsonhex algorithm](https://github.com/gettocat/orwell/blob/master/docs/jsonhex.md)
2. [Datascript protocol](https://github.com/gettocat/orwell/blob/master/docs/datascript.md)
3. [Orwell overview](https://github.com/gettocat/orwell/blob/master/docs/coin_overview.md)
4. [Orwell network protocol](https://github.com/gettocat/orwell/blob/master/docs/coin_network.md)
5. [Democracy](https://github.com/gettocat/orwell/blob/master/docs/democracy.md)
6. [Blockchain](https://github.com/gettocat/orwell/blob/master/docs/blockchain.md)
7. [Network difficulty](https://github.com/gettocat/orwell/blob/master/docs/difficulty.md)
8. [Network Consensus](https://github.com/gettocat/orwell/blob/master/docs/consensus_rules.md)
9. [Network Datascript Consensus](https://github.com/gettocat/orwell/blob/master/docs/datascript_overview.md)
10. [Network Domains](https://github.com/gettocat/orwell/blob/master/docs/datascript_consensus.md)
11. [SPV and light clients](https://github.com/gettocat/orwell/blob/master/docs/spv_clients.md)
12. [Fees](https://github.com/gettocat/orwell/blob/master/docs/fees.md)
