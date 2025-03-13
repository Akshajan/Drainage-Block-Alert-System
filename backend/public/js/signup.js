document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting the default way

    const formData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        pass: document.getElementById('pass').value
    };

    axios.post('http://localhost:3000/signup', formData)
        .then(response => {
            alert(response.data.message); // Show success message
            window.location.href = 'login'; // Redirect to login page
        })
        .catch(error => {
            console.error('Error during signup:', error);
            alert('Error during signup. Please try again.');
        });
});