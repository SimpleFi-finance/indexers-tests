import { log } from '@graphprotocol/graph-ts'
import {
  PairCreated,
} from '../types/UniswapV2Factory/UniswapV2Factory';
import {
  createPair,
  findOrCreateToken,
  FACTORY_ADDRESS,
} from './helpers';

/**
 * Handler called when a `PairCreated` Event is emitted
 * @param event
 */
export function handlePairCreated(event: PairCreated): void {
  let pairAddress = event.params.pair.toHexString();
  let token0Address = event.params.token0.toHexString();
  let token1Address = event.params.token1.toHexString();
  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;

  log.info(`Starting handler for handlePairCreated Event for token0: {}, token1: {}`, [
    token0Address,
    token1Address,
  ])

  // create the tokens
  findOrCreateToken(token0Address, blockNumber, timestamp, `UNISWAP_V2-${pairAddress}`);
  findOrCreateToken(token1Address, blockNumber, timestamp, `UNISWAP_V2-${pairAddress}`);
  
  createPair(pairAddress, FACTORY_ADDRESS, token0Address, token1Address, blockNumber, timestamp);
}
