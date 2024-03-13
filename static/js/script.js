function clearFields() {
  document.getElementById("imagePreview").innerHTML =
    '<label for="imageInput" class="drag-drop" ondragover="dragOverHandler(event)" ondrop="dropHandler(event)"><p>Drag & Drop Your Document</p></label>';
  document.getElementById("textInput").value = "";
  document.getElementById("output").innerHTML = "";
  document.getElementById("imageInput").value = "";
  document.getElementById("successMessage").style.display = "none";
  document.getElementById("afterResponse").style.display = "none";
}

function generateStory() {
  // Display loading text on the button
  document.getElementById("submitButton").innerText = "Loading...";

  var imageInput = document.getElementById("imageInput");
  var textInput = document.getElementById("textInput");
  var uploadedImageInput = document.getElementById("uploadedImage");

  if (imageInput.files.length === 0 || textInput.value.trim() === "") {
    alert("Please upload an image and enter a text prompt.");
    // Restore the original text on the button
    document.getElementById("submitButton").innerText = "Submit";
    return;
  }

  // Retrieve current values from sliders
  var temperatureSlider = document.getElementById("temperatureSlider");
  var tokenLimitSlider = document.getElementById("tokenLimitSlider");

  // Prepare the request data
  var requestData = {
    contents: [
      {
        parts: [
          {
            text: textInput.value,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: temperatureSlider.value,
      candidateCount: 1,
      maxOutputTokens: tokenLimitSlider.value,
    },
  };

  // Make two API calls with the same configuration
  Promise.all([
    fetch("/generate_story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }),
    fetch("/generate_story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modifyRequestData(requestData)),
    }),
  ])
    .then((responses) =>
      Promise.all(responses.map((response) => response.json()))
    )
    .then((data) => {
      // Remove the loading text and display the resulting stories side by side
      document.getElementById("submitButton").innerText = "Submit";
      stories = data;
      displayStories(data);
    })
    .catch((error) => {
      // Remove the loading text in case of an error
      console.error("Error:", error);
      document.getElementById("submitButton").innerText = "Submit";
    });
}

// Modify request data for the second API call
function modifyRequestData(requestData) {
  // Adjust temperature and maxOutputTokens for the second call
  var modifiedRequestData = JSON.parse(JSON.stringify(requestData)); // Deep copy to avoid modifying original data
  modifiedRequestData.generationConfig.temperature =
    parseInt(modifiedRequestData.generationConfig.temperature) + 0.4; // Increase temperature by 0.4
  modifiedRequestData.generationConfig.maxOutputTokens =
    parseInt(modifiedRequestData.generationConfig.maxOutputTokens) + 100; // Increase maxOutputTokens by 100
  return modifiedRequestData;
}

// Display stories side by side
function displayStories(stories) {
  var outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear previous content

  document.getElementById("afterResponse").style.display = "block";

  stories.forEach((data, index) => {
    var storyDiv = document.createElement("div");
    storyDiv.classList.add("story");
    storyDiv.textContent = ""; // Clear previous content

    // Add styling to the story div
    storyDiv.style.background = index % 2 === 0 ? "#f0f0f0" : "#ffffff";
    storyDiv.style.borderRadius = "8px"; // Rounded corners
    storyDiv.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"; // Shadow effect
    storyDiv.style.padding = "20px"; // Padding
    storyDiv.style.overflow = "auto"; // Add scrollbar if content overflows
    if (
      data &&
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      var story = data.candidates[0].content.parts[0].text;
      var storyParagraph = document.createElement("p");
      storyParagraph.textContent = story;
      storyDiv.appendChild(storyParagraph);

      // Stream the received output and markdownify it
      var markdownStory = "## Story\n\n" + story; // Adding markdown header
      storyDiv.innerHTML = marked(markdownStory); // Assuming marked.js library is used for markdown conversion
    } else {
      storyDiv.textContent = "Unable to generate story. Please try again.";
    }

    // Make the story clickable to handle user selection

    storyDiv.addEventListener("click", function () {
      highlightStory(index); // Pass the index to identify the selected story
      submitUserResponse(stories, index);
    });

    outputDiv.appendChild(storyDiv);
  });
}

var selectedIndex = -1;
var stories = [];

// Highlight the selected story
function highlightStory(index) {
  selectedIndex = index;

  var storyDivs = document.querySelectorAll(".story");
  document.getElementById("afterResponse").style.display = "none"; // Show the response section (if hidden

  storyDivs.forEach((storyDiv, i) => {
    if (i === index) {
      storyDiv.style.backgroundColor = "#ffffcc"; // Change the background color to yellow (or any other color you prefer)
    } else {
      storyDiv.style.backgroundColor = ""; // Reset background color for unselected stories
    }
  });
}

// prepare request body for sentiments
function submitUserResponse(stories) {
  if (selectedIndex !== -1) {
    var selectedStory = stories[selectedIndex];
    var otherIndex = selectedIndex === 0 ? 1 : 0; // Index of the other story
    var otherStory = stories[otherIndex];

    console.log("Selected story:", selectedStory);
    console.log("Other story:", otherStory);

    var requestBody = {
      prompt: document.getElementById("textInput").value,
      selectedResponse: selectedStory.candidates[0].content.parts[0].text,
      selectedSentiment: true, // Sentiment for selected story
      otherResponse: otherStory.candidates[0].content.parts[0].text,
      otherSentiment: false, // Sentiment for other story
    };

    // Make a POST request to the backend with the request body

    fetch("/submit_user_response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        console.log("response:", response);
        if (response.ok === true) {
          document.getElementById("output").style.display = "none";
          // Show the success message
          document.getElementById("successMessage").style.display = "block";
          console.log("User response submitted successfully.");
        } else {
          console.error("Failed to submit user response.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    console.log("requestBody for sentiment analysis:", requestBody);
  } else {
    console.error("No story selected.");
  }
}

function handleImageUpload(event) {
  var imageInput = event.target;
  var imagePreview = document.getElementById("imagePreview");
  var file = imageInput.files[0];

  if (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var maxWidth = 400;
        var maxHeight = 400;
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
        var resizedImage = canvas.toDataURL("image/jpeg");

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

function streamMarkdownOutput(content, outputDiv) {
  const contentArray = content.split("\n");
  let i = 0;
  const interval = setInterval(() => {
    if (i < contentArray.length) {
      const line = contentArray[i];
      outputDiv.innerHTML += marked(line) + ""; // Append Markdown content with line break
      i++;
    } else {
      clearInterval(interval); // Stop streaming when all lines are appended
    }
  }, 300); // Adjust streaming speed as needed
}

function getImageAndTextPrompt() {
  const bulletPointsHtml = `
<ul>
  <li>Launch now (bounding box: 335, 126, 524, 141)</li>
  <li>Build something people want (bounding box: 335, 165, 570, 180)</li>
  <li>Do things that don't scale (bounding box: 196, 224, 391, 239)</li>
  <li>Find the 90 / 10 solution (bounding box: 335, 267, 539, 282)</li>
  <li>Find 10-100 customers who love your product (bounding box: 335, 306, 606, 321)</li>
  <li>All startups are badly broken at some point (bounding box: 196, 345, 518, 360)</li>
  <li>Write code - talk to users (bounding box: 196, 384, 425, 400)</li>
  <li>"It's not your money" (bounding box: 335, 442, 577, 457)</li>
  <li>Growth is the result of a great product not the precursor (bounding box: 196, 481, 674, 496)</li>
  <li>Don't scale your team/product until you have built something people want (bounding box: 196, 519, 729, 534)</li>
  <li>Valuation is not equal to success or even probability of success (bounding box: 196, 557, 751, 572)</li>
  <li>Avoid long negotiated deals with big customers if you can (bounding box: 196, 596, 751, 611)</li>
  <li>Avoid big company corporate development queries - they will only waste time (bounding box: 196, 634, 788, 650)</li>
  <li>Avoid conferences unless they are the best way to get customers (bounding box: 196, 673, 730, 688)</li>
  <li>Pre-product market fit - do things that don't scale: remain small/nimble (bounding box: 196, 716, 842, 731)</li>
  <li>Startups can only solve one problem well at any given time (bounding box: 335, 774, 662, 789)</li>
  <li>Founder relationships matter more than you think (bounding box: 335, 818, 662, 833)</li>
  <li>Sometimes you need to fire your customers (they might be killing you) (bounding box: 335, 861, 737, 876)</li>
  <li>Ignore your competitors, you will more likely die of suicide than murder (bounding box: 196, 914, 763, 930)</li>
  <li>Most companies don't die because they run out of money (bounding box: 335, 958, 685, 973)</li>
  <li>Be nice! Or at least don't be a jerk (bounding box: 196, 1001, 481, 1016)</li>
  <li>Get sleep and exercise - take care of yourself (bounding box: 335, 1045, 623, 1060)</li>
</ul>
`;

  const pocketGuideMarkdown = `
# The Pocket Guide of Essential YC Advice

- Launch now
- Build something people want
- Do things that don't scale
- Find the 90 / 10 solution
- Find 10-100 customers who love your product
- All startups are badly broken at some point
- Write code - talk to users
- "It's not your money"
- Growth is the result of a great product not the precursor
- Don't scale your team/product until you have built something people want
- Valuation is not equal to success or even probability of success
- Avoid long negotiated deals with big customers if you can
- Avoid big company corporate development queries - they will only waste time
- Avoid conferences unless they are the best way to get customers
- Pre-product market fit - do things that don't scale: remain small/nimble
- Startups can only solve one problem well at any given time
- Founder relationships matter more than you think
- Sometimes you need to fire your customers (they might be killing you)
- Ignore your competitors, you will more likely die of suicide than murder
- Most companies don't die because they run out of money
- Be nice! Or at least don't be a jerk
- Get sleep and exercise - take care of yourself
`;

  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear previous content
  const imagePreview = document.getElementById("imagePreview");
  const imageInput = document.getElementById("imageInput");

  // Create image element
  if (imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const image = document.createElement("img");
      image.src = e.target.result;
      image.alt = "Uploaded Image";
      imagePreview.innerHTML = "";
      imagePreview.appendChild(image);
    };
    reader.readAsDataURL(file);
  }

  // Stream Markdown content
  streamMarkdownOutput(bulletPointsHtml, outputDiv);
}

function dragOverHandler(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function updateTemperature() {
  var slider = document.getElementById("temperatureSlider");
  temperatureValue = slider.value;
}

function updateTokenLimit() {
  var slider = document.getElementById("tokenLimitSlider");
  tokenLimitValue = slider.value;
}

function dropHandler(event) {
  event.preventDefault();
  var files = event.dataTransfer.files;
  var imageInput = document.getElementById("imageInput");
  imageInput.files = files;
  handleImageUpload(event);
}

function updateTemperature() {
  var slider = document.getElementById("temperatureSlider");
  var value = slider.value;
  document.getElementById("temperatureValue").innerText = value;
}

function updateTokenLimit() {
  var slider = document.getElementById("tokenLimitSlider");
  var value = slider.value;
  document.getElementById("tokenLimitValue").innerText = value;
}

// Function to get coordinates on hover
function getCoordinates(event) {
  var image = event.target;
  var rect = image.getBoundingClientRect(); // Get the position of the image relative to the viewport
  var x = event.clientX - rect.left; // Calculate the x-coordinate relative to the image
  var y = event.clientY - rect.top; // Calculate the y-coordinate relative to the image

  // Display the coordinates
  var coordinatesDisplay = document.getElementById("coordinatesDisplay");
  coordinatesDisplay.style.display = "block";
  coordinatesDisplay.style.left = event.clientX + "px";
  coordinatesDisplay.style.top = event.clientY + "px";
  coordinatesDisplay.textContent = "(" + x + ", " + y + ")";
}

// Add event listener to the image for mousemove event
var imagePreview = document.getElementById("imagePreview");
imagePreview.addEventListener("mousemove", getCoordinates);

// Hide coordinates display when mouse leaves the image
imagePreview.addEventListener("mouseleave", function () {
  var coordinatesDisplay = document.getElementById("coordinatesDisplay");
  coordinatesDisplay.style.display = "none";
});
