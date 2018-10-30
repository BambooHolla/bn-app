export type transactionsModel = {
  success: boolean;
  transactions: Array<TransactionModel>;
  count: number;
};
export type TransactionModel = {
  id: string;
  height: number;
  blockId: string;
  type: number;
  timestamp: number;
  senderPublicKey: string;
  senderId: string;
  recipientId: string;
  senderUsername: string;
  recipientUsername: string;
  amount: string;
  fee: string;
  signature: string;
  signSignature: string;
  signatures: any;
  confirmations: string;
  asset: any;
  remark?: string;
  assetType?: string;
  dateCreated: number
};

export type timeStampModel = {
  success?: boolean;
  timestamp: number;
};

export type putTransactionReturn = {
  success?: boolean;
  transactionId: string;
};

export type QueryTransactionsResModel = {
  success: boolean;
  transactions: TransactionModel[];
  count: number;
};

export type transactionTypeModel = {
  success: boolean;
  txCounts: object;
};
export { transactionTypes as TransactionTypes } from '../../ifmchain-js-core/src';
