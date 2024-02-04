// ==========================ADDRESS MODAL===============================
$(document).ready(function () {
    $("#addressForm").submit(function (event) {
        event.preventDefault();

        // Serialize form data
        const formData = $(this).serialize();

        // AJAX to send form data to the server
        $.ajax({
            type: "POST",
            url: "/addAddress",
            data: formData,
            success: function (response) {
                $("#addAddressModal").modal("hide");
                window.location.reload()
            },
            error: function (error) {
                console.log(error);
            },
        });
    });
});


//   ===========================COUPON===================================
function applyCoupon(code) {
    console.log('Applying coupon with code:', code);

    const amountElement = document.getElementById('total');
    const amount = parseFloat(amountElement.innerText.replace('₹', '').trim());

    $.ajax({
        url: '/apply-coupon',
        data: {
            code: code,
            amount: amount
        },
        method: "post",
        success: (response) => {
            console.log("my resssy:", response);
            if (response.user) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops !!',
                    text: 'This coupon already used!'
                })
            } else if (response.maxAmount) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops !!',
                    text: 'You cant use the coupon...Buy more'
                })
            } else if (response.amountOkey) {
                document.getElementById('totalAmount').innerHTML = "₹" + response.disTotal;  // Update total
                document.getElementById('discount').innerHTML = "₹" + response.disAmount;
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Discount redeemed',

                    showConfirmButton: false,
                    timer: 1500
                })

            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops !!!',
                    text: 'Invalid Coupon!!!'
                })
            }

        }
    })

}

// =======================================PLACEORDER AND RAZORPAY=======================================
async function placeOrder() {
    const selectedAddress = document.querySelector('input[name="options"]:checked');
    const selectedPayment = document.querySelector('input[name="paymentOptions"]:checked');
    const couponCode = document.getElementById('code').value; // Get the coupon code

    if (!selectedAddress || !selectedPayment) {
        let errorMessage = "";

        if (!selectedAddress) {
            errorMessage = "Please select an address!";
        }

        if (!selectedPayment) {
            errorMessage = "Please select a payment method!";
        }

        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: errorMessage,
        });
    } else {
        // Prepare data for the AJAX request
        const orderData = {
            address: selectedAddress.value,
            paymentMethod: selectedPayment.value,
            couponCode: couponCode, // Include the coupon code in the order data
        };

        // Perform AJAX request using fetch
        fetch("/placeOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        })
            .then((response) => {
                console.log("hjhj:", response);
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Network response was not ok.");
            })
            .then((response) => {
                if (response.success === true) {
                    // Order placed successfully
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Your order has been placed successfully!",
                        timer: 2000,
                    }).then(() => {
                        const param = response.params;
                        window.location.href = "/orderPage/" + param; // Redirect to order page
                    });
                } else if (response.outOfStock) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cannot Add Product!',
                        text: 'Product Out of Stock',
                    });
                } else if (response.insufficientBalance) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cant place order!',
                        text: 'insufficient wallet amount',
                    });
                }
                else {
                    // Handle coupon-related logic or other actions if needed
                    razorpayPayment(response.order);
                    console.log("my frontend", response.order);
                }
            })
            .catch((error) => {
                // Handle network errors or exceptions
                console.error("Error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Something went wrong. Please try again!",
                });
            });
    }
}


function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_lJwtSofI3yzwdr", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Vogue Vista", //your business name
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        // "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
        "handler": function (response) {
            console.log("my razorpay function", response);
            verifyPayment(response, order)

            console.log("my razorpay order", order);
        },
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
            "name": name, //your customer's name
            "email": "VogueVista@example.com",
            "contact": "9000090000" //Provide the customer's phone number for better conversion rates 
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {
    console.log(payment);
    console.log(order);
    $.ajax({
        url: '/verify-payment',
        method: 'post',
        data: {
            payment,
            order
        },
        success: (response) => {
            if (response.success == true) {
                const param = response.params
                const url = '/orderPage' + param
                window.location.href = "/orderPage/" + param
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Payment has failed',
                    showConfirmButton: false,
                    timer: 1500
                })
            }
        }
    })
}






