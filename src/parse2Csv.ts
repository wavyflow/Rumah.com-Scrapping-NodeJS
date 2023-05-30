import { createObjectCsvWriter } from "csv-writer";
import { db } from "./database";
import { closeSync, openSync } from "fs";

const path = `./csv-${(new Date()).getTime()}.csv`;

const writer = createObjectCsvWriter({
    encoding: 'utf8',
    append: false,
    path,
    header: [
        {
            id: 'harga',
            title: 'Harga (Rp)',
        },
        {
            id: 'luasTanah',
            title: 'Luas Tanah (m²)',
        },
        {
            id: 'luasBangunan',
            title: 'Luas Bangunan (m²)',
        },
        {
            id: 'kamarTidur',
            title: 'Jumlah Kamar Tidur',
        },
        {
            id: 'kamarMandi',
            title: 'Jumlah Kamar Mandi',
        },
        {
            id: 'tempatParkir',
            title: 'Jumlah Tempat Parkir',
        },
        {
            id: 'listrik',
            title: 'Daya Listrik (KWh)',
        },
    ]
})

db.ready(async() => {
    const rumahRef = db.ref('rumah').get()
    const rumah = (await rumahRef).exists() ? (await rumahRef).val() : null

    const records = Object.keys(rumah).map((val) => {
        return rumah[val]
    })

    // Make empty file
    closeSync(openSync(path, 'w'))

    writer.writeRecords(records)

    console.log(`Data has been parsed to CSV: ${path}`)
})