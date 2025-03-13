// document.getElementById("report-form").addEventListener("submit", function(event) {
//     event.preventDefault();

//     const name = document.getElementById("name").value;
//     const mobile = document.getElementById("mobile").value;
//     const email = document.getElementById("email").value;
//     const address = document.getElementById("address").value;
//     const blockDetails = document.getElementById("block-details").value;
//     const photo = document.getElementById("photo").files[0];

//     if (!name || !mobile || !email || !address || !blockDetails) {
//         alert("Please fill in all required fields!");
//         return;
//     }

//     const reportData = {
//         name,
//         mobile,
//         email,
//         address,
//         blockDetails,
//         photo: photo ? photo.name : "No photo uploaded"
//     };

//     console.log("Report submitted:", reportData);
//     alert("Your report has been submitted successfully!");
//     document.getElementById("report-form").reset();
// });

// document.getElementById('report-form').addEventListener('submit', function (e) {
//     e.preventDefault(); // Prevent the form from submitting the default way

//     // Get form values
//     const name = document.getElementById('name').value;
//     const mobile = document.getElementById('mobile').value;
//     const email = document.getElementById('email').value;
//     const address = document.getElementById('address').value;
//     const blockDetails = document.getElementById('block-details').value;
//     const photo = document.getElementById('photo').files[0];

//     // Validation
//     if (!name || !mobile || !email || !address || !blockDetails) {
//         alert('Please fill in all required fields!');
//         return;
//     }

//     // Create FormData object
//     const formData = new FormData();
//     formData.append('name', name);
//     formData.append('mobile', mobile);
//     formData.append('email', email);
//     formData.append('address', address);
//     formData.append('blockDetails', blockDetails); // Ensure this matches the backend field name
//     if (photo) {
//         formData.append('photo', photo);
//     }

//     // Send data to the backend using Axios
//     axios.post('http://localhost:3000/report', formData, {
//         headers: {
//             'Content-Type': 'multipart/form-data' // Required for file uploads
//         }
//     })
//     .then(response => {
//         alert(response.data.message); // Show success message
//         window.location.href = 'index.html'; // Redirect to home page
//     })
//     .catch(error => {
//         console.error('Error submitting report:', error);
//         alert('Error submitting report. Please try again.');
//     });

//     // Reset the form
//     document.getElementById('report-form').reset();
// });

document.getElementById('report-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting the default way

    // Get form values
    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const blockDetails = document.getElementById('block-details').value;
    const photo = document.getElementById('photo').files[0];

    // Validation
    if (!name || !mobile || !email || !address || !blockDetails) {
        alert('Please fill in all required fields!');
        return;
    }

    // Create FormData object
    const formData = new FormData();
    formData.append('name', name);
    formData.append('mobile', mobile);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('block-details', blockDetails); // Match the HTML field name
    if (photo) {
        formData.append('photo', photo);
    }

    // Send data to the backend using Axios
    axios.post('http://localhost:3000/report', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' // Required for file uploads
        }
    })
    .then(response => {
        alert(response.data.message); // Show success message
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000); // Redirect to home page
    })
    .catch(error => {
        console.error('Error submitting report:', error);
        alert('Error submitting report. Please try again.');
    });

    // Reset the form
    document.getElementById('report-form').reset();
});