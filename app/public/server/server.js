let urlParams = new URLSearchParams(window.location.search);
let serverCode = urlParams.get('serverCode');
let serverName = urlParams.get('serverName');
let serverNameBanner = document.getElementById("banner-title");
let permissionsButton = document.getElementById("permissions-btn");

document.addEventListener("DOMContentLoaded", async () => {
    console.log(serverName);
    renderServerBanner();
});

permissionsButton.addEventListener("click", () => {
    window.location.href = `http://localhost:3001/permissions?serverCode=${serverCode}&serverName=${serverName}`;
});

function renderServerBanner() {
    serverNameBanner.textContent = serverName;
}

