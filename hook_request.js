// ==UserScript==
// @name         Youtube double language subtitle / Youtube 双语字幕 
// @version      1.2
// @description  Youtube double language subtitle / Youtube 双语字幕. 如果不能自动加载，请关闭字幕再次打开即可。默认语言为浏览器首选语言。已知Bug：默认为zh-TW繁体中文时，即使请求简体中文翻译，Youtube依旧会返回繁体，已向 Youtube 提交 Issue，有新动向此处代码也会同步修改。
// @author       Coink
// @match        https://www.youtube.com/watch*
// @require      https://unpkg.com/xhook@latest/dist/xhook.min.js
// @grant        none
// @namespace    https://github.com/CoinkWang/Y2BDoubleSubs
// ==/UserScript==

(function() {
    // let localeLang = 'en'  // or comment the upper line and define the language you wish here
    let localeLang = navigator.language ? navigator.language : 'en'
    xhook.after(function (request, response) {
        if (request.url.includes('/api/timedtext') && !request.url.includes('&translate_h00ked')) {
            let xhr = new XMLHttpRequest();
            // Use RegExp to clean '&tlang=...' in our xhr request params while using Y2B auto translate.
            let reg = new RegExp("(^|[&?])tlang=([^&]*)",'g');
            xhr.open('GET', `${request.url.replace(reg,'')}&tlang=${localeLang}&translate_h00ked`, false);
            xhr.send();
            let defaultJson = null, localeJson = null;
            if (response.data && JSON.parse(response.data).events){
                defaultJson = JSON.parse(response.data)
            }
            localeJson = JSON.parse(xhr.response)
            // Merge default subs with locale language subs
            if (defaultJson.events.length === localeJson.events.length) {
                // when length of segments are the same 
                for (let i = 0,len = defaultJson.events.length; i<len; i++) {
                    defaultJson.events[i].segs[0].utf8 += ('\n' + localeJson.events[i].segs[0].utf8)
                    response.text = JSON.stringify(defaultJson)
                }
            } else {
                // when length of segments are not the same (e.g. automatic generated english subs)
                let pureEvents = defaultJson.events.filter(event => event.aAppend !== 1 && event.segs)
                for (let i = 0,len = localeJson.events.length; i<len; i++) {
                    let currentLocaleEvent = localeJson.events[i]
                    let currentRawEvents = pureEvents.filter(pe => currentLocaleEvent.tStartMs <= pe.tStartMs && pe.tStartMs < currentLocaleEvent.tStartMs + currentLocaleEvent.dDurationMs)
                    let line = '';
                    currentRawEvents.forEach(ev => {
                        ev.segs.forEach(seg => line += seg.utf8);
                        line += ' '; // add space to avoid words stick together
                    })
                    localeJson.events[i].segs[0].utf8 = line + '\n' +  localeJson.events[i].segs[0].utf8
                    response.text = JSON.stringify(localeJson)
                }
            }
        }
    });
})();