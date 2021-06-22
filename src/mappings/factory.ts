import { log } from '@graphprotocol/graph-ts'
import { PairCreated } from '../../generated/Factory/Factory'
import { Account, Market, Pair, Token } from '../../generated/schema'
import { Pair as PairTemplate } from '../../generated/templates'
import {
  createMarket,
  createMarketSnapshot,
  createPairSnapshot,
  FACTORY_ADDRESS,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  ZERO_BI
} from './helpers'

export function handlePairCreated(event: PairCreated): void {
  let factory = Account.load(FACTORY_ADDRESS)
  if (factory == null) {
    factory = new Account(FACTORY_ADDRESS)
    factory.save()
  }

  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.tokenStandard = 'ERC20'
    token0.name = fetchTokenName(event.params.token0)
    token0.symbol = fetchTokenSymbol(event.params.token0)

    let decimals = fetchTokenDecimals(event.params.token0)
    if (decimals === null) {
      log.debug('the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals.toI32()
    token0.blockNumber = event.block.number
    token0.timestamp = event.block.timestamp
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.tokenStandard = 'ERC20'
    token1.name = fetchTokenName(event.params.token1)
    token1.symbol = fetchTokenSymbol(event.params.token1)

    let decimals = fetchTokenDecimals(event.params.token1)
    if (decimals === null) {
      log.debug('the decimal on token 1 was null', [])
      return
    }

    token1.decimals = decimals.toI32()
    token1.blockNumber = event.block.number
    token1.timestamp = event.block.timestamp
  }

  let pair = new Pair(event.params.pair.toHexString()) as Pair
  pair.factory = factory.id
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.reserve0 = ZERO_BI
  pair.reserve1 = ZERO_BI
  pair.totalSupply = ZERO_BI
  pair.blockNumber = event.block.number
  pair.timestamp = event.block.timestamp

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  // TODO: figure out where this needs to go in response to schema comment
  // import factoryContract from './helpers'
  // factoryContract.feeTo(...)

  token0.save()
  token1.save()
  pair.save()
  factory.save()

  createPairSnapshot(pair, event)
  let market = createMarket(pair)
  market.save()
  createMarketSnapshot(market, event)
}
