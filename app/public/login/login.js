let username = document.getElementById("username");
let password = document.getElementById("password");
let login = document.getElementById("login");
let messageContainer = document.getElementById("message");
let form = document.getElementById("login-form");

form.addEventListener("submit", (event) => {
    let userVal = username.value;
    let passVal = password.value;

    event.preventDefault();

    if (passVal !== confirmPassVal) {
        messageContainer.style.color = "red";
        messageContainer.textContent = "Passwords do not match!";
    } else {
        messageContainer.textContent = "";
        fetch('http://localhost:3000/login', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: userVal, password: passVal}),
        }).then(response => {
            response.json().then((body) => {
                if (response.ok) {
                    messageContainer.style.color = "green";
                    messageContainer.textContent = "Logged in!";
                } else if (response.status === 400) {
                    messageContainer.style.color = "red";
                    messageContainer.textContent = body.message;
                } else {
                    messageContainer.style.color = "red";
                    messageContainer.textContent = body.error;
                }
            })
        });
    }
});