let username = document.getElementById("username");
let password = document.getElementById("password");
let confirmPassword = document.getElementById("confirm-password");
let register = document.getElementById("register");
let errorContainer = document.getElementById("error");


register.addEventListener("click", () => {
    let userVal = username.value;
    let passVal = password.value;
    let confirmPassVal = confirmPassword.value;

    if (passVal !== confirmPassVal) {
        errorContainer.textContent = "Passwords do not match!";
    } else {
        errorContainer.textContent = "";
        fetch('/register', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: userVal, password: passVal}),
        }).then(response => {
            if (response.ok) {
                console.log("good");
            } else {
                console.log("bad");
            }
        });
    }
});