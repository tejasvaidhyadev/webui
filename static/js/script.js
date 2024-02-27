function generateStory() {
    var storyInput = document.getElementById('textInput').value;
    var requestData = {contents: [{parts: [{text: storyInput}]}]};
    fetch('/generate_story',
        {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestData)})
    .then(response => response.json())
    .then(data => {displayStory(data); console.log(data);})
    .catch(error => {console.error('Error:', error);});
}
function displayStory(data) {
    var outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';
    if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        var story = data.candidates[0].content.parts[0].text;
        var storyParagraph = document.createElement('p');
        storyParagraph.textContent = story;
        outputDiv.appendChild(storyParagraph);
        var markdownStory = '## Story\n\n' + story;
        outputDiv.innerHTML = marked(markdownStory);
    } else {
        outputDiv.textContent = 'Unable to generate story. Please try again.';
    }
}
function handleImageUpload(event) {
    var imageInput = event.target;
    var imagePreview = document.getElementById("imagePreview");
    var file = imageInput.files[0];

    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var maxWidth = 1000;
                var maxHeight = 1000;
                var width = img.width;
                var height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                var resizedImage = canvas.toDataURL('image/jpeg');

                var imgElement = document.createElement("img");
                imgElement.src = resizedImage;
                imgElement.alt = "Uploaded Image";
                imagePreview.innerHTML = "";
                imagePreview.appendChild(imgElement);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
function getImageAndTextPrompt() {
    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = "";
    const imagePreview = document.getElementById("imagePreview");
    const imageInput = document.getElementById("imageInput");
    outputDiv.innerHTML = "some text here";

    if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = document.createElement("img");
            image.src = e.target.result;
            image.alt = "Uploaded Image";
            imagePreview.innerHTML = "";
            imagePreview.appendChild(image);
        }
        reader.readAsDataURL(file);
    }
}
function dragOverHandler(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}
function dropHandler(event) {
    event.preventDefault();
    var files = event.dataTransfer.files;
    var imageInput = document.getElementById("imageInput");
    imageInput.files = files;
    handleImageUpload(event);
}
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