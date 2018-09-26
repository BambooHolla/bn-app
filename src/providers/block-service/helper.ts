import { FangoDBFactory, FangoDBWorkerFactory } from "fangodb";
import { global } from "../../bnqkl-framework/helper";
import { BlockModel } from "./block.types";
const block_indexs: any = [
	{
		key: "timestamp",
		type: "number",
	},
	{
		key: "height",
		type: "number",
	},
];
export function BlockDBFactory(dbname: string) {
	return FangoDBFactory<BlockModel>(dbname, block_indexs, global["file"]).then(blockDB => {
		// 默认使用高度来做为文件名
		blockDB.filenameGenerator = (uid, item) => {
			return item.height + ".data";
		};
		return blockDB;
	});
}
export function BlockDBWorkerFactory(dbname: string) {
	return FangoDBWorkerFactory<BlockModel>(dbname, block_indexs);
}
