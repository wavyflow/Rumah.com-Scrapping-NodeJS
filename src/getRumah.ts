import { db } from "./database";

db.ready(async () => {
  const rumah = await db.ref("rumah").get();

  if (rumah.exists()) {
    console.log(rumah.val())
  }
});
