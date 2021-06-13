import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ERC20 } from '../generated/Factory/ERC20'
import { Account, AccountPosition, Market, Pair, PairSnapshot, Position, PositionSnapshot, Transaction } from '../generated/schema'

export const ZeroAddress = '0x0000000000000000000000000000000000000000'
export const FactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
export let ZERO = BigInt.fromI32(0)
export let ONE = BigInt.fromI32(1);

export function getTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (!symbolResult.reverted) {
    symbolValue = symbolResult.value
  }
  return symbolValue
}

export function getTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (!nameResult.reverted) {
    nameValue = nameResult.value
  }
  return nameValue
}

export function getTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress)
  let decimalValue = null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return decimalValue as i32
}

export function createAccount(address: string): Account {
  let account = Account.load(address)
  if (account === null) {
    account = new Account(address)
    account.save()
  }
  return account as Account
}

export function bigIntToDecimal(amount: BigInt, decimals: i32 = 18): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.toBigDecimal().div(scale)
}

export function createPosition(account: Account, exchangeAddress: string, type: string, transaction: Transaction): Position {
  let id = account.id
    .concat('-')
    .concat(exchangeAddress).concat('-').concat(type)
  let accountPosition = AccountPosition.load(id)
  if (accountPosition === null) {
    accountPosition = new AccountPosition(id)
    accountPosition.positionCounter = ZERO
    accountPosition.save()
  }
  let positionId = accountPosition.id.concat('-').concat(accountPosition.positionCounter.toHexString())
  let position = Position.load(positionId)
  if (position == null) {
    position = new Position(positionId)
    position.accountPosition = accountPosition.id
    position.account = account.id
    position.accountAddress = account.id
    position.market = exchangeAddress
    position.marketAddress = exchangeAddress
    position.positionType = type
    position.outputTokenBalance = ZERO
    position.closed = false
    position.blockNumber = transaction.blockNumber
    position.timestamp = transaction.timestamp
    position.historyCounter = ZERO
    position.rewardTokenBalances = []
    position.transferredTo = []
    accountPosition.positionCounter = accountPosition.positionCounter.plus(ONE)
    accountPosition.save()
  }
  position.positionType = type
  position.inputTokenBalances = transaction.inputTokenAmounts
  return position as Position
}

export function updatePosition(userId: string, exchangeAddress: string, type: string, transaction: Transaction): Position {
  let id = userId
    .concat('-')
    .concat(exchangeAddress).concat('-').concat(type)
  let accountPosition = AccountPosition.load(id)
  let positionId = accountPosition.id.concat('-').concat(accountPosition.positionCounter.toHexString())
  let position = Position.load(positionId)
  position.inputTokenBalances = transaction.inputTokenAmounts
  position.historyCounter = position.historyCounter.plus(ONE)
  return position as Position
}

export function createPositionSnapshot(position: Position, transaction: Transaction): void {
  let id = position.id
    .concat('-')
    .concat(position.historyCounter.toHexString())
  let positionSnapshot = new PositionSnapshot(id)
  positionSnapshot.position = position.id
  positionSnapshot.transaction = transaction.id
  positionSnapshot.outputTokenBalance = position.outputTokenBalance
  positionSnapshot.inputTokenBalances = position.inputTokenBalances
  positionSnapshot.rewardTokenBalances = position.rewardTokenBalances
  positionSnapshot.transferredTo = position.transferredTo
  positionSnapshot.save()
}

export function createPairSnapshot(pair: Pair, event: ethereum.Event): void {
  let id = event.transaction.hash
    .toHexString()
    .concat('-')
    .concat(event.logIndex.toHexString())
  let pairSnapshot = new PairSnapshot(id)
  pairSnapshot.pair = pair.id
  pairSnapshot.reserve0 = pair.reserve0
  pairSnapshot.reserve1 = pair.reserve1
  pairSnapshot.totalSupply = pair.totalSupply
  pairSnapshot.blockNumber = pair.blockNumber
  pairSnapshot.timestamp = pair.timestamp
  pairSnapshot.transactionHash = event.transaction.hash.toHexString()
  pairSnapshot.transactionIndexInBlock = event.transaction.index
  pairSnapshot.logIndex = event.transactionLogIndex
  pairSnapshot.save()
}

export function createMarket(pair: Pair): Market {
  let market = Market.load(pair.id)
  if (market == null) {
    market = new Market(pair.id)
    market.account = pair.factory
    market.protocolName = 'UNISWAP_V2'
    market.protocolType = 'EXCHANGE'
    market.outputToken = pair.id
    market.blockNumber = pair.blockNumber
    market.timestamp = pair.timestamp
    market.inputTokens = [pair.token0, pair.token1]
    market.save()
  }
  return market as Market
}