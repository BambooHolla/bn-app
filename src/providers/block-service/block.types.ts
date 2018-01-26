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
};
