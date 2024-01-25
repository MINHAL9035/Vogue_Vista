function validateForm() {
    // Reset error messages
    document.getElementById('username-error').innerText = '';
    document.getElementById('email-error').innerText = '';
    document.getElementById('mno-error').innerText = '';
    document.getElementById('password-error').innerText = '';
    document.getElementById('confirmPassword-error').innerText = '';

    // Get form values
    let username = document.getElementById('username').value.trim();
    let email = document.getElementById('email').value.trim();
    let mobileNumber = document.getElementById('mno').value.trim();
    let password = document.getElementById('password').value;
    let confirmPassword = document.getElementById('confirmPassword').value;

    // Validate username
    if (username === '') {
        document.getElementById('username-error').innerText = 'Please enter a username.';
        return false;
    } else if (!/^[A-Za-z]+$/.test(username)) {
        document.getElementById('username-error').innerText = 'Username should only contain letters.';
        return false;
    }

    // Validate email
    if (email === '') {
        document.getElementById('email-error').innerText = 'Please enter an email address.';
        return false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById('email-error').innerText = 'Please enter a valid email address.';
        return false;
    }

    // Validate mobile number
    if (mobileNumber === '' || !/^\d{10}$/.test(mobileNumber) || /^0+$/.test(mobileNumber) || parseInt(mobileNumber) < 0) {
        document.getElementById('mno-error').innerText = 'Please enter a valid 10-digit mobile number.';
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

    // Validate confirm password
    if (confirmPassword !== password) {
        document.getElementById('confirmPassword-error').innerText = 'Passwords do not match.';
        return false;
    }

    return true;
}

