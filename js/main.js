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
  const canvasAspectRatio = window.innerWidth / window.innerHeight;

  let drawWidth, drawHeight, xOffset, yOffset;

  if (videoAspectRatio > canvasAspectRatio) {
    // Video is wider than the canvas
    drawWidth = window.innerWidth;
    drawHeight = window.innerWidth / videoAspectRatio;
    xOffset = 0;
    yOffset = (window.innerHeight - drawHeight) / 2;
  } else {
    // Video is taller than the canvas
    drawWidth = window.innerHeight * videoAspectRatio;
    drawHeight = window.innerHeight;
    xOffset = (window.innerWidth - drawWidth) / 2;
    yOffset = 0;
  }

  // Draw the camera feed while maintaining aspect ratio
  screenshotContext.drawImage(
    videoElement,
    xOffset,
    yOffset,
    drawWidth,
    drawHeight
  );

  // Render the 3D model
  renderModelOnCanvas(screenshotContext);

  // Render additional elements (header and footer)
  renderAdditionalElements(screenshotContext);

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
