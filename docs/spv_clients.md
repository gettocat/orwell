# SPV light clients

The Orwell network is ready to use spv wallets. In addition, the official spv wallet is already released as an application and is beta tested.

For the operation of light wallets, several messages have been added to the Orwell network:

| Message | Param Name | Param Description | Message Description 
|---------|------------|-------------------|--------------------
| `Filterload` | `filter` | Hex-serialized bloom filter | Sets the bloom filter for the client.
| `Fliteradd` | `filter`  |  Hex-serialized bloom filter | Adds a blam filter for the client.
| `Filterclear` | - | - | Clears the filter for the client

After the filter is installed, the client can request the update of all the block headers, and after synchronizing them - as in the case of a full node - request up to 500 of these blocks at a time. But in the case of light clients - the full node will return not the usual message `inv` with the type `blockdata`, but a special type in `inv` - `merkleblock`.

In addition, to identify the end of the search for 500 blocks, the light client will be sent an `inv` message with a `merkleblock` type containing an empty list of elements, and an `object_queryhash` field containing concatenated hash lines of the first and last blocks from the list of blocks to be received (this message informs the light client that, that you can send hashes of blocks with the following offset for a new search).

`merkleblock` contains the complete block header, as well as additional fields:
* `total_transactions` - total number of transactions in a block
* `proofs` - merklebranch array of lists, where the first element is always the requested transaction
* `flags` - is a network byte order sent as a `uint32` number, which determines the order and position of each transaction from the proofs to confirm merkleroot.

The fields `proofs` and `flags` are arrays, which is necessary when there are several transactions associated with the filter in the block.

Ultimately, merkleblock does not send a complete list of transaction hashes to the block, but only those associated with the filter (if any, otherwise it does not send the block). After receiving and verifying related transactions, an easy client can receive transaction data with a `gettxdata` message, as with unconfirmed transactions.
