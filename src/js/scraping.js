//Ajaxコールの簡易Wrapper
let ajax = {xhr: undefined, get: (url) => new Promise((res, rej) => {
    this.xhr = (this.xhr === undefined) ? new XMLHttpRequest() : xhr;
    this.xhr.open('GET', url);
    this.xhr.send();
    this.xhr.onload = () => {
        if (this.xhr.status != 200) rej(this.xhr.statusText);
        else res(this.xhr.response);
    }
})};

let constellations = [];
let baseurl = "https://ja.wikipedia.org/wiki/%E6%98%9F%E5%BA%A7%E5%88%A5%E3%81%AE%E6%81%92%E6%98%9F%E3%81%AE%E4%B8%80%E8%A6%A7";

//スクレイピング開始
ajax.get(baseurl).then(async (base) => {
  //ベースとなるページを読み込み
  let targetPage = document.createElement("html");
  targetPage.innerHTML = base;
  
  //星座の基本情報を取得（名称とリンク先）
  targetPage.querySelectorAll("table li a").forEach(l => constellations.push({name: l.text, starListLink: l.href}));

  //星座ごとにリンク先のページを読み込み、恒星リストを取得
  for await (c of constellations) {
    console.log(`${c.name} start`)
    await ajax.get(c.starListLink).then(async (page) => {
      //恒星リストを取得
      let label = [];
      let stars = [];
      let i = 0;
      //console.log(i,page)
      html = document.createElement("html");
      html.innerHTML = page;
      let starlistTrElement = html.querySelectorAll("table.wikitable.sortable tr")
      for await (tr of starlistTrElement) {
        //console.log("## get star", tr)
        if (i == 0) {
            tr.querySelectorAll("th").forEach((th) => label.push(th.querySelector("a") == null ? th.innerText : th.querySelector("a").title));
        } else {
            var star = {};
            label.forEach((l,li) => {
                star[l.trim()] = tr.querySelectorAll("td")[li].innerText.trim();
            });
            star.additional_info = {};
            let starLinkElement = tr.querySelectorAll("td")[0].querySelector("a:not(.new)");
            if (starLinkElement !== null) {
                await ajax.get(starLinkElement.href).then((starpage) => {
                    let starhtml = document.createElement("html");
                    starhtml.innerHTML = starpage;
                    starhtml.querySelectorAll("table.infobox tr").forEach(str => {
                      if (str.querySelector("th") != null && str.querySelector("td") != null) {
                          star.additional_info[str.querySelector("th").innerText.trim()] = str.querySelector("td").innerText.trim();
                      }
                    });
                });
            }
            //console.log("### => ", star)
            stars.push(star)
        }
        i++
      };
      c.link = `https://ja.wikipedia.org/wiki/${c.name}座`;
      c.stars = stars;
      console.log(c, stars)
      //星座のリンクをたどり、追加情報を取得
      await ajax.get(c.link).then((cnstpage) => {
          cnsthtml = document.createElement("html");
          cnsthtml.innerHTML = cnstpage;
          let info = {};
          cnsthtml.querySelectorAll("table.infobox tr").forEach(tr => {
              if (tr.querySelector("th") != null && tr.querySelector("td") != null) {
                  info[tr.querySelector("th").innerText.trim()] = tr.querySelector("td").innerText.trim();
              }
          });
          c.info = info;
      })
    });
    console.log(`${c.name} end`)
  }
  
  //取得内容の確認
  console.log(constellations);
});
