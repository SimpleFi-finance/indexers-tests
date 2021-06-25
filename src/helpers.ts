import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts/index';
import { store, log } from '@graphprotocol/graph-ts';
import {
  Account,
  Token,
  Market,
  MarketSnapshot,
  Transaction,
  AccountPosition,
  Position,
  PositionSnapshot,
  Pair,
  PairSnapshot,
  Mint,
  Burn,
} from '../types/schema';
import { ERC20 } from '../types/UniswapV2Factory/ERC20';
import { ERC20NameBytes } from '../types/UniswapV2Factory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../types/UniswapV2Factory/ERC20SymbolBytes';

export let ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export let FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);

/**
 * Find or Create a Account entity with `id` and return it
 * @param id
 */
export function findOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (account == null) {
    account = new Account(id);
    account.save();
  }

  return account as Account;
}

/**
 * Find or Create a Token entity with `id` and return it
 * @param id
 * @param blockNumber
 * @param timestamp
 * @param market
 */
export function findOrCreateToken(id: string, blockNumber: BigInt, timestamp: BigInt, market: string): Token {
  let token = Token.load(id);

  if (token == null) {
    token = createToken(id, blockNumber, timestamp, market);
  }

  return token as Token
}

/**
 * Create a Currency Entity in storage.
 * Populate fields by fetching data from the blockchain.
 * @param id
 */
export function createToken(id: string, blockNumber: BigInt, timestamp: BigInt, market: string): Token {
  let token = new Token(id);

  if (id === ADDRESS_ZERO) {
    token.name = 'Ethereum';
    token.symbol = 'ETH';
    token.decimals = 18;
    token.save();
    return token;
  }

  let name = fetchCurrencyName(Address.fromString(id));
  let symbol = fetchCurrencySymbol(Address.fromString(id));
  let decimals = fetchCurrencyDecimals(Address.fromString(id));

  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;
  token.blockNumber = blockNumber;
  token.timestamp = timestamp;
  token.mintedByMarket = market;

  token.save();
  return token;
}

/**
 * Fetch the `decimals` from the specified ERC20 contract on the blockchain
 * @param currencyAddress
 */
export function fetchCurrencyDecimals(currencyAddress: Address): i32 {
  let contract = ERC20.bind(currencyAddress);
  // try types uint8 for decimals
  let decimalValue = null;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }
  return decimalValue as i32;
}

/**
 * Fetch the `symbol` from the specified ERC20 contract on the Blockchain
 * @param currencyAddress
 */
export function fetchCurrencySymbol(currencyAddress: Address): string {
  let contract = ERC20.bind(currencyAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(currencyAddress);

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown';
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue as string;
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = ZERO_BI;
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value;
  }
  return totalSupplyValue as BigInt;
}

/**
 * Fetch the `name` of the specified ERC20 contract on the blockchain
 * @param currencyAddress
 */
export function fetchCurrencyName(currencyAddress: Address): string {
  let contract = ERC20.bind(currencyAddress);
  let contractNameBytes = ERC20NameBytes.bind(currencyAddress);

  // try types string and bytes32 for name
  let nameValue = 'unknown';
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

/**
 * Fetch the PairData
 * @param currencyAddress
 */
 export function fetchTotalSupply(currencyAddress: Address): BigInt {
  let contract = ERC20.bind(currencyAddress);

  let result = contract.totalSupply();
  return result;
}

/**
 * Create New Pair Entity
 * @param id
 * @param factory
 * @param token0
 * @param token1
 * @param reserve0
 * @param reserve1
 * @param totalSupply
 * @param blockNumber
 * @param timestamp
 * @param history
 */
export function createPair(
  id: string,
  factory: string,
  token0: string,
  token1: string,
  blockNumber: BigInt,
  timestamp: BigInt,
  // history: string[],
): Pair {
  let pair = new Pair(id);
  if (pair == null) {
    pair.factory = factory;
    pair.token0 = token0;
    pair.token1 = token1;
    pair.reserve0 = ZERO_BI;
    pair.reserve1 = ZERO_BI;
    pair.totalSupply = ZERO_BI;
    pair.blockNumber = blockNumber;
    pair.timestamp = timestamp;
    // pair.history = history;
  
    pair.save();
  }
  return pair;
}

function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001';
}

