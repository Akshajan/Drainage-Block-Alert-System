// You can add interactive features here if needed
// For example, a button to toggle the abstract section visibility
document.addEventListener("DOMContentLoaded", function () {
    const abstractSection = document.querySelector(".abstract-section");
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Toggle Abstract";
    toggleButton.style.marginBottom = "20px";
    toggleButton.style.padding = "10px";
    toggleButton.style.backgroundColor = "#000000";
    toggleButton.style.color = "#ffffff";
    toggleButton.style.border = "none";
    toggleButton.style.cursor = "pointer";
  
    document.querySelector("main").prepend(toggleButton);
  
    toggleButton.addEventListener("click", function () {
      if (abstractSection.style.display === "none") {
        abstractSection.style.display = "block";
      } else {
        abstractSection.style.display = "none";
      }
    });
  });