import { db } from "./database";

db.ready(async () => {
    await db.ref('rumah').remove()
})