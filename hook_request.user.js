// ==UserScript==
// @name         Youtube double language subtitle / Youtube 双语字幕
// @version      1.8.0
// @description  Youtube double language subtitle / Youtube 双语字幕. 如果不能自动加载，请关闭字幕再次打开即可。默认语言为浏览器首选语言。
// @author       Coink
// @match        *://www.youtube.com/watch?v=*
// @match        *://www.youtube.com
// @match        *://www.youtube.com/*
// @require      https://unpkg.com/ajax-hook@2.1.3/dist/ajaxhook.min.js
// @grant        none
// @run-at       document-start
// @namespace    https://github.com/CoinkWang/Y2BDoubleSubs
// ==/UserScript==

/* global ah */

(function () {
    let localeLang = document.documentElement.lang || navigator.language || 'en' // follow the language used in YouTube Page
    // localeLang = 'zh'  // uncomment this line to define the language you wish here
    let enableFullWidthSpaceSeparation = true
    function encodeFullwidthSpace(text) {
        if (!enableFullWidthSpaceSeparation) return text
        return text.replace(/\n/g, '\n1\n').replace(/\u3000/g, '\n2\n')
    }
    function decodeFullwidthSpace(text) {
        if (!enableFullWidthSpaceSeparation) return text
        return text.replace(/\n2\n/g, '\u3000').replace(/\n1\n/g, '\n')
    }
    ah.proxy({
        onRequest: (config, handler) => {
            handler.next(config);
        },
        onResponse: (response, handler) => {
            function defaultAction() {
                handler.resolve(response)
            }
            try {
                if (!response.config.url.includes('/api/timedtext') || response.config.url.includes('&translate_h00ked')) return defaultAction()
                let defaultJson = null
                if (response.response) {
                    const jsonResponse = JSON.parse(response.response)
                    if (jsonResponse.events) defaultJson = jsonResponse
                }
                if (defaultJson === null) return defaultAction()
                let lines = []
                for (const event of defaultJson.events) {
                    for (const seg of event.segs) {
                        if ('utf8' in seg && typeof seg.utf8 === 'string') {
                            lines.push(...seg.utf8.split('\n'))
                        }
                    }
                }
                let linesText = lines.join('\n')
                linesText = encodeFullwidthSpace(linesText)
                let q = encodeURIComponent(linesText)
                fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${localeLang}&dj=1&dt=t&dt=rm&q=${q}`)
                    .then(res => {
                        return res.json()
                    })
                    .then(result => {
                        let resultText = result.sentences.map((function (s) {
                            return "trans" in s ? s.trans : "";
                        })).join("")
                        resultText = decodeFullwidthSpace(resultText)
                        return resultText.split("\n");
                    })
                    .then(translatedLines => {
                        const addTranslation = (line, idx) => {
                            if (line !== lines[i + idx]) return line
                            let translated = translatedLines[i + idx]
                            if (line === translated) return line
                            return `${line}\n${translated}`
                        }
                        let i = 0
                        for (const event of defaultJson.events) {
                            for (const seg of event.segs) {
                                if ('utf8' in seg && typeof seg.utf8 === 'string') {
                                    let s = seg.utf8.split('\n')
                                    let st = s.map(addTranslation)
                                    seg.utf8 = st.join('\n')
                                    i += s.length
                                }
                            }
                        }
                        response.response = JSON.stringify(defaultJson)
                        handler.resolve(response)
                    }).catch(e => {
                        console.warn(e)
                        defaultAction()
                    })
            } catch (e) {
                console.warn(e)
                defaultAction()
            }
        }
    })
})();
