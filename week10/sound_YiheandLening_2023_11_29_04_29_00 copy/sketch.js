let img;// backgournd 
let movingLines1 = []; 
let movingLines2 = [];
let oscillators = {
    sine: {}, //timbre
    square: {},
    triangle: {},
    sawtooth: {}
};
let blocks = []; 
let chords = {
    "C": ["C4", "E4", "G4"],
    "G": ["G4", "B4", "D5"],
    "A": ["A4", "C5", "E5"],
    "F": ["F4", "A4", "C5"],
    "D": ["D4", "F4", "A4"],
    "C5": ["C4", "E4", "G4", "B4", "D5"],  // C大七和弦加九度 （Chords in chinese）
    "D5": ["D4", "F4", "A4", "C5", "E5"],  // D小七和弦加九度
    "E5": ["E4", "G4", "B4", "D5", "F5"],  // E小七和弦加减九度
    "F5": ["F4", "A4", "C5", "E5", "G5"],  // F大七和弦加九度
    "G5": ["G4", "B4", "D5", "F5", "A4"],  // G七和弦加九度
    "A5": ["A4", "C5", "E5", "G5", "B4"],  // A小七和弦加九度
    "B5": ["B4", "D5", "F5", "A4", "C4"], 
};


function preload() {
  img = loadImage('Pixel 2.png');
}

function setup() {
    img.loadPixels();
    background(220);

    movingLines1 = [
     
        new MovingLine(0, windowHeight, windowWidth / 2, windowHeight / 2),
        new MovingLine(windowWidth / 2, windowHeight, windowWidth, windowHeight / 2)
    ]; // push new movinglines into array

    movingLines2 = [
        new MovingLine(0, windowHeight / 2, windowWidth / 2, 0),
        new MovingLine(windowWidth / 2, windowHeight / 2, windowWidth, 0),
        
    ];


    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
   
    const types = ['sine', 'square', 'triangle', 'sawtooth'];
    types.forEach(type => {
        oscillators[type] = notes.reduce((acc, note) => {
            acc[note] = new Tone.Oscillator(note, type).toDestination();
            return acc;
        }, {});
    });
  
    initializeBlocks();
// function that push all blocks into an array
    
 
}



//set the play duration below 0.5 will break the Browser
function playChord(chordNotes, type) {
    let now = Tone.now();
    chordNotes.forEach(note => {
        if (oscillators[type][note]) {
            let osc = oscillators[type][note];
            osc.start(now).stop(now + 0.5); // 和弦持续1秒
        } else {
            console.error(`Oscillator not found for note: ${note} and type: ${type}`);
        }
    });
}

document.getElementById('startAudio').addEventListener('click', function() {
    Tone.start().then(() => {
        console.log('AudioContext successfully started');
        // test if people interacted with the browser
    }).catch(e => {
        console.error('Error starting AudioContext', e);
      // test if people failed interacted with the browser
    });
});

document.getElementById('startLines').addEventListener('click', function() {
    movingLines1.forEach(line => line.start()); 
    movingLines2.forEach(line => line.start());
}); // button for start moving the line



function draw() {
    createCanvas(windowWidth, windowHeight);
    background(img);
    stroke(255);
    strokeWeight(4);

    // line devide screen
    line(0, windowHeight / 2, windowWidth, windowHeight / 2);
    line(windowWidth / 2, 0, windowWidth / 2, windowHeight);

    // draw and update the block
    blocks.forEach(block => {
        block.update();
        block.draggableblockDraw();
    });
    
    // draw and update the line
    movingLines1.forEach(line => {
        line.update1();
        line.draw1();
    });

    movingLines2.forEach(line => {
        line.update2();
        line.draw2();
    });

    updateCursorForBlocks()
    // function that change cursor
}





function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


class DraggableBlock {
    constructor(x, y, w, h, chord) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.chord = chord;
      this.dragging = false; // check if dargging
      this.resizingRight = false; // chech if rightside of the block is changing
      this.resizingLeft = false; // chech if leftside of the block is changing
      this.dragOffsetX = 0; // how much moved horizontally
      this.dragOffsetY = 0; // how much moved vertically
      this.resizeMargin = 10; // resize margin
    }
  
    draggableblockDraw() {
     
        noStroke();
        fill(255, 0, 20);
        rect(this.x, this.y, this.w, this.h*2);

        // text
        fill(255);
        text(this.chord, this.x + this.w / 3, this.y + this.h*4/3 );

        // check if a moving line is hover
        movingLines1.forEach(line => {
            if (line.x3 > this.x && line.x3 < this.x + this.w && line.y1 > this.y && line.y2 <this.y + this.h*2) {
                this.playChord();
            }
        });

        movingLines2.forEach(line => {
            if (line.x4 > this.x && line.x4 < this.x + this.w && line.y1 > this.y && line.y2 <this.y + this.h*2) {
                this.playChord();
            }
        });
    }
    

  
    // update
  update() {
    
    let overLeftEdge = mouseX > this.x && mouseX < this.x + this.resizeMargin;
    let overRightEdge = mouseX > this.x + this.w - this.resizeMargin && mouseX < this.x + this.w;
    let overVerticalRange = mouseY > this.y && mouseY < this.y + this.h;
    let insideBlock = mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
  
   
    if (this.resizingRight) {
      this.w = max(20, mouseX - this.x); // limit the minimum size 
    } else if (this.resizingLeft) {
      let newWidth = this.x + this.w - mouseX;
      if (newWidth > 20) { // limit the minimum size 
        this.x = mouseX;
        this.w = newWidth;
      }
    }
  
    // change location
    if (this.dragging) {
      this.x = mouseX + this.dragOffsetX;
      this.y = mouseY + this.dragOffsetY;
    }
  
    return {
        isOverEdge: (overLeftEdge || overRightEdge) && overVerticalRange,
        isInside: insideBlock
      };
  }
  
    // check if dragging
    pressed() {
      let overVerticalRange = mouseY > this.y && mouseY < this.y + this.h;
      let overLeftEdge = mouseX > this.x && mouseX < this.x + this.resizeMargin;
      let overRightEdge = mouseX > this.x + this.w - this.resizeMargin && mouseX < this.x + this.w;
  
      if (overVerticalRange && (overLeftEdge || overRightEdge)) {
        this.resizingLeft = overLeftEdge;
        this.resizingRight = overRightEdge;
      } else if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
        this.dragging = true;
        this.dragOffsetX = this.x - mouseX;
        this.dragOffsetY = this.y - mouseY;
      }
    }
  
    // check if not dragging
    released() {
      this.dragging = false;
      this.resizingRight = false;
      this.resizingLeft = false;
    }

    playChord() {
        let now = Tone.now();
        if (!this.lastPlayTime || now - this.lastPlayTime > 0.5) { // 至少0.5秒间隔
            let chord = chords[this.chord];
            if (chord) {
                playChord(chord, this.getOscillatorType());
                this.lastPlayTime = now;
            }
        }
    }

    getOscillatorType() {
        // chack the tone according to the area
        if (this.y < windowHeight / 2) {
            return this.x < windowWidth / 2 ? 'sine' : 'square';
        } else {
            return this.x < windowWidth / 2 ? 'triangle' : 'sawtooth';
        }
    }




  }
  
  class MovingLine {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x1;
        this.x4 = x2
        this.y = y1;
        this.moving = false; 
        this.speed = 2; 
    }

    start() {
        this.moving = true;
    }

    update1() {
        if (!this.moving) return;
        this.x3 += 4; 
        if (this.x3 > windowWidth) {
            this.x3 = this.x1; // go back to the start point
        }
    }

    update2() {
        if (!this.moving) return;
        this.x4 += this.speed;
        if (this.x4 > windowWidth) {
            this.x4 = this.x1; 
        }
    }

    draw1() {
        if (this.moving) {
            strokeWeight(4);
            stroke(0, 0, 255);
            line(this.x3, this.y1, this.x3, this.y2);
        }
    }
    draw2() {
        if (this.moving) {
            strokeWeight(4);
            stroke(0, 0, 255);
            line(this.x4, this.y1, this.x4, this.y2);
        }
    }

        
}



function initializeBlocks() {
    let chordNames = Object.keys(chords);
    for (let i = 0; i < chordNames.length; i++) {
        blocks.push(new DraggableBlock(i * 100 + 10, i * 60 + 10, 50, 20, chordNames[i]));
    }
} // function that push all blocks into an array


  function mousePressed() {
    for (let block of blocks) {
      block.pressed();
    }
  }
  
  function mouseReleased() {
    for (let block of blocks) {
      block.released();
    }
  }

  function updateCursorForBlocks() {
    let cursorUpdated = false;
  
    for (let block of blocks) {
      let result = block.update();
  
      if (result.isOverEdge) {
        cursor('ew-resize');
        cursorUpdated = true;
        break;
      } else if (result.isInside) {
        cursor('move');
        cursorUpdated = true;
        break;
      }
    }
  
    if (!cursorUpdated) {
      cursor('default');
    }
  }
  
