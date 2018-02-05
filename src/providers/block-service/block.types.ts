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
  confirmations: string;
  totalForged: string;
  delay?: boolean;
}

export interface SingleBlockModel {
  height: number;
  id: string;
  timestamp: number;
}

export type BlockResModel = {
  success: boolean;
  count: number;
  blocks: BlockModel[];
};

export type UnconfirmBlockModel = {
  reward: number;
  fee: number;
  uncommited: number;
  height: number;
};

