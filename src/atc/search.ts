import axios from "axios";
import { load } from "cheerio";

export interface atcType {
  name: string;
  status: boolean;
  url: string;
  urlId: string;
  code: string;
}

export const search = (code: string) => new Promise<{ list?: atcType[]; err?: string; }>((res) => {
  axios.get(`https://www.liveatc.net/search/?icao=${code}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    },
    responseType: "document",
    responseEncoding: "UTF-8"
  }).then((val) => {
    const $ = load(val.data);
    const err = $(".colmask.holygrail .colmid .colleft .col1wrap .col1 font.body font").text().trim();
    if (err && err.startsWith("ERROR:")) return res({ err: `${code}코드는 찾을수 없습니다.` });
    let list: atcType[] = [];
    $(".colmask.holygrail .colmid .colleft .col1wrap .col1 table.body tbody").each((i, el) => {
      if (i > 0) {
        let trList = $(el).children("tr").toArray();
        let url = $(trList[2]).children("td").first().children("a").attr("onclick")?.trim() || "";
        if (url && url.startsWith("myHTML5Popup")) {
          let [ urlId, code ] = url.replace(/myHTML5Popup|\(|\'|\)/g,"").split(",");
          list.push({
            name: $(trList[0]).text().trim(),
            status: $(trList[1]).children("td").first().children("font").text().trim() === "UP" ? true : false,
            url: "https://s1-fmt2.liveatc.net/" + urlId.trim(),
            urlId: urlId.trim(),
            code: code.trim()
          });
        }
      }
    });
    return res({ list: list });
  }).catch(() => {
    return res({ err: `${code}코드는 찾을수 없습니다.` });
  });
});