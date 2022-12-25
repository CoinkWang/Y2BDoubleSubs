# Y2BDoubleSubs

Youtube双语字幕脚本 / Youtube double language subtitle

两种方法实现Youtube双语字幕显示，hook_request.js 效果更佳，set_interval.js 供思路参考。

# Idea

- set_interval 方法从 “解说词” 功能中根据时间戳以及 .active 选择器获取当前应该显示的字幕，将其插入“自动翻译后”的字幕旁。
优点：CSS自定义，客制化程度高。
缺点：DOM消耗大；不能主动更新，需要等待 interval 更新；CSS 继承，宽度受父元素限制，可能造成文字挤在一起。

- hook_request 方法会组装一个新的 xhr 请求翻译后的字幕，通过 xhook 拦截原请求，将新请求（翻译文字）和原请求（源字幕）中的文字部分进行合并。
优点：用户体验好，享受网站 CSS 计算属性；
缺点：遇到原字幕和翻译字幕不一一对应的时候很 egg pain，目前使用 filter 根据时间戳来判断，复杂度上升到了 O(n\*a\*b)，不过好在 a 基本是 1 或者 2，而 b 是一个句子中单词的数量，不会太大，所以都可以近似看作常数。

# Usage
hook_request 方法发布在 GreasyFork，浏览器安装油猴脚本后[一键安装](https://greasyfork.org/zh-CN/scripts/397363-youtube-double-language-subtitle-youtube-%E5%8F%8C%E8%AF%AD%E5%AD%97%E5%B9%95)

# preview
![demo](demo.png)

# Contributor
- [contributors](https://github.com/CoinkWang/Y2BDoubleSubs/graphs/contributors)
