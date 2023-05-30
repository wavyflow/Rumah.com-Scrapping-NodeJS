import { db } from './database';

db.ready(async () => {
  const finishedPage = await db.ref('finished-page').count()

  const rumah = await db.ref('rumah').count();

  console.log(`Cached: ${finishedPage}`)
  console.log(`Rumah: ${rumah}`)
})