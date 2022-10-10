import RhythmBox from './rhythmbox.js';

var menuDiv = document.querySelector('#Menu');
var drillDiv = document.querySelector('#Drill');
var scoreDiv = document.querySelector('#Score');

var tempoLabel = menuDiv.querySelector('#TempoLabel');
var tempoSlider = menuDiv.querySelector('#TempoSlider');
var decreaseTempo = menuDiv.querySelector('#DecreaseTempo');
var increaseTempo = menuDiv.querySelector('#IncreaseTempo');

var rhythmOptions = menuDiv.querySelector('div.rhythm-options');

var startButton = menuDiv.querySelector('#StartButton');
var rhythmBox;

tempoSlider.oninput = function (e) {
    tempoLabel.innerText = this.value;
};

decreaseTempo.onclick = function (e) {
    let val = parseInt(tempoSlider.value) - 1;

    tempoSlider.value = val;

    tempoLabel.innerText = val;
};

increaseTempo.onclick = function (e) {
    let val = parseInt(tempoSlider.value) + 1;

    tempoSlider.value = val;

    tempoLabel.innerText = val;
};

startButton.onclick = function (e) {
    
    menuDiv.style.display = 'none';

    drillDiv.style.display = null;

    let tempo = tempoSlider.value;
    let duration = parseInt(menuDiv.querySelector('input[name="Duration"]:checked').value);

    let options = {
      tempo: tempo,
      duration: duration,
      notes: {
        whole:          rhythmOptions.querySelector('input[name="Whole"]').checked,
        half:           rhythmOptions.querySelector('input[name="Half"]').checked,
        quarter:        rhythmOptions.querySelector('input[name="Quarter"]').checked,
        eighth:         rhythmOptions.querySelector('input[name="Eighth"]').checked,
        sixteenth:      rhythmOptions.querySelector('input[name="Sixteenth"]').checked,
        thirtysecond:   rhythmOptions.querySelector('input[name="Thirtysecond"]').checked
      },
      dottedRhythms: false,
      rests: false
    }

    rhythmBox = new RhythmBox(drillDiv.querySelector('#RhythmBox'), options, function (data) {

        drillDiv.style.display = 'none';

        scoreDiv.querySelector('span[name="Tempo"]').innerText = data.Tempo;
        scoreDiv.querySelector('span[name="TotalBars"]').innerText = data.TotalBars;
        scoreDiv.querySelector('span[name="TotalNotes"]').innerText = data.TotalNotes;
        scoreDiv.querySelector('span[name="Correct"]').innerText = data.Correct;
        scoreDiv.querySelector('span[name="Incorrect"]').innerText = data.Incorrect;
        scoreDiv.querySelector('span[name="Accuracy"]').innerText = data.Accuracy;

        scoreDiv.querySelector('button').onclick = function (e) {
            scoreDiv.style.display = 'none';
            menuDiv.style.display = null;
        };

        scoreDiv.style.display = null;

    });

    rhythmBox.init();

    rhythmBox.start();

};
