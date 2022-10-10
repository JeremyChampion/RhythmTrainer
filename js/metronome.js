class Metronome {

  constructor(tempo = 120, beatsPerMeasure = 4) {
    this.audioContext = null;
    this.tempo = tempo;
    this.beatsPerMeasure = beatsPerMeasure;
    this.beatIndex = 1;
    this.lookahead = 25;          // How frequently to call scheduling function (in milliseconds)
    this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio (sec)
    this.nextClickTime = 0.0;     // when the next note is due
    this.lastClickTime = 0.0;
    this.clicks = {};
    this.addIndex = 0;
    this.removeIndex = 0;
    this.isRunning = false;
    this.intervalID = null;
    this.onclick = null;
  }

  scheduleClick(time) {

    let secondsPerBeat = 60.0 / this.tempo;

    this.lastClickTime = this.nextClickTime;

    this.nextClickTime += secondsPerBeat;

    this.clicks[this.addIndex] = { time: time, beat: this.beatIndex };

    let currentBeat = this.beatIndex;

    if (this.beatIndex >= this.beatsPerMeasure) {
      this.beatIndex = 1;
    }
    else {
      this.beatIndex++;
    }

    this.addIndex++;

    if (Object.keys(this.clicks).length > 10) {

      delete this.clicks[this.removeIndex];

      this.removeIndex++;

    }

    const clickOsc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    clickOsc.frequency.value = 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    clickOsc.connect(envelope);
    envelope.connect(this.audioContext.destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.03);

    const silentOsc = this.audioContext.createOscillator();
    silentOsc.connect(this.audioContext.destination);
    silentOsc.onended = () => { 

      if (this.onclick && typeof(this.onclick) === 'function'){
        this.onclick({ time: time, beat: currentBeat });
      }
      //$(this).trigger('metronomeClick', [{ time: time, beat: currentBeat }]) 
    };
    silentOsc.start(time);
    silentOsc.stop(time);

  }

  scheduler() {

    while (this.nextClickTime < this.audioContext.currentTime + this.scheduleAheadTime) {

      this.scheduleClick(this.nextClickTime);

    }
  }

  start() {

    if (this.isRunning) return;

    if (this.audioContext == null) {

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    }

    this.isRunning = true;

    this.nextClickTime = this.audioContext.currentTime + 0.05;

    this.intervalID = setInterval(() => this.scheduler(), this.lookahead);

  }

  pause() {

    this.isRunning = false;

    clearInterval(this.intervalID);

  }

  startPause() {

    if (this.isRunning) {
      this.pause();
    }
    else {
      this.start();
    }

  }

  stop() {

    let self = this;

    this.pause();

    this.audioContext.close().then(function () {

      self.audioContext = null;
      self.nextClickTime = 0.0;
      self.lastClickTime = 0.0;
      self.clicks = {};
      self.addIndex = 0;
      self.removeIndex = 0;

    });

  }

}

export {Metronome as default};