let username = document.getElementById("username");
let password = document.getElementById("password");
let login = document.getElementById("login");
let messageContainer = document.getElementById("message");
let form = document.getElementById("login-form");

form.addEventListener("submit", (event) => {
    let userVal = username.value;
    let passVal = password.value;

    event.preventDefault();
    messageContainer.textContent = "";
    fetch('http://localhost:3000/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({username: userVal, password: passVal}),
    }).then(response => {
        response.json().then((body) => {
            if (response.ok) {
                messageContainer.style.color = "green";
                messageContainer.textContent = "Logged in!";
                //localStorage.setItem('currentUser', JSON.stringify({ username: userVal, token: body.token }));
                window.location.href = '/home';
            } else if (response.status === 400) {
                messageContainer.style.color = "red";
                messageContainer.textContent = body.message;
            } else {
                messageContainer.style.color = "red";
                messageContainer.textContent = body.error;
            }
        })
    });
});