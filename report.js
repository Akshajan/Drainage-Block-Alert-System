document.getElementById("report-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const mobile = document.getElementById("mobile").value;
    const email = document.getElementById("email").value;
    const address = document.getElementById("address").value;
    const blockDetails = document.getElementById("block-details").value;
    const photo = document.getElementById("photo").files[0];

    if (!name || !mobile || !email || !address || !blockDetails) {
        alert("Please fill in all required fields!");
        return;
    }

    const reportData = {
        name,
        mobile,
        email,
        address,
        blockDetails,
        photo: photo ? photo.name : "No photo uploaded"
    };

    console.log("Report submitted:", reportData);
    alert("Your report has been submitted successfully!");
    document.getElementById("report-form").reset();
});
