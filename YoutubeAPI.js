var ytpromise = null;
const API_URL = "https://www.youtube.com/iframe_api";
function loadYT(win,doc) {
    if(!ytpromise){
        ytpromise = new Promise((resolve, reject) => {
            win.onYouTubeIframeAPIReady = function() {
                console.log("iframe API ready, YT:", YT);
                resolve(YT);
            }

            var scriptTag = doc.createElement("script");
            scriptTag.src = API_URL;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
        });
    }

    return ytpromise;
}

module.exports = loadYT;
