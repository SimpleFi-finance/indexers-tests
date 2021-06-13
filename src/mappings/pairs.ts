import { log, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Approval, Transfer } from "../../generated/Factory/ERC20"
import { Burn, Mint, Pairs } from "../../generated/templates/Pairs/Pairs"
import { Transaction, Burn as BurnEntity, Mint as MintEntity, Token, Pair, Account, Market } from "../../generated/schema"
import { bigIntToDecimal, createAccount, createMarket, createPairSnapshot, createPosition, createPositionSnapshot, FactoryAddress, ONE, updatePosition, ZERO, ZeroAddress } from '../utils'

export function handleBurn(event: Burn): void { 
  let transaction = Transaction.load(event.transaction.hash.toHexString()) as Transaction
  let burn = BurnEntity.load(event.transaction.hash.toHexString()) as BurnEntity

  let pair = Pair.load(event.address.toHex())

  let token0 = Token.load(pair.token0)
  let token1 = Token.load(pair.token1)
  let account = Account.load(transaction.from) as Account
  let token0Input = token0.id
  .concat('-')
  .concat(burn.to).concat('-').concat(event.params.amount0.toHexString())
  let token1Input = token1.id
  .concat('-')
  .concat(burn.to).concat('-').concat(event.params.amount1.toHexString())
  transaction.inputTokenAmounts = [token0Input, token1Input]
  burn.amount0 = event.params.amount0
  burn.amount1 = event.params.amount1
  burn.burnEventApplied = true
  burn.save()
  let position = createPosition(account, pair.id, 'DEBT', transaction)
  position.save()
  createPositionSnapshot(position, transaction)
  position.historyCounter = position.historyCounter.plus(ONE)
  position.save()
}

export function handleMint(event: Mint): void {
  let transaction = Transaction.load(event.transaction.hash.toHexString()) as Transaction
  let mint = MintEntity.load(event.transaction.hash.toHexString()) as MintEntity

  let pair = Pair.load(event.address.toHex())

  let token0 = Token.load(pair.token0)
  let token1 = Token.load(pair.token1)
  let account = Account.load(transaction.from) as Account
  let token0Input = token0.id
  .concat('-')
  .concat(mint.to).concat('-').concat(event.params.amount0.toHexString())
  let token1Input = token1.id
  .concat('-')
  .concat(mint.to).concat('-').concat(event.params.amount1.toHexString())
  transaction.inputTokenAmounts = [token0Input, token1Input]
  mint.amount0 = event.params.amount0
  mint.amount1 = event.params.amount1
  mint.mintEventApplied = true
  mint.save()
  let position = createPosition(account, pair.id, 'INVESTMENT', transaction)
  position.save()
  createPositionSnapshot(position, transaction)
  position.historyCounter = position.historyCounter.plus(ONE)
  position.save()
 }

export function handleSwap(event: ethereum.Event): void { 
// TODO: Update the position 
let pair = Pair.load(event.address.toHexString())
let token0 = Token.load(pair.token0)
let token1 = Token.load(pair.token1)
}

export function handleSync(event: ethereum.Event): void {
// TODO: Update the position 
let pair = Pair.load(event.address.toHexString())
let token0 = Token.load(pair.token0)
let token1 = Token.load(pair.token1)
 }

export function handleTransfer(event: Transfer): void {
  if (event.params.to.toHexString() == ZeroAddress && event.params.value.equals(BigInt.fromI32(1000))) {
    return
  }
  let transactionHash = event.transaction.hash.toHexString()
  let from = event.params.from
  let sender = createAccount(from.toHexString())
  let to = event.params.to
  let receiver = createAccount(to.toHexString())
  let pair = Pair.load(event.address.toHexString()) as Pair
  let market = Market.load(event.address.toHexString()) as Market

  let pairContract = Pairs.bind(event.address)
  let transaction = Transaction.load(transactionHash) as Transaction
  if (transaction === null) {
    transaction = new Transaction(transactionHash)
    transaction.from = sender.id
    transaction.to = receiver.id
    transaction.blockNumber = event.block.number
    transaction.transactionType = 'INVEST'
    transaction.timestamp = event.block.timestamp
    transaction.gasUsed = event.transaction.gasUsed
    transaction.gasPrice = event.transaction.gasPrice
    transaction.timestamp = event.block.timestamp
    transaction.transactionIndexInBlock = event.transaction.index
    transaction.market = market.id
    transaction.outputTokenAmount = ZERO
    transaction.inputTokenAmounts = []
    transaction.rewardTokenAmounts = []
  }
  if (from.toHexString() == ZeroAddress) {
    pair.totalSupply = pair.totalSupply.plus(event.params.value)
    pair.save()
    createPairSnapshot(pair, event)
    let mint = MintEntity.load(transactionHash)
    if (mint === null) {
      mint = new MintEntity(transactionHash)
      mint.pair = pair.id
      mint.to = receiver.id
      mint.liquityAmount = event.params.value
      mint.transferEventApplied = true
      mint.syncEventApplied = false
      mint.mintEventApplied = false
      mint.save()
    }
  }
  if (to.toHexString() == ZeroAddress && from.toHexString() == pair.id) {
    pair.totalSupply = pair.totalSupply.minus(event.params.value)
    pair.save()
    createPairSnapshot(pair, event)
    let burn = BurnEntity.load(transactionHash)
    if (burn === null) {
      burn = new BurnEntity(transactionHash)
      burn.pair = pair.id
      burn.to = sender.id
      burn.liquityAmount = event.params.value
      burn.transferEventApplied = true
      burn.syncEventApplied = false
      burn.burnEventApplied = false
      burn.save()
    }
  }
  if (from.toHexString() != ZeroAddress && from.toHexString() != pair.id) {
    let fromUserPosistion = createPosition(sender, pair.id, 'INVESTMENT', transaction)
    fromUserPosistion.outputTokenBalance = pairContract.balanceOf(from)
    fromUserPosistion.save()
    createPositionSnapshot(fromUserPosistion, transaction)
    fromUserPosistion.historyCounter = fromUserPosistion.historyCounter.plus(ONE)
    fromUserPosistion.save()
  }

  if (event.params.to.toHexString() != ZeroAddress && to.toHexString() != pair.id) {
    let toUserPosition = createPosition(receiver, pair.id, 'INVESTMENT', transaction)
    toUserPosition.outputTokenBalance = pairContract.balanceOf(to)
    toUserPosition.save()
    createPositionSnapshot(toUserPosition, transaction)
    toUserPosition.historyCounter = toUserPosition.historyCounter.plus(ONE)
    toUserPosition.save()
  }
  transaction.save()
}
