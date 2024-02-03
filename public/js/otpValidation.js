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



