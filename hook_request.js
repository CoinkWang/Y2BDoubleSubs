// ==UserScript==
// @name         Youtube double language subtitle / Youtube 双语字幕 
// @version      1.5
// @description  Youtube double language subtitle / Youtube 双语字幕. 如果不能自动加载，请关闭字幕再次打开即可。默认语言为浏览器首选语言。
// @author       Coink
// @match        *://www.youtube.com/watch?v=*
// @match        *://www.youtube.com
// @match        *://www.youtube.com/*
// @require      https://unpkg.com/ajax-hook@2.0.0/dist/ajaxhook.min.js
// @grant        none
// @namespace    https://github.com/CoinkWang/Y2BDoubleSubs
// ==/UserScript==

(function() {
    let localeLang = navigator.language ? navigator.language : 'en'
    // localeLang = 'zh'  // uncomment this line to define the language you wish here
    ah.proxy({
        onResponse: (response, handler) => {
            if (response.config.url.includes('/api/timedtext') && !response.config.url.includes('&translate_h00ked')){
                let xhr = new XMLHttpRequest();
                // Use RegExp to clean '&tlang=...' in our xhr request params while using Y2B auto translate.
                let reg = new RegExp("(^|[&?])tlang=([^&]*)",'g');
                xhr.open('GET', `${response.config.url.replace(reg,'')}&tlang=${localeLang}&translate_h00ked`, false);
                xhr.send();
                let defaultJson = null, localeJson = null;
                if (response.response && JSON.parse(response.response).events){
                    defaultJson = JSON.parse(response.response)
                }
                localeJson = JSON.parse(xhr.response)
                // Merge default subs with locale language subs
                if (defaultJson.events.length === localeJson.events.length) {
                    // when length of segments are the same
                    for (let i = 0,len = defaultJson.events.length; i<len; i++) {
                        defaultJson.events[i].segs[0].utf8 += ('\n' + localeJson.events[i].segs[0].utf8)
                    }
                    response.response =  JSON.stringify(defaultJson)
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
                    }
                    response.response = JSON.stringify(localeJson)
                }
            }
            handler.resolve(response)
        }
    })
})();