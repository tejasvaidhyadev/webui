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
}

function hideBoundingBox() {
    var boundingBox = document.getElementById("boundingBox");
    boundingBox.style.display = "none";
}