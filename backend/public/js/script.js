// Get the sidebar, toggle button, and close button
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-btn");
const closeBtn = document.getElementById("close-btn");
const mainContent = document.querySelector(".main-content");

// Toggle the sidebar when the hamburger menu is clicked
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  mainContent.classList.toggle("open");
  toggleBtn.classList.toggle("open");
});

// Close the sidebar when the close button is clicked
closeBtn.addEventListener("click", () => {
  sidebar.classList.remove("open");
  mainContent.classList.remove("open");
  toggleBtn.classList.remove("open");
}); 

// right profile 
const right_bar = document.getElementById("rightbar");
const profile_icon = document.getElementById("profile_icon");
const  right_content = document.getElementById("right-content");
const bd = document.getElementById("bodydiv");

right_bar.style.display = "none";

function myfunction(){

  if (right_bar.style.display === "block") {
    right_bar.style.display = "none";
  } else {
    right_bar.style.display = "block";
  }
}



profile_icon.addEventListener('click',myfunction,true);



