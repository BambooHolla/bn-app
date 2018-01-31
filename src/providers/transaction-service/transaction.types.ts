export type transactionsModel = {
  success: boolean;
  transactions: Array<TransactionModel>;
  count: number;
};
export type TransactionModel = {
  id: string;
  height: string;
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
};

export type timeStampModel = {
  success?: boolean;
  timestamp: number;
};