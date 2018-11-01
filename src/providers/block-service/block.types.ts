export interface BlockModel extends SingleBlockModel {
  version: number;
  previousBlock: string;
  numberOfTransactions: number;
  totalAmount: string;
  totalFee: string;
  reward: string;
  payloadLength: number;
  payloadHash: string;
  generatorPublicKey: string;
  generatorId: string;
  blockSignature: string;
  blockSize: string;
  confirmations?: number;
  delay?: boolean;
  fake?: boolean;
  remark: string;
}

export interface SingleBlockModel {
  magic: string;
  height: number;
  id: string;
  timestamp: number;
}

export interface ForgingBlockModel extends SingleBlockModel {
  blockSize: number;
  numberOfTransactions: number;
  payloadLength: number;
  previousBlock: any;
  totalAmount: string;
  totalFee: string;
  reward: string;
  version: number;
  dateCreated: string;
  uniqueId: string;
  payloadHash: string;
  generatorPublicKey: string;
  blockSignature: string;
  remark: string;
}
export type ForgingBlockResModel = {
  success: boolean;
  count: number;
  blocks: ForgingBlockModel[];
};

export type BlockListResModel = {
  success: boolean;
  count: number;
  blocks: BlockModel[];
};
export type BlockResModel = {
  success: boolean;
  block: BlockModel;
};

export type UnconfirmBlockModel = {
  reward: number;
  fee: number;
  uncommited: number;
  height: number;
};

/**快速复制一个区块对象 */
export function formatBlockData<T extends BlockModel>(block: T): BlockModel {
  return {
    magic: block.magic,
    version: block.version,
    timestamp: block.timestamp,
    totalAmount: block.totalAmount,
    totalFee: block.totalFee,
    reward: block.reward,
    numberOfTransactions: block.numberOfTransactions,
    payloadLength: block.payloadLength,
    payloadHash: block.payloadHash,
    generatorId: block.generatorId,
    generatorPublicKey: block.generatorPublicKey,
    blockSignature: block.blockSignature,
    previousBlock: block.previousBlock,
    id: block.id,
    height: block.height,
    blockSize: block.blockSize,
    remark: block.remark,
  };
}
