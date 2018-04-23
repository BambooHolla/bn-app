export type userModel = {
	address: string;
	balance: string;
	publicKey: string;
	secondPublicKey: string;
	secondSignature: boolean;
	unconfirmedBalance: string;
	unconfirmedSignature: boolean;
	username: string;
};

export type AccountRoundProfitModel = {
	address: string;
	dateCreated: string;
	profit: string;
	rate: number;
	round: number;
	uniqueId: string;
	_id: string;
};
export type AccountProfitsResModel = {
	success: boolean;
	profits: AccountRoundProfitModel[];
	count: number;
};
