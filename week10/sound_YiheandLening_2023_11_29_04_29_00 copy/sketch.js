

let img;

function preload() {
  img = loadImage('Pixel 2.png');
}

let movingLines1 = [];
let movingLines2 = [];
// let lastPlayTime = 0
let oscillators = {
    sine: {},
    square: {},
    triangle: {},
    sawtooth: {}
};
let blocks = []; // 用于存储所有方块
let chords = {
    "C": ["C4", "E4", "G4"],
    "G": ["G4", "B4", "D5"],
    "A": ["A4", "C5", "E5"],
    "F": ["F4", "A4", "C5"],
    "D": ["D4", "F4", "A4"],
    "C5": ["C4", "E4", "G4", "B4", "D5"],  // C大七和弦加九度
    "D5": ["D4", "F4", "A4", "C5", "E5"],  // D小七和弦加九度
    "E5": ["E4", "G4", "B4", "D5", "F5"],  // E小七和弦加减九度
    "F5": ["F4", "A4", "C5", "E5", "G5"],  // F大七和弦加九度
    "G5": ["G4", "B4", "D5", "F5", "A4"],  // G七和弦加九度
    "A5": ["A4", "C5", "E5", "G5", "B4"],  // A小七和弦加九度
    "B5": ["B4", "D5", "F5", "A4", "C4"], 
};


function setup() {
    img.loadPixels();
    background(220);

    movingLines1 = [
     
        new MovingLine(0, windowHeight, windowWidth / 2, windowHeight / 2),
        new MovingLine(windowWidth / 2, windowHeight, windowWidth, windowHeight / 2)
    ];

    movingLines2 = [
        new MovingLine(0, windowHeight / 2, windowWidth / 2, 0),
        new MovingLine(windowWidth / 2, windowHeight / 2, windowWidth, 0),
        
    ];

    // 定义音符（C大调音阶）
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];

    // 初始化振荡器
    const types = ['sine', 'square', 'triangle', 'sawtooth'];
    types.forEach(type => {
        oscillators[type] = notes.reduce((acc, note) => {
            acc[note] = new Tone.Oscillator(note, type).toDestination();
            return acc;
        }, {});
    });
    initializeBlocks();

    
 
}

//和弦时间太短可能会出bug
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
        // 这里可以进行其他与音频相关的操作
    }).catch(e => {
        console.error('Error starting AudioContext', e);
    });
});

document.getElementById('startLines').addEventListener('click', function() {
    movingLines1.forEach(line => line.start());
    movingLines2.forEach(line => line.start());
});



function draw() {
    createCanvas(windowWidth, windowHeight);
    background(img);
    stroke(0);
    strokeWeight(1);

    // 水平线和垂直线
    line(0, windowHeight / 2, windowWidth, windowHeight / 2);
    line(windowWidth / 2, 0, windowWidth / 2, windowHeight);

    // 更新和绘制方块
    blocks.forEach(block => {
        block.update();
        block.draggableblockDraw();

        // 对于每条移动线，检查是否与方块重叠
        movingLines1.forEach(line => {
            if (line.x3 > block.x && line.x3 < block.x + block.w) {
                block.playChord();
                
            }
        });
        movingLines2.forEach(line => {
            if (line.x4 > block.x && line.x4 < block.x + block.w) {
                block.playChord();
            }
        });
    });
    
    // 更新和绘制移动的线
    movingLines1.forEach(line => {
        line.update1();
        line.draw1();
    });

    movingLines2.forEach(line => {
        line.update2();
        line.draw2();
    });

    updateCursorForBlocks()
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
      this.dragging = false; // 是否正在拖拽
      this.resizingRight = false; // 是否正在调整右边缘大小
      this.resizingLeft = false; // 是否正在调整左边缘大小
      this.dragOffsetX = 0; // 拖拽时的水平偏移量
      this.dragOffsetY = 0; // 拖拽时的垂直偏移量
      this.resizeMargin = 10; // 调整大小区域的边距
    }
  
    draggableblockDraw() {
        // 绘制方块
        noStroke();
        fill(255, 0, 20);
        rect(this.x, this.y, this.w, this.h*2);

        // 显示和弦
        fill(255);
        text(this.chord, this.x + this.w / 3, this.y + this.h*4/3 );

        // 检查是否和任何移动线重叠
        movingLines1.forEach(line => {
            if (line.x3 > this.x && line.x3 < this.x + this.w) {
                this.playChord();
            }
        });

        movingLines2.forEach(line => {
            if (line.x4 > this.x && line.x4 < this.x + this.w) {
                this.playChord();
            }
        });
    }
    

  
    // 更新方块状态
  update() {
    



    let overLeftEdge = mouseX > this.x && mouseX < this.x + this.resizeMargin;
    let overRightEdge = mouseX > this.x + this.w - this.resizeMargin && mouseX < this.x + this.w;
    let overVerticalRange = mouseY > this.y && mouseY < this.y + this.h;
    let insideBlock = mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
  
    // 如果正在调整大小
    if (this.resizingRight) {
      this.w = max(20, mouseX - this.x); // 设置最小宽度并调整宽度
    } else if (this.resizingLeft) {
      let newWidth = this.x + this.w - mouseX;
      if (newWidth > 20) { // 设置最小宽度
        this.x = mouseX;
        this.w = newWidth;
      }
    }
  
    // 如果正在拖拽，则更新方块位置
    if (this.dragging) {
      this.x = mouseX + this.dragOffsetX;
      this.y = mouseY + this.dragOffsetY;
    }
  
    return {
        isOverEdge: (overLeftEdge || overRightEdge) && overVerticalRange,
        isInside: insideBlock
      };
  }
  
    // 处理鼠标按下事件
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
  
    // 处理鼠标释放事件
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
        // 根据方块所在区域返回相应的波形类型
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
        this.moving = false; // 标记是否开始移动
        this.speed = 2; // 这里设定一个初始速度值，可以根据需要调整
    }

    start() {
        this.moving = true; // 启动线的运动
    }

    update1() {
        if (!this.moving) return;
        // 更新线的位置
        this.x3 += 4; // 以固定速度移动
        if (this.x3 > windowWidth) {
            this.x3 = this.x1; // 重置到初始位置
        }
    }

    update2() {
        if (!this.moving) return;
        this.x4 += this.speed;
        if (this.x4 > windowWidth) {
            this.x4 = this.x1; // 重置到初始位置
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
        // 这里您可能需要调整方块的初始位置和大小
        blocks.push(new DraggableBlock(i * 100 + 10, i * 60 + 10, 50, 20, chordNames[i]));
    }
}


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
  
