const retry = require('async-retry')
const { GraphQLClient, gql } = require('graphql-request')

async function checkHealth() {
  const endpoint = 'https://api.thegraph.com/index-node/graphql'
  const graphQLClient = new GraphQLClient(endpoint)

  const query = gql`
    {
      indexingStatusForCurrentVersion(subgraphName: "giovannidisiena/simplefi-indexers") {
        synced
        health
        fatalError {
          message
          block {
            number
            hash
          }
          handler
        }
        chains {
          chainHeadBlock {
            number
          }
          latestBlock {
            number
          }
        }
      }
    }
  `
  const results = await retry(async bail => await graphQLClient.request(query))
  console.log(results)
  return results
}

checkHealth()
