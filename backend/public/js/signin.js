document.getElementById('signin-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting the default way

    const formData = {
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        pass: document.getElementById('pass').value
    };

    axios.post('http://localhost:3000/login', formData)
        .then(response => {
            alert(response.data.message); // Show success message
            window.location.href = 'index.html'; // Redirect to dashboard
        })
        .catch(error => {
            console.error('Error during login:', error);
            alert('Invalid credentials. Please try again.');
        });
});