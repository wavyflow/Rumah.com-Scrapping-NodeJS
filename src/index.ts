import { getNumber } from "./getNumber";
import { parseCurrency } from "./parseCurrency";
import { Scrape } from "./scrape";
import * as cheerio from "cheerio";
import { md5 } from "./md5";
import { prompt } from "enquirer";
import cliProgress from "cli-progress";
import { db } from "./database";

interface ScrappedData {
  harga: string;
  luasTanah: string;
  luasBangunan: string;
  kamarTidur: number;
  kamarMandi: number;
  tempatParkir: number;
  listrik: number;
  sertifikat: string,
  lantai: number
}

function modifyPath(url: string, newPath: string): string {
  const urlObj = new URL(url);
  urlObj.pathname = urlObj.pathname.replace(
    /(\/properti-dijual)(\/\d+)?/,
    `$1/${newPath}`
  );
  return urlObj.toString();
}

function validateUrl(url: string): boolean {
  const regex = /^https?:\/\/(www\.)?rumah\.com\/properti-dijual/;
  return regex.test(url);
}

async function main(url: string, multibar: cliProgress.MultiBar) {
  const content = await Scrape.crawl(url);

  if (!content) {
    return;
  }

  const $ = cheerio.load(content);

  const links = $("#listings-container > .listing-card")
    .map((i, el) => {
      const unitTypes = $(el).find(".unit-types-wrapper").length;

      if (unitTypes > 0) {
        return null;
      }

      const a = $(el).find(".image-container .gallery-container > a");
      return {
        dataId:
          $(el)
            .find(".listing-viewed.badge-label.badge-label--viewed")
            .attr("data-id") ??
          a.attr("href") ??
          a.attr("title"),
        link: a.attr("href"),
        title: a.attr("title"),
      };
    })
    .toArray()
    .filter((el) => {
      return el != null;
    });

  for (const val of links) {
    if (!val.link) {
      return null;
    }

    if (
      await db.query("finished-page").filter("url", "==", val.link).exists()
    ) {
      return false;
    }

    const content = await Scrape.crawl(val.link, "h1");

    if (!content) {
      return null;
    }

    const $ = cheerio.load(content);

    const harga = $("h2.amount").text().trim() ?? 0;
    const kamarTidur = getNumber($("div.amenity:eq(0)").text().trim()) ?? 0;
    const kamarMandi = getNumber($("div.amenity:eq(1)").text().trim()) ?? 0;
    const luasTanah = $("div.amenity:eq(2)").text().trim();
    const luasBangunan = $(
      '.meta-table__item__label:icontains("Luas Bangunan")'
    )
      .next()
      .text();
    const tempatParkir = getNumber($(
      '.meta-table__item__label:icontains("Tempat Parkir")'
    )
      .next()
      .text()
      .trim()) ?? 0;
    const listrik =
      getNumber(
        $('.meta-table__item__label:icontains("Listrik")')
          .next()
          .text()
          .trim() ??
          $(".description")
            .text()
            .trim()
            .match(/([A-Z])\w+([9-9]\d{2,}|[1-9]\d{3,})(\s)?([w,k,w,a])/i)?.[0] ?? '0'
      ) ?? 0;

    const sertifikat = $(
      '.meta-table__item__label:icontains("Sertifikat")'
    )
      .next()
      .text()
      .trim()

      const lantai = getNumber($(".description")
      .text()
      .trim()
      .match(/([1-5]\,[0-9])\s*[l]/i)?.[0] ?? '1'
) ?? 1

    const scrapped: ScrappedData = {
      harga,
      luasTanah,
      luasBangunan,
      kamarTidur,
      kamarMandi,
      tempatParkir,
      listrik,
      sertifikat,
      lantai,
    };

    console.log(scrapped);

    await db.ref(`rumah/${val.dataId}`).update(scrapped);

    await db.ref(`finished-page`).push({
      url: val.link,
      hash: md5(val.link),
    });
  }
  return true;
}

async function getMaxPage(url: string) {
  const content = await Scrape.crawl(url);

  if (!content) {
    return;
  }

  const $ = cheerio.load(content);

  return parseInt($(".pagination-next").prev().text());
}

(async () => {
  try {
    const response: {
      url: string;
    } = await prompt({
      type: "input",
      name: "url",
      message: "Masukan URL Address dari rumah.com: ",
      validate(value) {
        if (!validateUrl(value)) {
          return "URL Addres not valid, url harus https://rumah.com/properti-dijual";
        }

        return true;
      },
    });

    db.ready(async () => {
      await Scrape.init();

      const maxPage = (await getMaxPage(response.url)) ?? 100;
      const multibar = new cliProgress.MultiBar(
        {
          format: "{name} | {bar} | {percentage}% || {value}/{total} page",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        },
        cliProgress.Presets.legacy
      );

      const startIndex = parseInt(
        response.url.match(/properti-dijual\/(\d+)/)?.[1] ?? "1",
        10
      );

      const b1 = multibar.create(maxPage, startIndex, {
        name: "main",
      });

      for (let i = startIndex; i <= maxPage; i++) {
        await db.ref("finished-page/last-page").update({
          val: i,
        });
        await main(modifyPath(response.url, i.toString()), multibar);
        b1.increment();
      }

      multibar.stop();

      await Scrape.close();
    });
  } catch (e) {
    console.error(e);
  }
})();
