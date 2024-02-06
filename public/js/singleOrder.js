// =================cancel and return=======================
function cancelOrder(orderId, itemId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Please provide a reason for the cancellation:",
        input: "text",
        showCancelButton: true,
        confirmButtonText: "Cancel Order",
        cancelButtonText: "Close",
        preConfirm: (reason) => {
            if (!reason) {
                Swal.showValidationMessage(
                    "Please type a reason for cancellation"
                );
                return false; // Prevents the modal from closing
            }

            return fetch("/cancel-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId.trim(),
                    itemId,
                    reason: reason,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to cancel order");
                    }
                })
                .catch((error) => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
        },
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "Order Cancellation requested!",
                icon: "success",
                showCancelButton: false,
                confirmButtonText: "OK",
            }).then(() => {
                // Redirect to /orders after clicking OK on the success message
                window.location.href = "/single-order?orderId=<%= order._id %>";
            });
        }
    });
}

function returnOrder(orderId, itemId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Please provide a reason for returning the item:",
        input: "text",
        showCancelButton: true,
        confirmButtonText: "Return Order",
        cancelButtonText: "Close",
        preConfirm: (returnReason) => {
            if (!returnReason) {
                Swal.showValidationMessage(
                    "Please type a reason for returning the item"
                );
                return false; // Prevents the modal from closing
            }

            return fetch("/cancel-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId.trim(),
                    itemId,
                    returnReason: returnReason,
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to process return request");
                    }
                })
                .catch((error) => {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                });
        },
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "Order return requested!",
                icon: "success",
                showCancelButton: false,
                confirmButtonText: "OK",
            }).then(() => {
                // Redirect to /orders after clicking OK on the success message
                window.location.href = "/single-order?orderId=<%= order._id %>";
            });
        }
    });
}
