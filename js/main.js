import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let object;
let controls;
let objToRender = 'Avatar';
let mixer; // AnimationMixer

const loader = new GLTFLoader();

loader.load(
  `models/${objToRender}/Avatar.gltf`,
  function (gltf) {
    object = gltf.scene;

    const animations = gltf.animations;
    if (animations && animations.length > 0) {
      mixer = new THREE.AnimationMixer(object);
      animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    if (object) {
      object.position.y = -7;
    }
    scene.add(object);

    // Start the animation after 2 seconds
    // setTimeout(() => {
    //   animate();
    // }, 3000);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.error(error);
  }
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

camera.position.z = objToRender === "Avatar" ? 25 : 500;

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333, objToRender === "Avatar" ? 5 : 1);
scene.add(ambientLight);

// Create a video element to capture the camera feed
const videoElement = document.createElement('video');
videoElement.autoplay = true;
videoElement.playsInline = true;
videoElement.style.position = "absolute";
videoElement.style.top = "0";
videoElement.style.left = "0";
videoElement.style.width = "100%";
videoElement.style.height = "100%";
videoElement.style.objectFit = "cover";
videoElement.style.zIndex = "-1";
document.body.appendChild(videoElement);

// Function to start the camera feed
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      videoElement.srcObject = stream;
      videoElement.play();
    })
    .catch(function (error) {
      console.error('Error starting camera:', error);
    });
}

// Start the camera feed immediately
startCamera();

if (objToRender === "Avatar") {
  controls = new OrbitControls(camera, renderer.domElement);
}

// Set a variable to track if the animation should start
let animationStarted = false;

function animate() {
  if (!animationStarted) {
    // If the animation hasn't started yet, do nothing and return
    return;
  }

  requestAnimationFrame(animate);
  if (mixer) {
    mixer.update(0.014); // You can adjust the time delta as needed
  }

  renderer.render(scene, camera);
}

// Delay the animation for 2 seconds (2000 milliseconds)
setTimeout(() => {
  animationStarted = true;
  animate();
}, 3000);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

// Add an event listener to the "Switch Camera" button
const switchCameraButton = document.getElementById("switchCameraButton");
switchCameraButton.addEventListener('click', switchCamera);

let currentCameraFacingMode = "user"; // Default to front camera

// Function to switch between front and back cameras
function switchCamera() {
  currentCameraFacingMode = (currentCameraFacingMode === "user") ? "environment" : "user";

  // Stop the current camera stream
  const stream = videoElement.srcObject;
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }

  // Get the new camera stream based on facing mode
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentCameraFacingMode } } })
    .then(function (newStream) {
      videoElement.srcObject = newStream;
      videoElement.play();
    })
    .catch(function (error) {
      console.error('Error switching camera:', error);
    });
}

// Add event listeners for screen recording
const recordVideoButton = document.getElementById("recordVideoButton");
const stopRecordingButton = document.createElement("button");
stopRecordingButton.id = "stopRecordingButton";
stopRecordingButton.textContent = "Stop Recording";
stopRecordingButton.style.display = "none";

recordVideoButton.addEventListener("click", startRecording);
stopRecordingButton.addEventListener("click", stopRecording);

document.getElementById("buttonContainerBottom").appendChild(stopRecordingButton);

let mediaRecorder;
let recordedChunks = [];

function startRecording() {
  if (typeof mediaRecorder === "undefined" || mediaRecorder.state === "inactive") {
    mediaRecorder = new MediaRecorder(videoElement.srcObject);
    recordedChunks = [];

    mediaRecorder.ondataavailable = function (event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function () {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recorded-video.webm';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    recordVideoButton.style.display = 'none';
    stopRecordingButton.style.display = 'block';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordVideoButton.style.display = 'block';
    stopRecordingButton.style.display = 'none';
  }
}


// Create a screenshot button element
const screenshotButton = document.getElementById("screenshotButton");

// Add an event listener to the screenshot button
screenshotButton.addEventListener('click', captureScreenshot);

// // Create a canvas element to render the screenshot
// const screenshotCanvas = document.createElement('canvas');
// screenshotCanvas.width = window.innerWidth;
// screenshotCanvas.height = window.innerHeight;
// const screenshotContext = screenshotCanvas.getContext('2d');

// Function to capture a screenshot
function captureScreenshot() {
  // Create a canvas
  const screenshotCanvas = document.createElement('canvas');
  screenshotCanvas.width = window.innerWidth;
  screenshotCanvas.height = window.innerHeight;
  const screenshotContext = screenshotCanvas.getContext('2d');

  // Clear the screenshot canvas
  screenshotContext.clearRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);

  // Calculate the dimensions to maintain aspect ratio
  const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
  const canvasAspectRatio = window.innerWidth / (window.innerHeight + 50); // Subtract header height

  let drawWidth, drawHeight, xOffset, yOffset;

  if (videoAspectRatio > canvasAspectRatio) {
    // Video is wider than the canvas
    drawWidth = window.innerWidth;
    drawHeight = window.innerWidth / videoAspectRatio;
    xOffset = 0;
    yOffset = (window.innerHeight + 20 - drawHeight) / 2; // Subtract header height
  } else {
    // Video is taller than the canvas
    drawWidth = (window.innerHeight + 20) * videoAspectRatio; // Subtract header height
    drawHeight = window.innerHeight + 20; // Subtract header height
    xOffset = (window.innerWidth - drawWidth) / 2;
    yOffset = 0;
  }

  // Draw the camera feed while maintaining aspect ratio
  screenshotContext.drawImage(
    videoElement,
    xOffset,
    yOffset - 20, // Add header height
    drawWidth,
    drawHeight
  );

  // Render the 3D model
  renderModelOnCanvas(screenshotContext);

  // Render additional elements (header and footer)
  renderAdditionalElements(screenshotContext);

  // Get the logo image element
  const logoImage = document.getElementById('logoImage');

   // Draw the logo image on top of the screenshot
   screenshotContext.drawImage(logoImage, 10, 10, 90, 90); // Adjust the position and size as needed

  // Create a download link for the screenshot
  const a = document.createElement('a');
  a.href = screenshotCanvas.toDataURL('image/png');
  a.download = 'screenshot.png';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
}




// Function to render the model on the given canvas context
function renderModelOnCanvas(context) {
  renderer.render(scene, camera);
  context.drawImage(renderer.domElement, 0, 0, window.innerWidth, window.innerHeight);
}




// Function to render additional elements on the canvas
function renderAdditionalElements(context) {
  // Header
  context.fillStyle = "red"; // Set background color
  context.fillRect(0, 0, window.innerWidth, 250); // Draw a background rectangle

  // Add a border to the header
  context.strokeStyle = "white"; // Set border color
  context.lineWidth = 2; // Set border width
  context.strokeRect(0, 0, window.innerWidth, 250); // Draw a border around the header

  // Logo
  const logoImage = new Image();
  logoImage.src = "./logob.jpg";
  logoImage.onload = () => {
    context.drawImage(logoImage, 10, 10, 90, 90); // Adjust the position and size as needed
  };

  // Header Text
  context.fillStyle = "white"; // Set text color
  context.font = "5.1em 'Montserrat', sans-serif"; // Set font size and family

  const headerText = "International week for the deaf!";
  const textWidth = context.measureText(headerText).width;
  const centerX = (window.innerWidth - textWidth) / 2;

  // Add styles to header text
  context.shadowColor = "white"; // Add a shadow
  context.shadowBlur = 4;
  context.fillText(headerText, centerX, 150);

  // Footer
  const gradient = context.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#09203f");
  gradient.addColorStop(1, "#537895");

  context.fillStyle = gradient; // Set gradient as the background
  context.fillRect(0, window.innerHeight - 270, window.innerWidth, 270); // Draw a background rectangle

  // Add a border to the footer
  context.strokeStyle = "white"; // Set border color
  context.lineWidth = 2; // Set border width
  context.strokeRect(0, window.innerHeight - 270, window.innerWidth, 270); // Draw a border around the footer

  // Footer Text
  const footerText = "I support for a world where deaf people";
  const footerText2 = "everywhere can sign anywhere!";
  const footerTextWidth = context.measureText(footerText).width;
  const footerText2Width = context.measureText(footerText2).width;

  // Calculate the center for each line of text
  const footerCenterX = (window.innerWidth - footerTextWidth) / 2;
  const footerCenterX2 = (window.innerWidth - footerText2Width) / 2;

  context.fillStyle = "white"; // Set text color for footer
  context.font = "5.1em 'Montserrat', sans-serif";

  // Add styles to footer text
  context.shadowColor = "white"; // Add a shadow
  context.shadowBlur = 4;
  context.fillText(footerText, footerCenterX, window.innerHeight - 160); // Center the first line of footer text horizontally
  context.fillText(footerText2, footerCenterX2, window.innerHeight - 80); // Center the second line of footer text horizontally
}
