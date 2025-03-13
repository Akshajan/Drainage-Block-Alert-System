document.getElementById('signin-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const email = document.getElementById('email').value;
    const password = document.getElementById('Password').value;

    fetch('/administrator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message === 'Admin sign-in successful') {
                alert('Admin sign-in successful');
                window.location.href = '/index'; // Redirect to admin dashboard
            } else {
                alert(data.message); // Show error message
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
});