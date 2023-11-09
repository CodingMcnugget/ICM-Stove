let danceVideo; 
let overlayVideo; // Declare a new video element for the overlay video （not working）
let pressTime = 0;
let playTime = 0;
let pixelMap = 25;

function setup() {
  createCanvas(960, 772);
  danceVideo = createVideo(["IMG_2302 2-1.mov"]);
  // overlayVideo = createVideo(['Butterfly.mp4']); // Load your overlay video
  danceVideo.hide();
  // overlayVideo.hide(); // Hide the overlay video
  pixelDensity(1);
}

function draw() {
  playTime = playTime + 1;
  background(220);

  // tint(255, 0, 0, 100);
  danceVideo.loadPixels();
  loadPixels();
  image(danceVideo, 0, 0, width, height);

  // Draw the original video frames
  for (let y = 0; y < danceVideo.height; y += pixelMap) {
    for (let x = 0; x < danceVideo.width; x += pixelMap) {
      let index = (x + y * danceVideo.width) * 4;
      let r = danceVideo.pixels[index + 0] + 54;
      let g = danceVideo.pixels[index + 1] + 30;
      let b = danceVideo.pixels[index + 2] + 110;
      let pixelSizeOrg = pixelDistance(x, y);

      let pixelSize = map(pixelSizeOrg, 0, 400, 0, 40);

      fill(r, g, b);
      noStroke();
      circle(x, y, pixelSize - 45);
    }
  }

  // Draw the overlay video on top of the canvas
  // image(overlayVideo, 0, 0, width, height);
}

// play or pause video
function mousePressed() {
  if (pressTime == 0) {
    danceVideo.play();
    danceVideo.loop(); // why is this in blue?
    // overlayVideo.play(); // Start the overlay video
    // overlayVideo.loop()
    pressTime = 1;
  } else if (pressTime == 1) {
    danceVideo.pause();
    // overlayVideo.pause(); // Pause the overlay video
    pressTime = 0;
  }
}

function pixelDistance(x, y) {
  let pixelDistance;
  let xDistance;
  let yDistance;
  xDistance = abs(mouseX - x);
  yDistance = abs(mouseY - y);
  pixelDistance = sqrt(xDistance * xDistance + yDistance * yDistance);
  return pixelDistance;
}
