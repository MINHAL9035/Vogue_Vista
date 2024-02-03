<script>
document.addEventListener("DOMContentLoaded", function () {
  const expire = new Date(parseInt(document.getElementById("expirationTimestamp").value));
  const otpTimer = document.getElementById('otpTimer');
  let timerInterval;

  function updateTimer() {
    const now = new Date().getTime();
    const timeRemaining = expire.getTime() - now;
    const validateButton = document.getElementById("validateButton");
    const resendButton = document.getElementById("resendButton");

    if (timeRemaining <= 0) {
      otpTimer.innerHTML = "OTP expired";
      validateButton.style.display = "none";
      resendButton.style.display = "block";
      clearInterval(timerInterval);
    } else {
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      otpTimer.innerHTML = ` ${minutes}m ${seconds}s`;
    }
  }

  updateTimer();

  timerInterval = setInterval(updateTimer, 1000);

  window.resendOTP = function () {
    const validateButton = document.getElementById("validateButton");
    const resendButton = document.getElementById("resendButton");

    clearInterval(timerInterval);
    updateTimer();
    resendButton.style.display = "none";
    validateButton.style.display = "block";
    timerInterval = setInterval(updateTimer, 1000);
  }
});
</script>
