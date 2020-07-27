var YTAPI = require("./YoutubeAPI");

//[38.154713204086306, 47.94230197901916]
var testStart = 133.47629999999998;
var testEnd = 138.7385;
var testID = 'aa2C0gf4lls';
var wrapperNames = ["first", "second"]

function parseIdFromYoutubeURL(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

class AsyncPlayerWrapper {
    constructor(elem, url, startTime) {
        this.readyEvent = null;
        this.name = wrapperNames.shift();
        this.promise = new Promise((resolve, reject) => {
            var id = parseIdFromYoutubeURL(url);
            if(!id) {
                reject("Could not parse Youtube URL");
                return
            }

            this.p = new YT.Player(elem, {
                height: '300',
                width: '400',
                videoId: id,
                events: {
                    'onReady': (e) => {
                        console.log(`got YT onReady for ${this.toString()}, resolving promise`);
                        this.readyEvent = e;
                        console.log(`${this.toString()} readyEvent = ${this.readyEvent}`);
                        resolve(this);
                    },
                    'onStateChange': this.onStateChange.bind(this)
                }
            })
        })
    }
    onStateChange(e) {
        console.log("onStateChange");
    }
    getPlayer() {
        return this.readyEvent && this.p;
    }
    toString() {
        return `AsyncPlayerWrapper[${this.name}]`;
    }

    getCurrentTime() {
        console.log("async getCurrentTime");
        return this.promise.then((p) => {
            console.log("async getCurrentTime inner");
            return p.p.getCurrentTime();
        })
    }
    setPlaybackRate(r) {
        console.log("async setPlaybackRate");
        return this.promise.then((p) => {
            console.log("async setPlaybackRate inner");
            return p.p.setPlaybackRate(r);
        })
    }
    loadVideoById(i) {
        console.log("waiting until promise resolved to call loadVideoByUrl");
        return this.promise.then((p) => {
            console.log("promise resolved, calling loadVideoByUrl");
            return p.p.loadVideoById(i);
        })
    }
    loadVideoByUrl(url) {
        var id = parseIdFromYoutubeURL(url);
        if(!id) {
            return Promise.reject("Could not parse Youtube URL")
        }

        console.log("waiting until promise resolved to call loadVideoByUrl");
        return this.promise.then((p) => {
            console.log("promise resolved, calling loadVideoByUrl");
            return p.p.loadVideoById(id);
        })
    }
    seekTo(t) {
        console.log(`${this.toString()} seekTo(${t}`)
        return this.promise.then((p) => {
            return p.p.seekTo(t);
        })
    }
    playVideo() {
        return this.promise.then((p) => {
            return p.p.playVideo();
        })
    }
    pauseVideo() {
        return this.promise.then((p) => {
            return p.p.pauseVideo();
        })
    }
    setVolume(v) {
        return this.promise.then((p) => {
            return p.p.setVolume(v);
        })
    }
}

class Looper {
    constructor(elem, url){
        this.startedLoopAt = 0;
        this.playPosError = 0;
        this.loading = true;
        this.startTime = 0;
        this.endTime = undefined;
        this.speed = 1.0;
        this.containerElem = elem;
        this.loopTimer = null;
        this.playerElems = [];
        this.players = [];
        this.currentPlayer = 0;
        this.playerElems.push(document.createElement("div"));
        this.playerElems.push(document.createElement("div"));
        elem.appendChild(this.playerElems[0]);
        elem.appendChild(this.playerElems[1]);
        this.playerElems[0].style = "position: absolute; left: 0; top: 0;"
        this.playerElems[1].style = "position: absolute; left: 0; top: 0;"
        this.name = "looper";
    }

    SayHi() {
        console.log(`Hello from ${this.name}`);
    }
    GetPos() {
        return this.Player().getCurrentTime();
    }
    SetSpeed(v) {
        return Promise.all([
            this.Player().setPlaybackRate(v),
            this.NextPlayer().setPlaybackRate(v)
        ]).then(() => {
            return this.Player().getPlaybackRate().then((r) => {
                this.speed = r;
            });
        })
    }
    SetStart() {
        this.GetPos().then((pos) => {
            this.startTime = pos;
            this.sync();
        })
        console.log("setting start point to now");
    }
    SetEnd() {
        this.GetPos().then((pos) => {
            this.endTime = pos;
            this.sync();
        })
        console.log("setting end point to now");
    }
    IsPlaying() {
        var player = this.Player().getPlayer();
        console.log("checking IsPlaying, player = ", player);
        return player && (player.getPlayerState() == 1);
    }
    onPlayerReady(event) {
        console.log("onPlayerReady!");
        var activePlayer = this.Player().getPlayer();
        
        console.log("onPlayerReady, activePlayer= ", activePlayer);
        if(true || this.loading) {
            // little innard hack here: event.target and activePlayer
            // aren't actually the same object, but they have an 'f'
            // element that refers to the underlying html element.
            // this is gross and may stop working.  Need a reliable way to
            // figure out which Player is throwing this event.
            if(event.target.f == activePlayer.f) {
                this.loading = false;
                console.log("active player loaded, seeking to " + this.startTime);
                event.target.seekTo(this.startTime);
                event.target.playVideo();
                this.startSyncing();
            } else {
                event.target.setVolume(0)
                console.log("seeking next video to " + this.startTime);
                event.target.seekTo(this.startTime);
                console.log("pausing next video");
                event.target.pauseVideo();
            }
        }
    }
    onStateChange() {
        console.log("onStateChange");
    }
    doLoop() {
        console.log("doloop");
        this.startedLoopAt = (new Date()).valueOf();
        var p = this.Player();
        var np = this.NextPlayer();
        console.log("playing next player");
        np.playVideo();
        np.setVolume(100);
        p.pauseVideo();

        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    }
    startSyncing() {
        if(!this.syncInterval) {
            this.syncInterval = setInterval(this.sync.bind(this), 1000);
        }
    }
    sync() {
        if(this.loopTimer) {
            clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
        if(this.IsPlaying()) {
            console.log("IsPlaying (sync)")
            var player = this.Player().getPlayer();

            this.Player().p.f.style.display = null;
            this.NextPlayer().p.f.style.display = "none";

            this.speed = player.getPlaybackRate();
            console.log("speed is ", this.speed);
            var now = (new Date()).valueOf();
            var offset = (now - this.startedLoopAt) * this.speed;
            var pos = player.getCurrentTime();

            var posMS = Math.round(pos * 1000);
            var startMS = Math.round(this.startTime * 1000);

//            console.log(`offset is ${offset}, speed = ${this.speed}, got speed= ${player.getPlaybackRate()}`)
            console.log(`expected pos to be ${startMS + offset}, is ${posMS}, error=${posMS - (startMS + offset)}ms`);
            this.playPosError = (posMS - (startMS + offset));
            if(Math.abs(this.playPosError) > 2000) {
                this.playPosError = 0;
            }

            var endTime = this.endTime;
            if( endTime == undefined || endTime > player.getDuration()) {
                endTime = player.getDuration();
                this.endTime = endTime;
            }
            var timeTilLoop = this.endTime - pos;
            console.log({timeTilLoop, endTime, pos});
            console.log("setting timeout for " + timeTilLoop)
            var timeout = (timeTilLoop / this.speed);
            console.log("at this speed that is " + timeout + " aka " + timeout*1000 + "ms");
            this.loopTimer = setTimeout(this.doLoop.bind(this), (timeout * 1000) + this.playPosError);

            var np = this.NextPlayer();
            var nextStart = this.startTime;
            var nextPos = np.getCurrentTime();
            if(nextPos != nextStart) {
//                console.log(`updating next vid pos from ${nextPos} to ${nextStart} (${this.playPosError} error correction)`)
                np.seekTo(nextStart);
            }
        }
            /*
                calculate new end timer
                reset end timer
                set up next iframe
            */
    }
    Player() {
        return this.players[this.currentPlayer];
    }
    PlayerElem() {
        return this.playerElems[this.currentPlayer];
    }
    NextPlayer() {
        return this.players[(this.currentPlayer+1) % this.players.length];
    }
    NextPlayerElem() {
        return this.playerElems[(this.currentPlayer+1) % this.players.length];
    }
    LoadURL(url) {
        return YTAPI(window, document).then((YT) => {
            this.loading = true;
            if(this.players.length == 0) {
                for(var i=0; i<2; i++) {
                    console.log("pushing player...");
                    var wp = new AsyncPlayerWrapper(this.playerElems[i], url, this.startTime);
                    wp.promise.then((p) => {
                        console.log("calling onPlayerReady with ", wp.readyEvent);
                        this.onPlayerReady(p.readyEvent);
                    })
                    this.players.push(wp);
                }
            } else {
                this.startTime = 0;
                this.endTime = undefined;
                for(var i=0; i<2; i++) {
                    this.players[i].loadVideoByUrl(url);
                }
            }
            /*for(var i=0; i<this.players.length; i++) {
                var p = this.players[i];
                console.log("calling loadVideoByUrl on ", p);
                p.loadVideoByUrl(url);
            }*/
            
            this.NextPlayer().pauseVideo();
            this.NextPlayer().setVolume(0);
        });
    }
}

module.exports = Looper;