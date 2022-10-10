import Metronome from './metronome.js';

class RhythmBox {

  constructor(container, options, callback) {//tempo = 120, duration = 10, libraryIndex = 0, callback) {

    this.container = container;

    let defaultOptions = {
      tempo: 120,
      duration: 10,
      notes : {
        whole: true,
        half: true,
        quarter: true,
        eighth: false,
        sixteenth: false,
        thirtysecond: false
      },
      dottedRhythms: false,
      rests: false
    };

    if (!options){
      options = {};
    }

    this.options = Object.assign({}, defaultOptions, options);

    this.notesInQueue = [];         // notes that have been put into the web audio and may or may not have been played yet {note, time}
    this.notesInQueueV2 = [];
    this.currentlyPressed = false;
    this.noteIdSequence = 1;
    this.forgivenessRate = 0.10;
    this.width = 1000;
    this.height = 500;
    this.targetX = 500;
    this.killZone = this.targetX * 0.10;
    this.keyDown = false;
    this.duration = this.options.duration;
    //this.libraryIndex = libraryIndex;
    this.measuresScheduled = 0;
    this.notesScheduled = 0;
    this.correct = 0;
    this.incorrect = 0;
    this.callback = callback;
    this.intervalID = null;
    this.metronome = null;

    this.notePool = [];

    this.secondsPerBeat = 60.0 / this.options.tempo;
    this.targetDuration = this.secondsPerBeat * 4.0;
    this.speed = (this.width - this.targetX) / this.targetDuration;

    if (this.options.notes.whole) {
      this.notePool.push(4);
    }

    if (this.options.notes.half) {
      this.notePool.push(2);
    }

    if (this.options.notes.quarter) {
      this.notePool.push(1);
    }

    if (this.options.notes.eighth) {
      this.notePool.push(0.5);
    }

    if (this.options.notes.sixteenth) {
      this.notePool.push(0.25);
    }

    if (this.options.notes.thirtysecond) {
      this.notePool.push(0.125);
    }

    this.notePool.sort();

    this.library = {

      0: { /* Quarter, Half */
        options: [
          [1, 1, 1, 1],
          [1, 1, 2],
          [2, 1, 1],
          [2, 2]
        ]
      },
      1: { /* Quarter, Half, Whole */
        options: [
          [1, 1, 1, 1],
          [1, 1, 2],
          [2, 1, 1],
          [2, 2],
          [4]
        ]
      },
      2: { /* Eighth, Quarter, Half, Whole */
        options: [
          [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
          [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
          [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5],
          [0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5],
          [1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
          [1, 0.5, 0.5, 1, 0.5, 0.5],
          [1, 1, 1, 1],
          [1, 1, 2],
          [2, 1, 1],
          [2, 2],
          [4]
        ]
      }

    }

    this.metronome = new Metronome(this.options.tempo);

  }

  get audioContext() {
    return this.metronome.audioContext;
  }

  get isRunning() {
    return this.metronome.isRunning;
  }

  get tempo() {
    return this.metronome.tempo;
  }

  set tempo(value) {
    this.metronome.tempo = value;
  }

  makeSVG(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
      el.setAttribute(k, attrs[k]);
    return el;
  }

  getNoteId() {
    let id = this.noteIdSequence;
    this.noteIdSequence++;
    return id;
  }

  getBarLine() {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', 'translate(0 0) scale(0.15 0.15)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,400 v-800 h8 v800 h-8');
    path.setAttribute('fill', 'black');

    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getEighthNote() {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '0.5');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', 'translate(0 0) scale(0.15 0.15)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M50,-40c0-99.1,0-197.4,0-295.5c1.2-0.4,1.6-0.7,2.1-0.7c10.1-0.6,9.9-0.6,10.9,9.4c1.2,11.4,5.5,21.9,10.8,32c9.2,17.5,21.1,33.1,33.1,48.7c14.6,19.2,28.6,38.9,38.8,61c16.2,35.4,14.3,70.5-2.3,105.1c-5.4,11.2-12.2,21.7-18.5,32.5c-0.9,1.5-2.1,2.9-4.1,3.8c1-3.1,1.8-6.3,3-9.3c8.5-22.4,16.6-45,19.3-69c2.5-22.2,1.4-43.9-11.1-63.6c-11.2-17.6-27.7-28.5-46.6-36.1c-7.3-3-15-5.2-23.4-8c0,2.8,0,4.6,0,6.3c0,20.2,0,40.3,0,60.5c0,33.3-0.1,66.6,0,99.9c0,17.3,0.3,34.6,0.5,51.9c0.2,14.2-5.9,25.9-15.5,35.7c-17.7,18-39,27.5-64.7,24.6c-23-2.6-41.3-21.1-35.5-46.2c2.7-11.5,8.8-21.2,17.5-29.1c20.5-19,44.5-25.8,71.9-20.1c2.4,0.5,4.8,1.5,7,2.5z');

    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getEighthNoteV2(scale = 0.5, options) {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '0.5');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', `translate(0 0) scale(${scale} ${scale})`);

    let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'); //Head
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '0');
    ellipse.setAttribute('rx', '20');
    ellipse.setAttribute('ry', '12');
    ellipse.setAttribute('fill', 'black');
    ellipse.setAttribute('transform', 'rotate(-15 0 0)');
    ellipse.classList.add('color-me');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); //Stem
    path.setAttribute('d', 'M18,-4 v-110 h2 v110 h-2');
    path.setAttribute('fill', 'black');
    
    let path2;

    if (options === 'beam'){
      let beamWidth = 2 * this.speed * this.secondsPerBeat * 0.5;
      console.log(beamWidth);

      path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); //Beam
      path2.setAttribute('d', `M18,-114 h${beamWidth} v12 h${-beamWidth} v-12`);
      path2.setAttribute('fill', 'black');
    }
    else if (options === 'flag') {
      path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); //Flag
      path2.setAttribute('d', 'M18,-114 c 0.373746,-0.124558 0.470462,-0.2737224 0.626184,-0.2737224 3.145586,-0.186878 3.083286,-0.186878 3.39473,2.9275828 0.373742,3.5504686 1.712974,6.8206348 3.363608,9.9662298 2.865296,5.4502924 6.571502,10.3088244 10.308828,15.1673504 4.547082,5.979732 8.907328,12.115194 12.08407,18.998126 5.045396,11.025132 4.453628,21.95685 -0.71634,32.732836 -1.681792,3.488184 -3.79963,6.758336 -5.761712,10.121958 -0.280324,0.46716 -0.65404,0.903172 -1.276924,1.18349 0.311442,-0.965468 0.560584,-1.962102 0.93433,-2.89643 2.647272,-6.97637 5.169976,-14.015026 6.010882,-21.489684 0.77861,-6.914098 0.43601,-13.672438 -3.457032,-19.80789 -3.48818,-5.481418 -8.627036,-8.876176 -14.51335,-11.243156 -2.27352,-0.934332 -8.543602,-1.563806 -11.271146,-1.823016 0,0 -0.1318,-23.50387 0.273872,-33.5636746 z');
      path2.setAttribute('fill', 'black');
    }

    innerG.appendChild(ellipse);
    innerG.appendChild(path);
    if (options !== 'none'){
      innerG.appendChild(path2);
    }
    outerG.appendChild(innerG);

    return outerG;

  }

  getEighthNoteV3(scale = 0.5, beamed) {

    let outerG;
    let innerG1, innerG2;
    let head1, head2;
    let stem1, stem2;
    let flagOrBeam;

    outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '0.5');
    outerG.classList.add('live');

    innerG1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG1.setAttribute('transform', `translate(0 0) scale(${scale} ${scale})`);
    innerG1.classList.add('group-one');

    head1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    head1.setAttribute('cx', '0');
    head1.setAttribute('cy', '0');
    head1.setAttribute('rx', '20');
    head1.setAttribute('ry', '12');
    head1.setAttribute('fill', 'black');
    head1.setAttribute('transform', 'rotate(-15 0 0)');
    head1.classList.add('color-me');

    stem1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stem1.setAttribute('d', 'M18,-4 v-110 h2 v110 h-2');
    stem1.setAttribute('fill', 'black');

    flagOrBeam = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flagOrBeam.setAttribute('fill', 'black');

    outerG.appendChild(innerG1);
    innerG1.appendChild(head1);
    innerG1.appendChild(stem1);

    
    if (beamed) {

      let spacing = this.speed * this.secondsPerBeat * 0.5;

      innerG2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      innerG2.setAttribute('transform', `translate(${spacing} 0) scale(${scale} ${scale})`);
      innerG2.classList.add('group-two');

      head2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      head2.setAttribute('cx', '0');
      head2.setAttribute('cy', '0');
      head2.setAttribute('rx', '20');
      head2.setAttribute('ry', '12');
      head2.setAttribute('fill', 'black');
      head2.setAttribute('transform', 'rotate(-15 0 0)');
      head2.classList.add('color-me');

      stem2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      stem2.setAttribute('d', `M18,-4 v-110 h2 v110 h-2`);
      stem2.setAttribute('fill', 'black');

      flagOrBeam.setAttribute('d', `M18,-114 h${spacing / scale} v12 h${-spacing / scale} v-12`);    
      
      outerG.appendChild(innerG2);
      innerG2.appendChild(head2);
      innerG2.appendChild(stem2);
  
    }
    else {
      flagOrBeam.setAttribute('d', 'M18,-114 c 0.373746,-0.124558 0.470462,-0.2737224 0.626184,-0.2737224 3.145586,-0.186878 3.083286,-0.186878 3.39473,2.9275828 0.373742,3.5504686 1.712974,6.8206348 3.363608,9.9662298 2.865296,5.4502924 6.571502,10.3088244 10.308828,15.1673504 4.547082,5.979732 8.907328,12.115194 12.08407,18.998126 5.045396,11.025132 4.453628,21.95685 -0.71634,32.732836 -1.681792,3.488184 -3.79963,6.758336 -5.761712,10.121958 -0.280324,0.46716 -0.65404,0.903172 -1.276924,1.18349 0.311442,-0.965468 0.560584,-1.962102 0.93433,-2.89643 2.647272,-6.97637 5.169976,-14.015026 6.010882,-21.489684 0.77861,-6.914098 0.43601,-13.672438 -3.457032,-19.80789 -3.48818,-5.481418 -8.627036,-8.876176 -14.51335,-11.243156 -2.27352,-0.934332 -8.543602,-1.563806 -11.271146,-1.823016 0,0 -0.1318,-23.50387 0.273872,-33.5636746 z');
    }

    innerG1.appendChild(flagOrBeam);

    return outerG;

  }

  getQuarterNote() {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '1');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', 'translate(0 0) scale(0.15 0.15)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M52,-35c0-3.8,0-7.2,0-10.6c0.1-19.2,0.4-38.3,0.4-57.5c0.1-42.6,0-85.3,0-127.9c0-34.6,0-69.3,0-103.9c0-3.3-0.3-6.6-0.4-10c-0.2-3.5,2.2-3.4,4.7-3.5c2.6,0,4.2,0.6,4.1,3.6c-0.2,3.3-0.4,6.6-0.4,10c0,20.2,0,40.3,0,60.5c0,36,0,72,0,107.9c0,34,0,68,0,101.9c0,16.1,0,32.3,0.2,48.4c0.2,17.1-7,31-18.8,42.6c-15.6,15.3-34.1,24.9-56.3,25.9c-10.7,0.5-21.1-1.3-29.7-8.1c-12.2-9.7-15.3-22.4-11.3-37.2c3.3-11.9,10.1-21.7,19.2-29.9c16.2-14.6,34.7-23.9,57.1-23.8c11,0,21.1,2.7,29.4,10.4z');

    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getQuarterNoteV2(scale = 0.5) {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '1');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', `translate(0 0) scale(${scale} ${scale})`);

    let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '0');
    ellipse.setAttribute('rx', '20');
    ellipse.setAttribute('ry', '12');
    ellipse.setAttribute('fill', 'black');
    ellipse.setAttribute('transform', 'rotate(-15 0 0)');
    ellipse.classList.add('color-me');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18,-4 v-110 h2 v110 h-2');
    path.setAttribute('fill', 'black');

    innerG.appendChild(ellipse);
    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getHalfNote() {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '2');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', 'translate(0 0) scale(0.15 0.15)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M52,-35c0-3.8,0-7.2,0-10.6c0.1-19.2,0.4-38.3,0.4-57.5c0.1-42.6,0-85.3,0-127.9c0-34.6,0-69.3,0-103.9c0-3.3-0.3-6.6-0.4-10c-0.2-3.5,2.2-3.4,4.7-3.5c2.6,0,4.2,0.6,4.1,3.6c-0.2,3.3-0.4,6.6-0.4,10c0,20.2,0,40.3,0,60.5c0,36,0,72,0,107.9c0,34,0,68,0,101.9c0,16.1,0,32.3,0.2,48.4c0.2,17.1-7,31-18.8,42.6c-15.6,15.3-34.1,24.9-56.3,25.9c-10.7,0.5-21.1-1.3-29.7-8.1c-12.2-9.7-15.3-22.4-11.3-37.2c3.3-11.9,10.1-21.7,19.2-29.9c16.2-14.6,34.7-23.9,57.1-23.8c11,0,21.1,2.7,29.4,10.4z M-35.2,35c6.7-1.5,13.5-2.6,20-4.7c14.5-4.8,26.4-14.2,37.2-24.6c5.8-5.6,11.2-11.7,16.1-18.1c2.1-2.7,2.9-6.7,3.2-10.3c0.3-3.7-2.1-5.6-5.9-5.4c-2.9,0.1-5.9,0.5-8.7,1.2c-10.8,2.5-20.4,7.8-29.7,13.5c-11.7,7.3-23.3,14.7-32.6,25.1c-3.1,3.5-5.9,7.7-7.5,12c-1 3 -1 4 0 5 0 6 0 5 1 4z');

    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getHalfNoteV2(scale = 0.5) {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '2');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', `translate(0 0) scale(${scale} ${scale})`);

    let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '0');
    ellipse.setAttribute('rx', '20');
    ellipse.setAttribute('ry', '12');
    ellipse.setAttribute('fill', 'black');
    ellipse.setAttribute('transform', 'rotate(-15 0 0)');
    ellipse.classList.add('color-me');

    let ellipse2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse2.setAttribute('cx', '0');
    ellipse2.setAttribute('cy', '0');
    ellipse2.setAttribute('rx', '18');
    ellipse2.setAttribute('ry', '6');
    ellipse2.setAttribute('fill', 'white');
    ellipse2.setAttribute('transform', 'rotate(-15 0 0)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18,-4 v-110 h2 v110 h-2');
    path.setAttribute('fill', 'black');

    innerG.appendChild(ellipse);
    innerG.appendChild(ellipse2);
    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getWholeNote() {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '4');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', 'translate(0 0) scale(0.15 0.15)');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,50c-15-0.2-31.6-2.5-47.2-9.1c-13-5.5-23.6-14.2-30.7-26.7c-6.7-11.8-5.6-23.2,1.5-34.3c6.5-10.1,16-16.5,26.7-21.4c22.5-10.2,46.2-12.6,70.5-9.5c15.3,2,29.8,6.6,42.6,15.6c7.8,5.5,14.3,12.2,18.8,20.8c5.4,10.5,4.7,20.8-1.2,30.8c-5.5,9.4-13.8,15.8-23.3,20.9C40.1,46.7,21.3,50.2,0,50.3 M38,11.4c-0.4-3.2-0.6-6.5-1.1-9.7c-2.1-13.2-7.1-25-17-34.3c-8-7.6-17.7-11-28.5-11c-13.7,0-23.5,10.2-25.2,25c-1,8.7,0.8,16.9,2.6,25.3c4.6,20.6,25.6,36.3,46.6,34.4c8.3-0.7,14.6-4.8,18.5-12.3C37.5,19.6,38.6,13.8,38.9,7.7');

    innerG.appendChild(path);
    outerG.appendChild(innerG);

    return outerG;

  }

  getWholeNoteV2(scale = 0.5) {

    let outerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerG.setAttribute('transform', 'translate(0 0)');
    outerG.setAttribute('data-beats', '4');
    outerG.classList.add('live');

    let innerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    innerG.setAttribute('transform', `translate(0 0) scale(${scale} ${scale})`);

    let ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '0');
    ellipse.setAttribute('rx', '20');
    ellipse.setAttribute('ry', '12');
    ellipse.setAttribute('fill', 'black');
    ellipse.classList.add('color-me');

    let ellipse2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse2.setAttribute('cx', '0');
    ellipse2.setAttribute('cy', '0');
    ellipse2.setAttribute('rx', '6');
    ellipse2.setAttribute('ry', '10');
    ellipse2.setAttribute('fill', 'white');
    ellipse2.setAttribute('transform', 'rotate(-45 0 0)');

    innerG.appendChild(ellipse);
    innerG.appendChild(ellipse2);
    outerG.appendChild(innerG);

    return outerG;

  }

  addNote(note, time) {

    let targetAttack = time + this.targetDuration;
    let targetRelease = targetAttack + (this.secondsPerBeat * parseFloat(note.getAttribute('data-beats')));
    let animationDuration = this.width / this.speed;
    let id1 = this.getNoteId();

    let animation = this.makeSVG('animateTransform',
      {
        'attributeName': 'transform',
        'type': 'translate',
        'from': `${this.width} ${this.height * 0.5}`,
        'to': `0 ${this.height * 0.5}`,
        'dur': animationDuration,
        'begin': 'indefinite',
        'fill': 'freeze',
        'id': id1,
        'class': 'animation base-animation'
      });

    animation.addEventListener('endEvent', function () {

      note.remove();

    }, false);

    note.setAttribute('transform', `translate(${this.width} ${this.height * 0.5})`)
    note.setAttribute('data-target-attack', targetAttack);
    note.setAttribute('data-target-release', targetRelease);
    note.appendChild(animation);
    this.notesInQueue.push(note);
    document.getElementById('SVG').appendChild(note);
    animation.beginElement();

  }

  addNoteV2(note) {

    //let targetAttack = note.time + this.targetDuration;
    //let targetRelease = targetAttack + (this.secondsPerBeat * parseFloat(note.duration));
    note.targetAttack = note.time + this.targetDuration;;
    note.targetRelease = note.targetAttack + (this.secondsPerBeat * parseFloat(note.duration));
    this.notesInQueue.push(note);

    if (note.master){

      note.element.setAttribute('transform', `translate(${this.width} ${this.height * 0.5})`);
    
      document.getElementById('SVG').appendChild(note.element);
  
      let animationDuration = this.width / this.speed;
  
      let id1 = this.getNoteId();
  
      let animation = this.makeSVG('animateTransform',
        {
          'attributeName': 'transform',
          'type': 'translate',
          'from': `${this.width} ${this.height * 0.5}`,
          'to': `0 ${this.height * 0.5}`,
          'dur': animationDuration,
          'begin': 'indefinite',
          'fill': 'freeze',
          'id': id1,
          'class': 'animation base-animation'
        });
  
      animation.addEventListener('endEvent', function () {
        note.element.remove();
      }, false);
  
      note.element.appendChild(animation);
      
      animation.beginElement(); 

    }

  }

  addBarLine(element, time) {

    //let secondsPerBeat = 60.0 / this.tempo;
    let speed = (this.width - this.targetX) / (this.secondsPerBeat * 4.0);
    let duration = this.width / speed;
    let id = this.getNoteId();
    let self = this;

    let anim = this.makeSVG('animateTransform',
      {
        'attributeName': 'transform',
        'type': 'translate',
        'from': `${this.width} ${this.height * 0.5}`,
        'to': `0 ${this.height * 0.5}`,
        'dur': duration,
        'begin': 'indefinite',
        'fill': 'freeze',
        'id': id
      });

    anim.addEventListener('endEvent', function () {

      element.remove();

    }, false);

    element.setAttribute('transform', `translate(${this.width} ${this.height * 0.5})`)
    element.appendChild(anim);
    document.getElementById('SVG').appendChild(element);
    anim.beginElement();

  }

  scheduleMeasure(time) {

    let secondsPerBeat = 60.0 / this.tempo;

    let scheduleTime = time;

    //t r = parseInt(Math.floor(Math.random() * 4) + 1);
    let r = parseInt(Math.floor(Math.random() * this.library[this.libraryIndex].options.length));

    let pattern = this.library[this.libraryIndex].options[r];

    let notes = [];

    for (let i in pattern) {

      switch (pattern[i]) {

        case 0.5:

          notes.push({
            note: this.getEighthNoteV2(),
            time: scheduleTime,
            beats: 0.5
          });

          scheduleTime += (secondsPerBeat * 0.5);

          break;
        case 1:

          notes.push({
            note: this.getQuarterNoteV2(),
            time: scheduleTime,
            beats: 1
          });

          scheduleTime += (secondsPerBeat * 1);

          break;
        case 2:

          notes.push({
            note: this.getHalfNoteV2(),
            time: scheduleTime,
            beats: 2
          });

          scheduleTime += (secondsPerBeat * 2);

          break;
        case 4:

          notes.push({
            note: this.getWholeNoteV2(),
            time: scheduleTime,
            beats: 4
          });

          scheduleTime += (secondsPerBeat * 4);

          break;

      }

    }

    for (let i in notes) {

      let silentOsc = this.metronome.audioContext.createOscillator();
      silentOsc.connect(this.metronome.audioContext.destination);
      //silentOsc.onended = () => { this.addNote(notes[i].note, notes[i].time); };
      silentOsc.onended = () => { this.addNoteV2(notes[i]); };
      silentOsc.start(notes[i].time);
      silentOsc.stop(notes[i].time);

      this.notesScheduled++;

    }

    let barLine = this.getBarLine();

    let lastNote = notes[notes.length - 1];

    scheduleTime = lastNote.time + ((lastNote.beats * secondsPerBeat) * 0.8)

    let silentOsc = this.audioContext.createOscillator();
    silentOsc.connect(this.audioContext.destination);
    silentOsc.onended = () => { this.addBarLine(barLine, scheduleTime); };
    silentOsc.start(scheduleTime);
    silentOsc.stop(scheduleTime);

    this.measuresScheduled++;
    
    this.container.querySelector('#ScoreDiv').querySelector('#ScoreCorrect').innerText = this.measuresScheduled;

  }

  scheduleMeasureV2(time) {

    let scheduleTime = time;

    let notes = [];

    let beatTotal = 0;

    let maxIndex = this.notePool.length;

    while (beatTotal < 4) {

      let r = parseInt(Math.floor(Math.random() * maxIndex));

      if (beatTotal + this.notePool[r] > 4){
        maxIndex = r;
      }
      else{
        
        notes.push({
          element: null,
          selector: null,
          status: 'live',
          options: null,
          time: scheduleTime,
          beat: beatTotal,
          duration: this.notePool[r],
          strong: beatTotal % 1 === 0 ? true : false
        });
        
        beatTotal += this.notePool[r];

        scheduleTime += (this.secondsPerBeat * this.notePool[r]);

      }

    }

    for (let i in notes) {

      switch (notes[i].duration) {
        case 0.5:    
          let options = 'flag';

          if (notes[i].strong && notes[parseInt(i) + 1] !== undefined && notes[parseInt(i) + 1].duration === 0.5) {
            options = 'beam';
          }
          else if (notes[parseInt(i) - 1] !== undefined && notes[parseInt(i) - 1].duration === 0.5 && notes[parseInt(i) - 1].options === 'beam') {
            options = 'none';
          }
          notes[i].options = options;
          notes[i].element = this.getEighthNoteV2(0.5, options);
          break;
        case 1:
          notes[i].element = this.getQuarterNoteV2();
          break;
        case 2:
          notes[i].element = this.getHalfNoteV2();
          break;
        case 4:
          notes[i].element = this.getWholeNoteV2();
          break;
      }       

    }

    for (let i in notes) {

      let silentOsc = this.metronome.audioContext.createOscillator();
      silentOsc.connect(this.metronome.audioContext.destination);
      silentOsc.onended = () => { this.addNoteV2(notes[i]); };
      silentOsc.start(notes[i].time);
      silentOsc.stop(notes[i].time);

      this.notesScheduled++;

    }

    let barLine = this.getBarLine();

    let lastNote = notes[notes.length - 1];

    scheduleTime = lastNote.time + ((lastNote.duration * this.secondsPerBeat) * 0.8)

    let silentOsc = this.audioContext.createOscillator();
    silentOsc.connect(this.audioContext.destination);
    silentOsc.onended = () => { this.addBarLine(barLine, scheduleTime); };
    silentOsc.start(scheduleTime);
    silentOsc.stop(scheduleTime);

    this.measuresScheduled++;
    
    this.container.querySelector('#ScoreDiv').querySelector('#ScoreCorrect').innerText = this.measuresScheduled;

  }

  scheduleMeasureV3(time) {

    let scheduleTime = time;

    let notes = [];

    let beatTotal = 0;

    let maxIndex = this.notePool.length;

    while (beatTotal < 4) {

      let r = parseInt(Math.floor(Math.random() * maxIndex));

      if (beatTotal + this.notePool[r] > 4){
        maxIndex = r;
      }
      else{
        
        notes.push({
          master: true,
          element: null,
          selector: null,
          status: 'live',
          options: null,
          time: scheduleTime,
          beat: beatTotal,
          duration: this.notePool[r],
          strong: beatTotal % 1 === 0 ? true : false
        });
        
        beatTotal += this.notePool[r];

        scheduleTime += (this.secondsPerBeat * this.notePool[r]);

      }

    }

    for (let i in notes) {

      if (notes[i].element)
        continue;

      switch (notes[i].duration) {
        case 0.5:    
          let beamed = false;

          if (notes[i].strong && notes[parseInt(i) + 1] !== undefined && notes[parseInt(i) + 1].duration === 0.5) {
            beamed = true;
          }

          notes[i].element = this.getEighthNoteV3(0.5, beamed);
          notes[i].selector = '.group-one';

          if (beamed){
            notes[parseInt(i) + 1].element = notes[i].element;
            notes[parseInt(i) + 1].selector = '.group-two';
            notes[parseInt(i) + 1].master = false;
          }

          break;
        case 1:
          notes[i].element = this.getQuarterNoteV2();
          break;
        case 2:
          notes[i].element = this.getHalfNoteV2();
          break;
        case 4:
          notes[i].element = this.getWholeNoteV2();
          break;
      }       

    }

    for (let i in notes) {

      let silentOsc = this.metronome.audioContext.createOscillator();
      silentOsc.connect(this.metronome.audioContext.destination);
      silentOsc.onended = () => { this.addNoteV2(notes[i]); };
      silentOsc.start(notes[i].time);
      silentOsc.stop(notes[i].time);

      this.notesScheduled++;

    }

    let barLine = this.getBarLine();

    let lastNote = notes[notes.length - 1];

    let barlineOffset;

    if (lastNote.duration === 0.25) {
      barlineOffset = 0.125 * this.secondsPerBeat;
    }
    else if (lastNote.duration === 0.5) {
      barlineOffset = 0.25 * this.secondsPerBeat;
    }
    else {
      barlineOffset = 0.5 * this.secondsPerBeat;
    }

    scheduleTime = lastNote.time + ((lastNote.duration * this.secondsPerBeat) - barlineOffset);

    let silentOsc = this.audioContext.createOscillator();
    silentOsc.connect(this.audioContext.destination);
    silentOsc.onended = () => { this.addBarLine(barLine, scheduleTime); };
    silentOsc.start(scheduleTime);
    silentOsc.stop(scheduleTime);

    this.measuresScheduled++;
    
    this.container.querySelector('#ScoreDiv').querySelector('#ScoreCorrect').innerText = this.measuresScheduled;

  }

  attackNote(e) {

    let note = this.notesInQueue[0];

    let attack = this.audioContext.currentTime;

    if (Math.abs(note.targetAttack - attack) < this.forgivenessRate) {

      this.colorNote(note, 'blue');

      note.status = 'held';

    }
    else {

      this.colorNote(note, 'red');

      note.status = 'incorrect';

      this.incorrect++;

    }

  }

  releaseNote(e) {

    let note = this.notesInQueue[0];

    if (note.status !== 'incorrect') {

      let release = this.audioContext.currentTime;

      //if (Math.abs(note.targetRelease - release) < this.forgivenessRate * 2) {
      if (Math.abs(note.targetRelease - release) < (note.duration / 2 * this.secondsPerBeat)) {

        this.colorNote(note, 'green');

        this.correct++;

      }
      else {

        this.colorNote(note, 'red');

        this.incorrect++;

      }

    }

    let i = this.notesInQueue.indexOf(note);

    this.notesInQueue.splice(i, 1);

  }

  colorNote(note, color) {

    let elements;

    if (note.selector) {
      elements = note.element.querySelector(note.selector).querySelectorAll('.color-me');
    }
    else {
      elements = note.element.querySelectorAll('.color-me');
    }

    for (let e of elements) {
      e.setAttribute('fill', color);
    }

  }

  init() {
    
    let content = document.createElement('div');
    content.style.display = 'flex';
    content.style.justifyContent = 'center';
    content.style.padding = '3rem';

    this.container.querySelector('#DrillDiv').innerHTML = '';

    this.container.querySelector('#DrillDiv').appendChild(content);

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'SVG');
    svg.setAttribute('width', `${this.width}`);
    svg.setAttribute('height', `${this.height}`);

    content.appendChild(svg);

    let line = this.makeSVG('line', { x1: 0, y1: this.height * 0.5, x2: this.width, y2: this.height * 0.5, stroke: 'black', 'stroke-width': 1 });

    let target = this.makeSVG('line', { x1: this.targetX, y1: 0, x2: this.targetX, y2: this.height, stroke: 'red', 'stroke-width': 1 });

    //let target2 = this.makeSVG('circle', { cx: this.targetX, cy: this.height * 0.5, r: 10, stroke: 'red', 'stroke-width': 1, fill: 'none' });

    document.getElementById('SVG').appendChild(line);

    document.getElementById('SVG').appendChild(target);

    //document.getElementById('SVG').appendChild(target2);

    this.container.querySelector('#ScoreDiv').querySelector('#ScoreTotal').innerText = this.duration;

  }

  start() {

    let self = this;

    this.metronome.onclick = function(data) {

      if (self.measuresScheduled < self.duration) { //Have all measures been scheduled?

        if (data.beat == 1) {
          self.scheduleMeasureV3(data.time);
        }

      }
      else {

        if ((self.correct + self.incorrect) >= self.notesScheduled) {
          self.end();
        }

      }

    };

    if (!window.onkeydown) {
      window.onkeydown = function (e) {

        if (e.keyCode == 32 /*space bar*/ && !self.keyDown) {

          self.keyDown = true;

          self.attackNote();
          
        }

      };
    }

    if (!window.onkeyup) {
      window.onkeyup = function (e) {

        if (e.keyCode == 32 /*space bar*/ && self.keyDown) {

          self.keyDown = false;

          self.releaseNote();
          
        }

      };
    }

    this.intervalID = setInterval(function () {

      if (self.notesInQueue.length) {

        let note = self.notesInQueue[0];

        //let classes = note.element.classList;

        if (note.status === 'live') {

          let now = self.audioContext.currentTime;

          //let target = parseFloat(note.getAttribute('data-target-attack'));

          //let diff = now - target;
          let diff = now - note.targetAttack;

          if (diff > 0.25) {

            self.colorNote(note, 'red');

            let i = self.notesInQueue.indexOf(note);

            self.notesInQueue.splice(i, 1);

            self.incorrect++;

          }

        }

      }

    }, 60);

    this.metronome.start();

  }

  end() {

    this.metronome.onclick = null;

    window.onkeydown = null;

    window.onkeyup = null;

    clearInterval(this.intervalID);

    this.metronome.stop();

    if (this.callback) {
      this.callback({
        Tempo: this.metronome.tempo,
        TotalBars: this.duration,
        TotalNotes: this.notesScheduled,
        Correct: this.correct,
        Incorrect: this.incorrect,
        Accuracy: `${(100 * (this.correct / this.notesScheduled)).toFixed(2)}%`
      });
    }

  }

}

export { RhythmBox as default };