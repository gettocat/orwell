[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# Datascript consensus

The general principle of datascript operation is described in the chapter with the same name, and the rules for checking new datascript are described in the previous chapter about the validation of transactions.

This block describes the principle of working datascript in the context of the blockchain network:

* The database name is `RIPEMD160` from the public key (base58 decoded address without version byte and check bits).
* Each database can contain an unlimited number of dataset. In this case, each dataset must be created with the create command (see the section on transaction validation).
* When creating a transaction, it is necessary to take into account that the public key of the sender is taken from the `scriptSig` of the first input of the transaction, so the coinbase transaction can not contain datascript. In addition, the datascript transaction must have a minimum of 2 exits. First, to the address of the database (can be zero), the second - change address (it can be the address of the sender).
* The amount of sending when writing to the database can be zero, but at the same time for each operation (as for each byte) you need to pay a commission, so you can not send a completely zero transaction.
* Examples of databases can be found in the unit browser http://orwellscan.org/databases
* Example dataset within an existing database http://orwellscan.org/db/bab86ae181e4a7886627abe9126cfae65ec70867
* Example content of dataset http://orwellscan.org/db/bab86ae181e4a7886627abe9126cfae65ec70867/exampledata
* You can place guarantees in the blockchain.

## Guarantee

Guarantees are encrypted private keys from coins with coins. For example, at an height 10 in the block http://orwellscan.org/block/000000007dbe34322b748cfd42900d7ee0000a527375ff0eae1423e16413a090 in the transaction http://orwellscan.org/tx/840cbe932afb93e5382a44684be91b55a0962804e830e425998f20169a73e457
There is a private key from the address http://orwellscan.org/address/oKMpSkX6tLfAwnN9Aph5JegqV6EEvdFLoj with not spent output for 1000 coins. The guarantee is that while these coins are not spent - it is possible to store the encrypted information in the orwell unit with the RSA algorithm. For each encryption algorithm, a guarantee will be created and posted publicly, as well as written in checkpoints.

