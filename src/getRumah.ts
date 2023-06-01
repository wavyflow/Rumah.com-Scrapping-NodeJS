import { db } from "./database";

db.ready(async () => {
  const rumah = await db.ref("rumah").get();

  if (rumah.exists()) {
    console.log(rumah.val())
  }

  const lastPage = await db.ref("finished-page/last-page").get();

  if (lastPage.exists()) {
    console.log(lastPage.val())
  }
});
