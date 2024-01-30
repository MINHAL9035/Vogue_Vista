function validateForm() {
    document.getElementById('email-error').innerText = '';
    document.getElementById('password-error').innerText = '';

    let email = document.getElementById('email').value.trim();
    let password = document.getElementById('password').value;

    // Validate email
    if (email === '') {
        document.getElementById('email-error').innerText = 'Please enter an email address.';
        return false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('email-error').innerText = 'Please enter a valid email address.';
        return false;
    }

    // Validate password
    if (password === '') {
        document.getElementById('password-error').innerText = 'Please enter a password.';
        return false;
    } else if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
        document.getElementById('password-error').innerText = 'Password should be at least 8 characters, with at least one uppercase letter and one special character.';
        return false;
    }
    return true;
}
