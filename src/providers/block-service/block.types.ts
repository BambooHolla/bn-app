export type BlockModel = {
  id: string;
  version: number;
  timestamp: number;
  height: number;
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
};

export type SingleBlockModel = {
  height: number;
  id: string;
  timestamp: number;
};

export type BlockResModel = {
  success: boolean;
  count: number;
  blocks: BlockModel[];
};
