let urlParams = new URLSearchParams(window.location.search);
let username = getCookie("username");
let token = getCookie("token");
let serverCode = urlParams.get('serverCode');
let serverName = urlParams.get('serverName');
let serverNameBanner = document.getElementById("banner-title");
let serverBammer = document.getElementById("server-banner");
let permissionsButton;

document.addEventListener("DOMContentLoaded", async () => {
    renderServerBanner();
    
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
        if (body["permission"] >= 4) {
            permissionsButton = document.createElement("button");
            permissionsButton.id = "permissions-btn";
            permissionsButton.classList.add("banner-btn"); 
            permissionsButton.textContent = "Permissions";

            permissionsButton.addEventListener("click", () => {
                window.location.href = `http://localhost:3001/permissions?serverCode=${serverCode}&serverName=${serverName}`;
            });

            serverBammer.appendChild(permissionsButton);
        }
    }).catch(error => {
        console.log(error);
        showMessage(error.message, "error", searchMessageDiv);
    });
});

function renderServerBanner() {
    serverNameBanner.textContent = serverName;
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
