// ==UserScript==
// @name         Youtube double language subtitle / Youtube 双语字幕
// @version      1.7.0
// @description  Youtube double language subtitle / Youtube 双语字幕. 如果不能自动加载，请关闭字幕再次打开即可。默认语言为浏览器首选语言。
// @author       Coink
// @match        *://www.youtube.com/watch?v=*
// @match        *://www.youtube.com
// @match        *://www.youtube.com/*
// @require      https://unpkg.com/ajax-hook@2.0.2/dist/ajaxhook.min.js
// @grant        none
// @namespace    https://github.com/CoinkWang/Y2BDoubleSubs
// ==/UserScript==

(function() {
    let localeLang = navigator.language ? navigator.language : 'en'
        // localeLang = 'zh'  // uncomment this line to define the language you wish here
    ah.proxy({
        onRequest: (config, handler) => {
            handler.next(config);
        },
        onResponse: (response, handler) => {
            if (response.config.url.includes('/api/timedtext') && !response.config.url.includes('&translate_h00ked')) {
                let xhr = new XMLHttpRequest();
                // Use RegExp to clean '&tlang=...' in our xhr request params while using Y2B auto translate.
                let reg = new RegExp("(^|[&?])tlang=([^&]*)", 'g');
                xhr.open('GET', `${response.config.url.replace(reg,'')}&tlang=${localeLang}&translate_h00ked`, false);
                xhr.send();
                let defaultJson = null,
                    localeJson = null;
                if (response.response && JSON.parse(response.response).events) {
                    defaultJson = JSON.parse(response.response)
                }
                localeJson = JSON.parse(xhr.response)
                let isOfficialSub = true;
                for (let i = 0; i < defaultJson.events.length; i++) {
                    if (defaultJson.events[i].segs && defaultJson.events[i].segs.length > 1) {
                        isOfficialSub = false;
                        break;
                    }
                }
                // Merge default subs with locale language subs
                if (isOfficialSub) {
                    // when length of segments are the same
                    for (let i = 0, len = defaultJson.events.length; i < len; i++) {
                        if (!defaultJson.events[i].segs) continue
                        if (defaultJson.events[i].segs[0].utf8 !== localeJson.events[i].segs[0].utf8) {
                            // not merge subs while the are the same
                            defaultJson.events[i].segs[0].utf8 += ('\n' + localeJson.events[i].segs[0].utf8)
                                // console.log(defaultJson.events[i].segs[0].utf8)
                        }
                    }
                    response.response = JSON.stringify(defaultJson)
                } else {
                    // when length of segments are not the same (e.g. automatic generated english subs)
                    let pureLocalEvents = localeJson.events.filter(event => event.aAppend !== 1 && event.segs)
                    for (let i = 0, len = defaultJson.events.length; i < len; i++) {
                        if (!defaultJson.events[i].segs) continue
                        let currentdefaultEvent = defaultJson.events[i]
                        let currentStart = currentdefaultEvent.tStartMs,
                            currentEnd = currentStart + currentdefaultEvent.dDurationMs
                        let currentLocalEvents = pureLocalEvents.filter(pe => currentStart <= pe.tStartMs && pe.tStartMs < currentEnd)
                        let localLine = '',
                            defaultLine = ''
                        currentLocalEvents.forEach(ev => {
                            ev.segs.forEach(seg => (localLine += seg.utf8));
                            localLine += ' '; // add space to avoid words stick together
                        })
                        currentdefaultEvent.segs.forEach(seg => (defaultLine += seg.utf8))
                        defaultJson.events[i].segs[0].utf8 = defaultLine + '\n' + localLine
                        defaultJson.events[i].segs = [defaultJson.events[i].segs[0]]
                            // console.log(defaultJson.events[i].segs[0].utf8)
                    }
                    response.response = JSON.stringify(defaultJson)
                }
            }
            handler.resolve(response)
        }
    })
})();