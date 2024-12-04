let urlParams = new URLSearchParams(window.location.search);
let serverCode = urlParams.get('serverCode');
let serverName = urlParams.get('serverName');
let serverNameBanner = document.getElementById("banner-title");

document.addEventListener("DOMContentLoaded", async () => {
    console.log(serverName);
    renderServerBanner();


});

function renderServerBanner() {
    serverNameBanner.textContent = serverName;
}