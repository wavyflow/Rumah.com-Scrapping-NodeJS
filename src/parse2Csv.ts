import { createObjectCsvWriter } from "csv-writer";
import { db } from "./database";
import { closeSync, openSync } from "fs";
import { parseCurrency } from "./parseCurrency";
import { getNumber } from "./getNumber";

const path = `./csv/csv-${(new Date()).getTime()}.csv`;

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
            id: 'lantai',
            title: 'Jumlah Lantai'
        },
        {
            id: 'listrik',
            title: 'Daya Listrik (KWh)',
        },
    ]
})

db.ready(async() => {
    const rumahRef = await db.ref('rumah').get()
    const rumah = rumahRef.exists() ? rumahRef.val() : null

    const records: any[] = Object.keys(rumah).map((val) => {
        // rumah[val].harga != undefined && rumah[val].harga != '' && rumah[val].harga.includes('Rp') == false
        if (rumah[val].harga == undefined && (rumah[val].harga == '' && rumah[val].harga.includes('Rp') == false)) {
            return;
        }

        rumah[val].harga = parseCurrency(rumah[val].harga)
        rumah[val].luasBangunan = getNumber(rumah[val].luasBangunan)
        rumah[val].luasTanah = getNumber(rumah[val].luasTanah)
        return rumah[val]
    }).filter((val) => {
        return val != undefined
    })

    // Make empty file
    closeSync(openSync(path, 'w'))

    writer.writeRecords(records)

    console.log(`Data has been parsed to CSV: ${path}`)
})