import { BlockchainDBCore } from '../';
import * as IDB_VK from "idb-keyval";
import assert from "./assert";

async function test0() {
  const db = new BlockchainDBCore('qaq');
  global['db'] = db;
  return db;
}
async function test1() {
  await IDB_VK.clear();
  const db = await test0();

  const b1 = { height: 1, id: "qaq" };
  await db.upsert(b1);

  assert.deepEqualWithLog(await db.getByHeight(b1.height), b1);
  assert.deepEqualWithLog(await db.getById(b1.id), b1);

  const b2 = { height: 2, id: "zxx" };
  const b3 = { height: 3, id: "531" };
  await db.upsertList([b2, b3]);
  assert.deepEqualWithLog(await db.getByHeight(b2.height), b2);
  assert.deepEqualWithLog(await db.getById(b3.id), b3);

  const blocks = Array.from({ length: 1000 }, (_, i) => {
    return {
      height: i + 10,
      id: `xx${i}`
    }
  });
  await db.upsertList(blocks);
  return db;
}

async function test2() {
  const db = await test1();
  const max_height_1 = await db.getMaxHeight();
  await db.removeByHeight(max_height_1);
  const max_height_2 = await db.getMaxHeight();
  assert.deepEqualWithLog(max_height_1 - 1, max_height_2);
  return db;
}

async function test3() {
  await IDB_VK.clear();
  const db = await test0();
  const blocks = Array.from({ length: 1000 }, (_, i) => {
    return {
      height: i + 1,
      id: `xx${i}`
    }
  });
  await db.upsertList(blocks);

  const q1 = db.findOne((item) => item.height == 666);
  const q2 = db.findOne((item) => item.height == 777);
  assert.deepEqualWithLog((await q1).height, 666);
  assert.deepEqualWithLog((await q2).height, 777);
  const i3 = await db.findOne((item) => item.height == 555);
  const i4 = await db.findOne((item) => item.height == 444);
  assert.deepEqualWithLog(i3.height, 555);
  assert.deepEqualWithLog(i4.height, 444);
  const q5 = db.findOne((item) => item.height == 333);
  const q6 = Promise.resolve().then(() => db.findOne((item) => item.height == 222));
  assert.deepEqualWithLog((await q5).height, 333);
  assert.deepEqualWithLog((await q6).height, 222);
  return db;
}

test3();
