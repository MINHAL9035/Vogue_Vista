// ==============increase quantity=================
function increaseQuantity(cartId, productId, count) {
    $.ajax({
        url: "/changeQuantity",
        method: "post",
        data: {
            cartId: cartId,
            productId: productId,
            count: count,
        },
        success: (response) => {
            if (response.success) {
                $("#reloadDiv").load("/cart #reloadDiv");
            } else {
                Swal.fire({
                    title: "Error",
                    icon: "error",
                    text: response.message,
                    timer: 3000,
                });
            }
        },
        error: (error) => [
            Swal.fire({
                title: "Error",
                icon: "error",
                text: error.message,
                timer: 2000,
            }),
        ],
    });
}


// ===================delete item==================================
function deleteCartItem(productId, event) {
    event.preventDefault();
    console.log("Delete button clicked with productId:", productId);
    Swal.fire({
        title: "Are you sure?",
        text: "You want to delete!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dbcc8f",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, remove!",
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: "/deleteCartProduct",
                data: {
                    productOgId: productId,
                },
                method: "post",
                success: (response) => {
                    console.log("AJAX request successful:", response);
                    if (response.success === true) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Your item has been deleted.",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: "Failed to delete item.",
                            icon: "error",
                            showConfirmButton: false,
                        });
                    }
                },
                error: (error) => {
                    console.log("AJAX request failed:", error);
                    console.log(error);
                    Swal.fire({
                        title: "Error!",
                        text: "An error occurred while deleting the item.",
                        icon: "error",
                        showConfirmButton: false,
                    });
                },
            });
        }
    });
}
