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
                let url = response.config.url
                url = url.replace(/(^|[&?])tlang=[^&]*/g, '')
                url = `${url}&tlang=${localeLang}&translate_h00ked`
                xhr.open('GET', url, false);
                xhr.send();
                let defaultJson = null
                if (response.response) {
                    const jsonResponse = JSON.parse(response.response)
                    if (jsonResponse.events) defaultJson = jsonResponse
                }
                let isOfficialSub = true;
                for (const defaultJsonEvent of defaultJson.events) {
                    if (defaultJsonEvent.segs && defaultJsonEvent.segs.length > 1) {
                        isOfficialSub = false;
                        break;
                    }
                }
                // Merge default subs with locale language subs
                if (isOfficialSub) {
                    // when length of segments are the same
                    for (let i = 0, len = defaultJson.events.length; i < len; i++) {
                        const defaultJsonEvent = defaultJson.events[i]
                        if (!defaultJsonEvent.segs) continue
                        const localeJsonEvent = localeJson.events[i]
                        if (`${defaultJsonEvent.segs[0].utf8}`.trim() !== `${localeJsonEvent.segs[0].utf8}`.trim()) {
                            // not merge subs while the are the same
                            defaultJsonEvent.segs[0].utf8 += ('\n' + localeJsonEvent.segs[0].utf8)
                        }
                    }
                    response.response = JSON.stringify(defaultJson)
                } else {
                    // when length of segments are not the same (e.g. automatic generated english subs)
                    const localeJson = JSON.parse(xhr.response)
                    let pureLocalEvents = localeJson.events.filter(event => event.aAppend !== 1 && event.segs)
                    for (const defaultJsonEvent of defaultJson.events) {
                        if (!defaultJsonEvent.segs) continue
                        let currentStart = defaultJsonEvent.tStartMs,
                            currentEnd = currentStart + defaultJsonEvent.dDurationMs
                        let currentLocalEvents = pureLocalEvents.filter(pe => currentStart <= pe.tStartMs && pe.tStartMs < currentEnd)
                        let localLine = ''
                        for (const ev of currentLocalEvents) {
                            for (const seg of ev.segs) {
                                localLine += seg.utf8
                            }
                            localLine += ' '; // add space to avoid words stick together
                        }
                        let defaultLine = ''
                        for (const seg of defaultJsonEvent.segs) {
                            defaultLine += seg.utf8
                        }
                        defaultJsonEvent.segs[0].utf8 = defaultLine + '\n' + localLine
                        defaultJsonEvent.segs = [defaultJsonEvent.segs[0]]
                    }
                    response.response = JSON.stringify(defaultJson)
                }
            }
            handler.resolve(response)
        }
    })
})();