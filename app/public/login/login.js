let username = document.getElementById("username");
let password = document.getElementById("password");
let login = document.getElementById("login");
let messageContainer = document.getElementById("message");
let form = document.getElementById("login-form");

function showMessage(message, type) {
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
}

form.addEventListener("submit", (event) => {
    let userVal = username.value;
    let passVal = password.value;

    event.preventDefault();
    messageContainer.textContent = "";
    fetch('https://datcord.fly.dev/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({username: userVal, password: passVal}),
    }).then(response => {
        response.json().then((body) => {
            if (response.ok) {
                showMessage("Logged in!", "success");
                window.location.href = '/home';
            } else if (response.status === 400) {
                showMessage(body.message || body.error, "error");
            } else {
                showMessage(body.error, "error");
            }
        })
    });
});