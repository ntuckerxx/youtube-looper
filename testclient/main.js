const Looper = require("./YoutubeLooper.js");

var elements = {
    videoContainer: document.getElementById("videocontainer"),
    urlinput: document.getElementById("urlinput"),
    startinput: document.getElementById("startinput"),
    endinput: document.getElementById("endinput"),
    speedinput: document.getElementById("speedinput"),
    buttons: {
        start: document.getElementById("button_start"),
        end: document.getElementById("button_end"),
        load: document.getElementById("button_load"),
        loadparams: document.getElementById("button_loadparams")
    }
};

var presets = {
    "Cissy Strut": { url: "https://www.youtube.com/watch?v=bBZ7_NO3qpY", start: 93, end: 114.95, speed: 1 },
    "Back Pocket": { url: "https://www.youtube.com/watch?v=aa2C0gf4lls", start: 159.4873, end: 171.9739, speed: 0.8 },
    "Come Down": { url: "https://www.youtube.com/watch?v=ferZnZ0_rSM", start: 38.154713204086306, end: 47.94230197901916, speed: 1.2 }
}

var i=0;
for(var name in presets) {
    var preset = presets[name];
    console.log(`preset ${i}: ${preset}`);
    var elem = document.getElementById(`preset${i}`);
    console.log("elem: ", elem);
    if(!elem) {
        break;
    }
    elem.href = preset.url;
    elem.innerText = name;
    function makeHandler(preset) {
        return function(e) {
            e.preventDefault();
            e.stopPropagation();
            elements.urlinput.value = preset.url;
            elements.startinput.value = preset.start;
            elements.endinput.value = preset.end;
            elements.speedinput.value = preset.speed;
        }
    }
    elem.addEventListener("click", makeHandler(preset))
    i++;
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
elements.buttons.loadparams.addEventListener("click", (e) => {
    var url = elements.urlinput.value;
    var start = Number(elements.startinput.value);
    var end = Number(elements.endinput.value);
    var speed = Number(elements.speedinput.value);
    console.log("setting loop params: ", {url, start, end, speed})
    l.SetLoopParams(url, start, end, speed);
});
window.l = l;
