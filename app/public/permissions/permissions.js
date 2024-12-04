let urlParams = new URLSearchParams(window.location.search);
let serverCode = urlParams.get('serverCode');
let serverName = urlParams.get('serverName');
let username = null;
let token = null;
let permission = null;
let serverCodeField = document.getElementById("server-code-div");
let usernameField = document.getElementById("username-div");
let permissionField = document.getElementById("permission-div");
let searchServerCodeField = document.getElementById("search-server-code-div");
let searchUsernameField = document.getElementById("search-username-input");
let searchPermissionField = document.getElementById("search-permission-div");
let bannerUsername = document.getElementById("banner-username");
let bannerPermission = document.getElementById("banner-permission");

let searchMessageDiv = document.getElementById("search-message-div");
let modifyMessageDiv = document.getElementById("modify-message-div");

document.addEventListener("DOMContentLoaded", async () => {
    username = getCookie("username");
    token = getCookie("token");

    document.getElementById("back-btn").addEventListener("click", goBack);
    document.getElementById("search-btn").addEventListener("click", searchPermissionAndUpdateField);
    document.getElementById("modify-btn").addEventListener("click", modifyPermission);

    serverCodeField.textContent = `SERVER CODE: ${serverCode}`;
    searchServerCodeField.textContent = `SERVER CODE: ${serverCode}`;
    searchPermissionField.textContent = "Current Permission Level: ";

    fetch(`http://localhost:3000/get-permission?username=${username}&serverCode=${serverCode}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        permission = body["permission"];
        bannerUsername.textContent = `Username: ${username}`;
        bannerPermission.textContent = `Permission Level: ${permission}`;
    }).catch(error => {
        console.log(error);
    });
});

function goBack() {
    window.location.href = `http://localhost:3000/home/server?serverCode=${serverCode}&serverName=${serverName}`;
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function searchPermissionAndUpdateField() {
    let target = searchUsernameField.value;

    fetch(`http://localhost:3000/get-permission?username=${target}&serverCode=${serverCode}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        if (body["permission"] !== undefined) {
            searchPermissionField.textContent = `Current Permission Level: ${body["permission"]}`;
            showMessage("User permission successfully found", "success", searchMessageDiv);
        } else {
            showMessage("User permission not found", "error", searchMessageDiv);
        }
    }).catch(error => {
        console.log(error);
        showMessage(error.message, "error", searchMessageDiv);
    });
}

function modifyPermission() {
    let target = document.getElementById("modify-username-input").value;
    let permissionLevel = document.getElementById("modify-permissionsLevel-input").value;

    fetch(`http://localhost:3000/modify-permission`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
            "username": target,
            "permission": permissionLevel,
            "code": serverCode
        })
    }).then(response => {
        if (response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json().then(body => ({
                status: response.status,
                message: body["message"]
            }));
        }
    }).then(({ status, message }) => {
        if (status === 200) {
            showMessage(message, "success", modifyMessageDiv);
        } else {
            console.log(message);
            showMessage(message, "error", modifyMessageDiv);
        }
    }).catch(error => {
        console.log(error);
        showMessage(error.message, "error", modifyMessageDiv);
    });
}

function showMessage(message, type, messageContainer) {
    messageContainer.textContent = message;
    messageContainer.style.display = "block";
    messageContainer.className = "message-container " + type;

    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 5000);
}