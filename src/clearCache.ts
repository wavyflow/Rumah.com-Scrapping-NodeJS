import { db } from "./database";

db.ready(async () => {
    await db.ref('finished-page').remove()
})