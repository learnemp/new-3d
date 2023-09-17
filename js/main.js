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

startCamera();

if (objToRender === "Avatar") {
  controls = new OrbitControls(camera, renderer.domElement);
}

let animationStarted = false;

function animate() {
  if (!animationStarted) {
    return;
  }

  requestAnimationFrame(animate);
  if (mixer) {
    mixer.update(0.014);
  }

  renderer.render(scene, camera);
}

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

const switchCameraButton = document.getElementById("switchCameraButton");
switchCameraButton.addEventListener('click', switchCamera);

let currentCameraFacingMode = "user";

function switchCamera() {
  currentCameraFacingMode = (currentCameraFacingMode === "user") ? "environment" : "user";

  const stream = videoElement.srcObject;
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentCameraFacingMode } } })
    .then(function (newStream) {
      videoElement.srcObject = newStream;
      videoElement.play();
    })
    .catch(function (error) {
      console.error('Error switching camera:', error);
    });
}

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

const screenshotButton = document.getElementById("screenshotButton");

screenshotButton.addEventListener('click', captureScreenshot);

const screenshotCanvas = document.createElement('canvas');
screenshotCanvas.width = window.innerWidth;
screenshotCanvas.height = window.innerHeight;
const screenshotContext = screenshotCanvas.getContext('2d');

function captureScreenshot() {
  screenshotContext.clearRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);
  screenshotContext.drawImage(videoElement, 0, 0, window.innerWidth, window.innerHeight);
  renderModelOnCanvas(screenshotContext);
  renderAdditionalElements(screenshotContext);

  const a = document.createElement('a');
  a.href = screenshotCanvas.toDataURL('image/png');
  a.download = 'screenshot.png';
  a.click();
}

function renderModelOnCanvas(context) {
  renderer.render(scene, camera);
  context.drawImage(renderer.domElement, 0, 0, window.innerWidth, window.innerHeight);
}

function renderAdditionalElements(context) {
  context.fillStyle = "red";
  context.fillRect(0, 0, window.innerWidth, 150);

  context.strokeStyle = "white";
  context.lineWidth = 2;
  context.strokeRect(0, 0, window.innerWidth, 150);

  const logoImage = new Image();
  logoImage.src = "../logob.png";
  logoImage.onload = () => {
    context.drawImage(logoImage, 10, 10, 90, 90);
  };

  context.fillStyle = "white";
  context.font = "5.1em 'Montserrat', sans-serif";

  const headerText = "International week for the deaf!";
  const textWidth = context.measureText(headerText).width;
  const centerX = (window.innerWidth - textWidth) / 2;

  context.shadowColor = "white";
  context.shadowBlur = 4;
  context.fillText(headerText, centerX, 90);

  context.fillStyle = "red";
  const footerHeight = 200;
  context.fillRect(0, window.innerHeight - footerHeight, window.innerWidth, footerHeight);
  context.strokeRect(0, window.innerHeight - footerHeight, window.innerWidth, footerHeight);

  const footerText = "I support for a world where deaf people";
  const footerText2 = "everywhere can sign anywhere!";
  const footerTextWidth = context.measureText(footerText).width;
  const footerText2Width = context.measureText(footerText2).width;

  const footerCenterX = (window.innerWidth - footerTextWidth) / 2;
  const footerCenterX2 = (window.innerWidth - footerText2Width) / 2;

  context.fillStyle = "white";
  context.font = "5.1em 'Montserrat', sans-serif";

  context.shadowColor = "white";
  context.shadowBlur = 4;
  context.fillText(footerText, footerCenterX, window.innerHeight - 120);
  context.fillText(footerText2, footerCenterX2, window.innerHeight - 60);
}
