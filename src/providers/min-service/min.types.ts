export type DelegateModel = {
  username: string;
  address: string;
  publicKey: string;
  vote: number;
  producedblocks: string;
  missedblocks: string;
  virgin: boolean;
  rate: number;
  productivity: string;
};

export type RankModel = {
  _id: string;
  address: string;
  dateCreated: string;
  profit: string;
  uniqueId: string;
  rate: string;
};
