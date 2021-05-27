# Subgraph Test

Task of the test is to implement a subgraph for Uniswap V2 protocol with given GraphQL schema. We have a schema.graphql in this repo with entity definitions. You need to implement subgraph manifest and mappings code to index these entities.

## Description of entities in schema

Purpose of this subgraph is to index liquidity positions of users in Uniswap V2 pair contracts. We also want to track changes in balance of LP token and reserve tokens for a position along with return on investment for every position.

### Account

This entity is used to store all ethereum addresses as accounts. Bonus points if you can figure out a way to detect if an address is EOA or a smart contract address. Please keep account type detection implementation at low priority. You can submit the solution with a stub method which return "EOA" for every address.

### Token

This entity is used to store all ERC20, ERC721, ERC1155 tokens. For this Uniswap V2 protocol we will be storing only ERC20 tokens.

### Market

This entity represents a pair of Uniswap V2 protocol.

### Position

This is the main entity which stores a position of a user in a specific liquidity pair. Every time there is an action by a user which changes this user's liquidity in the pair we update this position and we create a PositionSnapshot entity to store previous values. Purpose of PositionSnapshot is to keep history of changes in position of a user.

### AccountPosition

This entity is used to keep track of all historical position of a user in a pair.

### Transaction

This entity is used to track gas usage for every transaction that changes a liquidity position.

## How to submit solution?

Please create a fork of this repository. Implement the subgraph and deploy it on The Graph hosted service. Raise a pull request to this repo with your code. Along with the PR provide URL for graph explorer subgraph where we can query your subgraph entities.
