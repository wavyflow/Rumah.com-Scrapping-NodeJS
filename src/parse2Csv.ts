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
        // {
        //     id: 'tempatParkir',
        //     title: 'Jumlah Tempat Parkir',
        // },
        // {
        //     id: 'lantai',
        //     title: 'Jumlah Lantai'
        // },
        {
            id: 'listrik',
            title: 'Daya Listrik (KWh)',
        },
    ]
})

function convertCurrencyToNumber(currency: string): number {
    const regex = /^Rp\s*([\d.,]+)\s*(jt|M)?$/i;
    const match = currency.match(regex);
  
    if (match) {
      const amount = match[1].replace(/,/g, '');
      const unit = match[2];
  
      let multiplier = 1;
  
      if (unit === 'jt') {
        multiplier = 1e6; // 1 juta
      } else if (unit === 'M') {
        multiplier = 1e9; // 1 miliar
      }
  
      return parseFloat(amount) * multiplier;
    }
  
    return 0;
  }
  

db.ready(async() => {
    const rumahRef = await db.ref('rumah').get()
    const rumah = rumahRef.exists() ? rumahRef.val() : null

    const records: any[] = Object.keys(rumah).map((val) => {
        // rumah[val].harga != undefined && rumah[val].harga != '' && rumah[val].harga.includes('Rp') == false
        if (rumah[val].harga == undefined && (rumah[val].harga == '' && rumah[val].harga.includes('Rp') == false)) {
            return;
        }

        rumah[val].harga = convertCurrencyToNumber(rumah[val].harga)

        if (rumah[val].harga < 1) {
            return undefined
        }

        rumah[val].luasBangunan = getNumber(rumah[val].luasBangunan)
        rumah[val].luasTanah = getNumber(rumah[val].luasTanah)

        if (rumah[val].luasBangunan >= rumah[val].luasTanah) {
            return undefined
        }

        return rumah[val]
    }).filter((val) => {
        return val != undefined
    })

    // Make empty file
    closeSync(openSync(path, 'w'))

    writer.writeRecords(records)

    console.log(`Data has been parsed to CSV: ${path}`)
})