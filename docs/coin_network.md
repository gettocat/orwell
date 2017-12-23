# Network


## Messages

Interaction with other nodes in the network occurs via the tcp protocol, the communication algorithm is different from the bitcoin network algorithms. The flow of bytes in the orwell network looks like this:

| Magic bytes | Rand | Order | Messages | Command | Signature | Payload |
|-|-|-|-|-|-|-|
| uint32 | uint32 | uint32 | uint32 | var_str | char[32] | var_str |
| network magic bytes | random number for a set of messages | number of message in set | all messages in set count | command name | payload signature | json content |

The orwell network has the functionality to separate large messages into several small packets and send them separately. The following three parameters are necessary if one message is divided into parts.

* Rand - random number for a set of messages
* Order - part number
* Messages - number of parts

## Commands

### version
The first message that the peers must exchange, contains all the information about the client 


| Command | param name | param description |
|---------|------------|-------------------|
| Version | `version`    | client protocol version |
|         | `Lastblock.hash` |  top hash block of client |
|         | `Lastblock.height` | top height block of client |
|         | `agent` | client useragent |
|         | `agent_version` | useragent version |
|         | `relay` | if false - client is a SPV, need wait until `filterload` will be sended |


### verack
Confirmation on version message


| Command | param name | param description |
|---------|------------|-------------------|
| Verack |     | |


### Activenodes
Explore active node connections to client

| Command | param name | param description |
|---------|------------|-------------------|
| Activenodes |  `addr`   | Address of current client |
|  |  `nodes`   | List of connected active nodes |

### Ping
Check connection

| Command | param name | param description |
|---------|------------|-------------------|
| Ping |     | |

### Pong
Check connection response for ping

| Command | param name | param description |
|---------|------------|-------------------|
| Ping |     | |


### Addr
Explore new nodes to client. This message is sent to the network at certain random intervals between nodes to add new nodes.

| Command | param name | param description |
|---------|------------|-------------------|
| addr |  `Top.height`   | Top height of sender |
|  |  `Top.hash`   | Top hash of sender |
|  |  `nodes`   | List of connected active nodes |

### inv
Invectory vector message comes in response to all messages related to information retrieval and synchronization

| Command | param name | param description |
|---------|------------|-------------------|
| inv |  `object_type`   | Object type 
|||Block - list of block hashes
|||Blockdata - block contents
|||Tx - list of transaction hashes from memory pool
|||Txdata - the contents of the transaction
|||Newblock - received a new block from the network
|||Newtx - new transaction received from the network |
|  |  `Top.hash`   | Top hash of sender |
|  |  `nodes`   | List of connected active nodes |
|  | `synced` | The synchronization flag (only for type = block)
|  | `object_count` | common count items in vector
|  | `object_offset` | vector offset from 0
|  | `object_next_offset` | next offset in vector, because every node can setup own limit
|  | `object_listed` | count items in message
|  | `object_list` | Array of items
|  | `object_queryhash` | request hash


 
