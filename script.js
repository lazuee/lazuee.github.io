"use strict";
class AudioHandler {
	constructor() {
		this._context = null;
		this._audio = new Audio();
		this._source = null;
		this._gain = null;
		this._analyser = null;
	}
	setup() {
		const AudioContext = window.AudioContext || window.webkitAudioContext || false;
		if (!AudioContext) return false;
		this._freq = new Uint8Array(1024);
		this._context = new AudioContext();
		this._source = this._context.createMediaElementSource(this._audio);
		this._analyser = this._context.createAnalyser();
		this._gain = this._context.createGain();
		this._source.connect(this._gain);
		this._source.connect(this._analyser);
		this._gain.connect(this._context.destination);
		this._audio.addEventListener("canplaythrough", (e) => {
			this._freq = new Uint8Array(this._analyser.frequencyBinCount);
			this._audio.play();
		});
		return this._audio;
	}

	getState(state) {
		if (!this._context) return "";
		if (state) return this._context.state === state;
		return this._context.state;
	}

	getFreqData() {
		if (this._analyser) {
			this._analyser.getByteFrequencyData(this._freq);
		}
		return this._freq;
	}

	setVolume(volume) {
		if (!this._gain) return;
		volume = parseFloat(volume) || 0.0;
		volume = volume < 0 ? 0 : volume;
		volume = volume > 1 ? 1 : volume;
		this._gain.gain.value = volume;
	}

	pause() {
		if (!this._audio) return;
		try {
			this._audio.pause();
		} catch (e) {}
	}

	stop() {
		if (!this._audio) return;
		try {
			this._audio.pause();
		} catch (e) {}
		try {
			this._audio.stop();
		} catch (e) {}
		try {
			this._audio.close();
		} catch (e) {}
	}

	resume(callback) {
		if (!this._context) return;
		this._context
			.resume()
			.then(callback)
			.catch((e) => {});
	}

	play(source) {
		if (!this._audio) return;
		this.stop();
		this.resume();
		this._audio.src = String(source || "") + "?x=" + Date.now();
		this._audio.crossOrigin = "anonymous";
		this._audio.load();
	}
}

let playing = false;
const volume = 100;
const audio = new AudioHandler();

const playAudioStream = (mp3File) => {
	audio.setVolume(volume);
	audio.play(mp3File);
};
const stopAudioStream = () => {
	audio.stop();
	playing = false;
};
const playStream = () => {
	if (playing) return;
	const stream = "https://ais-edge105-live365-dal02.cdnstream.com/a71939";
	// fix to get around AudioContext auto-play policy in chrome
	if (audio.getState("suspended")) {
		audio.resume(() => playAudioStream(stream));
	} else {
		playAudioStream(stream);
	}
};

function init() {
	const a = audio.setup();
	if (!a) {
		alert("Web Audio is not supported by your browser. ");
		return;
	}
	a.addEventListener("waiting", (e) => {
		playing = false;
	});
	a.addEventListener("playing", (e) => {
		playing = true;
	});
	a.addEventListener("ended", (e) => {
		playing = false;
	});
	a.addEventListener("error", (e) => {
		audio.closeAudio();
		playing = false;
	});
	if (/*@cc_on!@*/ false) {
		// check for Internet Explorer
		document.onfocusin = playStream;
		document.onfocusout = playStream;
	} else {
		window.onfocus = playStream;
		window.onblur = playStream;
	}

	window.removeEventListener("click", init);
}

window.addEventListener("click", init);
