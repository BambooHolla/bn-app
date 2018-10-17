export type DB_Config = {
    total_num: number
    page_size: number
}
export type DB_Item_Index = {
    page_index: number,
    arr_index: number
}
export type BlockModel = import('../../src/providers/block-service/block.types').BlockModel;