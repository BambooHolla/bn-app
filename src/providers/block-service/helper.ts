import { FangoDBFactory, FangoDBWorkerFactory } from "fangodb";
import { BlockModel } from './block.types'
const block_indexs: any = [{
    key: "timestamp",
    type: "number",
},
{
    key: "height",
    type: "number",
}]
export function BlockDBFactory(dbname: string) {
    return FangoDBFactory<BlockModel>(dbname, block_indexs)
}
export function BlockDBWorkerFactory(dbname: string) {
    return FangoDBWorkerFactory<BlockModel>(dbname, block_indexs)
}