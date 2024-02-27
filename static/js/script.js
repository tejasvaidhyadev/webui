function getCoordinates(event) {
    var image = event.target;
    var rect = image.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var normalizedX = Math.round((x / rect.width) * 100);
    var normalizedY = Math.round((y / rect.height) * 100);
    var coordinatesDisplay = document.getElementById("coordinatesDisplay");
    coordinatesDisplay.style.display = "block";
    coordinatesDisplay.style.left = event.clientX + "px";
    coordinatesDisplay.style.top = event.clientY + "px";
    coordinatesDisplay.textContent = "(" + normalizedX + ", " + normalizedY + ")";
}
var imagePreview = document.getElementById("imagePreview");
imagePreview.addEventListener("mousemove", getCoordinates);
imagePreview.addEventListener("mouseleave", function() {
    var coordinatesDisplay = document.getElementById("coordinatesDisplay");
    coordinatesDisplay.style.display = "none";
    hideHatchingOverlays();
});

function showBoundingBox(x1, y1, x2, y2) {
    var boundingBox = document.getElementById("boundingBox");
    var image = document.getElementById("imagePreview");
    var rect = image.getBoundingClientRect();
    var scaleWidth = rect.width / 100;
    var scaleHeight = rect.height / 100;
    boundingBox.style.left = (rect.left + x1 * scaleWidth) + "px";
    boundingBox.style.top = (rect.top + y1 * scaleHeight) + "px";
    boundingBox.style.width = ((x2 - x1) * scaleWidth) + "px";
    boundingBox.style.height = ((y2 - y1) * scaleHeight) + "px";
    boundingBox.style.display = "block";
    showHatchingOverlays(x1, y1, x2, y2);
}

function hideBoundingBox() {
    var boundingBox = document.getElementById("boundingBox");
    boundingBox.style.display = "none";
    hideHatchingOverlays();
}

function showHatchingOverlays(x1, y1, x2, y2) {
    var image = document.getElementById("imagePreview");
    var rect = image.getBoundingClientRect();
    var scaleWidth = rect.width / 100;
    var scaleHeight = rect.height / 100;

    // Calculate positions and sizes of the hatching overlays
    var overlayTop = document.getElementById("overlayTop");
    var overlayRight = document.getElementById("overlayRight");
    var overlayBottom = document.getElementById("overlayBottom");
    var overlayLeft = document.getElementById("overlayLeft");

    overlayTop.style.left = rect.left + "px";
    overlayTop.style.top = rect.top + "px";
    overlayTop.style.width = rect.width + "px";
    overlayTop.style.height = (y1 * scaleHeight) + "px";
    overlayTop.style.display = "block";

    overlayRight.style.left = (rect.left + (x2 * scaleWidth)) + "px";
    overlayRight.style.top = (rect.top + (y1 * scaleHeight)) + "px";
    overlayRight.style.width = (rect.width - (x2 * scaleWidth)) + "px";
    overlayRight.style.height = ((y2 - y1) * scaleHeight) + "px";
    overlayRight.style.display = "block";

    overlayBottom.style.left = rect.left + "px";
    overlayBottom.style.top = (rect.top + (y2 * scaleHeight)) + "px";
    overlayBottom.style.width = rect.width + "px";
    overlayBottom.style.height = (rect.height - (y2 * scaleHeight)) + "px";
    overlayBottom.style.display = "block";

    overlayLeft.style.left = rect.left + "px";
    overlayLeft.style.top = (rect.top + (y1 * scaleHeight))+ "px";
    overlayLeft.style.width = (x1 * scaleWidth) + "px";
    overlayLeft.style.height = ((y2 - y1) * scaleHeight) + "px";
    overlayLeft.style.display = "block";
}

function hideHatchingOverlays() {
    var overlays = document.getElementsByClassName("hatchingOverlay");
    for (var i = 0; i < overlays.length; i++) {
        overlays[i].style.display = "none";
    }
}
