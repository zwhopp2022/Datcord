let username = document.getElementById("username");
let password = document.getElementById("password");
let birthday = document.getElementById("birthday");
let confirmPassword = document.getElementById("confirm-password");
let register = document.getElementById("register");
let messageContainer = document.getElementById("message");
let form = document.getElementById("register-form");

form.addEventListener("submit", (event) => {
    let userVal = username.value;
    let passVal = password.value;
    let confirmPassVal = confirmPassword.value;
    let birthdayVal = birthday.value;

    event.preventDefault();

    if (passVal !== confirmPassVal) {
        messageContainer.style.color = "red";
        messageContainer.textContent = "Passwords do not match!";
    } else {
        messageContainer.textContent = "";
        fetch('/add-user', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: userVal, password: passVal, bio: "", status: "", date: birthdayVal}),
        }).then(response => {
            response.json().then((body) => {
                if (response.ok) {
                    messageContainer.style.color = "green";
                    messageContainer.textContent = "Account successfully created!";
                } else if (response.status === 400) {
                    console.log("bad");
                    console.log(body);
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