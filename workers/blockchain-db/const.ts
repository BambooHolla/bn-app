import { PromiseOut } from "../../src/bnqkl-framework/lib/PromiseOut";

export type DB_Config = {
  max_height: number
  page_size: number
}
export type DB_Item_Index = {
  page_index: number,
  arr_index: number
}
export type BlockBaseModel = {
  id: string;
  height: number;
}

export type CacheBlockList = Map<number, BlockBaseModel>;

export type BlockFilterFunction = (item: BlockBaseModel) => boolean;

export type BlockFilterBaseWrapper = {
  filter: BlockFilterFunction,
  limit: number,
  skip: number,
  result: BlockBaseModel[],
}

export type BlockFilterWrapper = BlockFilterBaseWrapper & {
  task: PromiseOut<BlockBaseModel[]>,
}

export type QueryTask = {
  // cur_page_index: number
  filter_wrapper_map: Map<number, BlockFilterWrapper>
  task: Promise<void>
}
