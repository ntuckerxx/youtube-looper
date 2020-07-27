const Looper = require("./YoutubeLooper.js");

var elements = {
    videoContainer: document.getElementById("videocontainer"),
    urlinput: document.getElementById("urlinput"),
    buttons: {
        start: document.getElementById("button_start"),
        end: document.getElementById("button_end"),
        load: document.getElementById("button_load")
    }
}

const l = new Looper(elements.videoContainer, null);
elements.buttons.start.addEventListener("click", (e) => {
    l.SetStart();
});
elements.buttons.end.addEventListener("click", (e) => {
    l.SetEnd();
});
elements.buttons.load.addEventListener("click", (e) => {
    l.LoadURL(elements.urlinput.value)
    .catch((e) => {
        alert(e);
    });
});
window.l = l;
