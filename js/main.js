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

animate();
