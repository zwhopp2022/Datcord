let username = document.getElementById("username");
let password = document.getElementById("password");
let birthday = document.getElementById("birthday");
let confirmPassword = document.getElementById("confirm-password");
let register = document.getElementById("register");
let messageContainer = document.getElementById("message");
let form = document.getElementById("register-form");

function showMessage(message, type) {
    const messageContainer = document.getElementById("message");
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
}

form.addEventListener("submit", (event) => {
    let userVal = username.value;
    let passVal = password.value;
    let confirmPassVal = confirmPassword.value;
    let birthdayVal = birthday.value;

    event.preventDefault();

    if (passVal !== confirmPassVal) {
        showMessage("Passwords do not match!", "error");
    } else {
        messageContainer.textContent = "";
        fetch('http://localhost:3000/add-user', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: userVal, password: passVal, bio: "", status: "", date: birthdayVal}),
        }).then(response => {
            response.json().then((body) => {
                if (response.ok) {
                    showMessage("Account successfully created!", "success");
                } else if (response.status === 400) {
                    showMessage(body.message || body.error, "error");
                } else {
                    showMessage(body.error, "error");
                }
            })
        });
    }
});