// automatic input feild

var otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach(function (input, index, array) {
    input.addEventListener('input', function () {
        moveToNextField(this, array[index + 1]);
    });
});

function moveToNextField(currentField, nextField) {
    var maxLength = parseInt(currentField.getAttribute('maxlength'));
    var currentLength = currentField.value.length;

    // Allow only numeric characters
    var numericInput = currentField.value.replace(/[^0-9]/g, '');

    if (currentField.value !== numericInput) {
        currentField.value = numericInput;
    }

    if (currentLength === maxLength && nextField) {
        // Move focus to the next input field
        nextField.focus();
    }
}

// otp timer
// Add these variables at the beginning of your JavaScript code
let otpTimerValue = 10; // Set the timer value in seconds
let otpTimerInterval;

// Function to start the timer
const startOTPTimer = () => {
  otpTimerInterval = setInterval(() => {
    otpTimerValue--;
    if (otpTimerValue >= 0) {
      // Update the timer display
      document.getElementById('otpTimer').innerText = `Resend in ${otpTimerValue} seconds`;
    } else {
      // Enable the resend button when the timer finishes
      document.getElementById('resendButton').disabled = false;
      clearInterval(otpTimerInterval);
    }
  }, 1000);
};

// Call this function when the page loads or when you send the OTP
startOTPTimer();

// Modify your HTML form to include an ID for the resend button


  // Function to handle the resend button click
  const resendOTP = () => {
    // Disable the resend button again
    document.getElementById('resendButton').disabled = true;

    // Reset the timer value and start the timer again
    otpTimerValue = 10;
    startOTPTimer();

    // Add your logic to resend the OTP here
    // Call your sendOTPVerificationEmail function or perform the necessary actions
  };

