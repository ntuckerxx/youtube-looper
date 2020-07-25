var YTAPI = require("./YoutubeAPI");

var testStart = 133.47629999999998;
var testEnd = 138.7385;
var testID = 'aa2C0gf4lls';

class Looper {
    constructor(elem, url){
        this.startedLoopAt = 0;
        this.playPosError = 0;
        this.loading = true;
        this.startTime = testStart;
        this.endTime = testEnd;
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
        this.name = "looper";
    }

    SayHi() {
        console.log(`Hello from ${this.name}`);
    }
    GetPos() {
        return this.Player().getCurrentTime();
    }
    SetSpeed(v) {
        this.Player().setPlaybackRate(v);
        this.NextPlayer().setPlaybackRate(v);
        this.speed = this.Player().getPlaybackRate();
    }
    SetStart() {
        var pos = this.GetPos();
        console.log("setting start point to now");
    }
    SetEnd() {
        console.log("setting end point to now");
    }
    IsPlaying() {
        return this.Player().getPlayerState() == 1;
    }
    onPlayerReady(event) {
        var activePlayer = this.Player();

        if(true || this.loading) {
            // little innard hack here: event.target and activePlayer
            // aren't actually the same object, but they have an 'f'
            // element that refers to the underlying html element.
            // this is gross and may stop working.  Need a reliable way to
            // figure out which Player is throwing this event.
            if(event.target.f == activePlayer.f) {
                this.startTime = testStart;
                this.endTime = testEnd;
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
        console.log("pausing last player");
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
            var player = this.Player();
            this.speed = player.getPlaybackRate();
            var now = (new Date()).valueOf();
            var offset = (now - this.startedLoopAt) * this.speed;
            var pos = this.GetPos();

            var posMS = Math.round(pos * 1000);
            var startMS = Math.round(this.startTime * 1000);

//            console.log(`offset is ${offset}, speed = ${this.speed}, got speed= ${player.getPlaybackRate()}`)
            console.log(`expected pos to be ${startMS + offset}, is ${posMS}, error=${posMS - (startMS + offset)}ms`);
            this.playPosError = (posMS - (startMS + offset));
            if(Math.abs(this.playPosError) > 2000) {
                this.playPosError = 0;
            }

            var endTime = Math.min(this.endTime, player.getDuration());            
            var timeTilLoop = this.endTime - pos;
//            console.log("setting timeout for " + timeTilLoop)
            var timeout = (timeTilLoop / this.speed);
//            console.log("at this speed that is " + timeout + " aka " + timeout*1000 + "ms");
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
        YTAPI(window, document).then((YT) => {
            this.loading = true;
            for(var i=0; i<2; i++) {
                this.players.push(
                    new YT.Player(this.playerElems[i], {
                        height: '300',
                        width: '400',
                        videoId: testID,
                        events: {
                            'onReady': this.onPlayerReady.bind(this),
                            'onStateChange': this.onStateChange.bind(this)
                        }
                    })
                );
            }
        });
    }
}

module.exports = Looper;