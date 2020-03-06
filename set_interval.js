(function() {
    'use strict';

javascript:clearInterval(render_interval_ba46c541);
    var render_interval_ba46c541 = setInterval(function()
     {
        try
        {
            var active_transcript_dom = document.querySelectorAll('ytd-transcript-renderer .active');
            if (active_transcript_dom.length > 0) {
                var current_time = document.querySelector('.ytp-time-current').textContent
                var off_time_before = Number(current_time.split(":")[0]) * 60 * 1000 + Number(current_time.split(":")[1]) * 1000;
                var activing_transcript = active_transcript_dom[1];
                var off_time_after = activing_transcript.getAttribute("start-offset");
                var activing_transcript_text = null;
                Math.abs(off_time_before - off_time_after) < 10000  
                    ? activing_transcript_text = activing_transcript.textContent.trim()
                    : null
                if (!(document.querySelector('.render_box_ba46c541'))) {
                    var default_captions_dom = document.querySelector('.captions-text');
                    var default_captions_innerHTML = default_captions_dom && default_captions_dom.innerHTML;
                    var default_captions_styles = default_captions_dom && default_captions_dom.querySelector('.caption-visual-line .ytp-caption-segment').getAttribute('style')
                    document.querySelector('.captions-text').innerHTML = 
                        `<span class='caption-visual-line' style='display: block;'>
                            <span style='${default_captions_styles}' class='render_box_ba46c541'>${activing_transcript_text}</span>
                        </span>
                        ${default_captions_innerHTML}`
                }
                else {
                    document.querySelector('.render_box_ba46c541').textContent = activing_transcript_text;
                }
            }
        }
        catch (e) {
            console.log(e)
        }
    } ,500);
})();
