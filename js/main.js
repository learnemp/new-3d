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
    mixer.update(0.01); // You can adjust the time delta as needed
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

// Function to capture a photo with the model and camera feed
function capturePhotoWithModel() {
  // Create a canvas to hold the camera feed
  const cameraCanvas = document.createElement('canvas');
  cameraCanvas.width = videoElement.videoWidth;
  cameraCanvas.height = videoElement.videoHeight;
  const cameraContext = cameraCanvas.getContext('2d');
  cameraContext.drawImage(videoElement, 0, 0, cameraCanvas.width, cameraCanvas.height);

  // Render the 3D model onto the main canvas
  renderer.render(scene, camera);

  // Composite the camera feed and the 3D model
  cameraContext.drawImage(renderer.domElement, 0, 0);

  // Crop the image to remove unwanted parts (adjust these values as needed)
  const cropX = 0;
  const cropY = 0;
  const cropWidth = cameraCanvas.width;
  const cropHeight = cameraCanvas.height - 100; // Adjust to remove the bottom part

  // Create a cropped canvas
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedContext = croppedCanvas.getContext('2d');

  // Crop the image
  croppedContext.drawImage(cameraCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // Create a download link for the captured photo
  const a = document.createElement('a');
  a.href = croppedCanvas.toDataURL('image/png');
  a.download = 'captured-photo-with-model.png';
  a.click();
}

// Add an event listener to the "Capture Photo" button
const capturePhotoButton = document.getElementById("capturePhotoButton");
capturePhotoButton.addEventListener('click', capturePhotoWithModel);

animate();
