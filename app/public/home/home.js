let currentUser = getCookie("username");

document.addEventListener("DOMContentLoaded", async () => {
    let currentUser = {};
    currentUser.username = getCookie("username");
    currentUser.token = getCookie("token");
    if (currentUser) {
        document.getElementById("left-panel-header").textContent = `${currentUser.username}'s Chats`;
        // await fetchUserChats(currentUser.username, currentUser.token);
    } else {
        console.log("No user is logged in");
    }
});

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