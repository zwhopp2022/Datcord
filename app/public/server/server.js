let urlParams = new URLSearchParams(window.location.search);
let username = getCookie("username");
let token = getCookie("token");
let serverCode = urlParams.get('serverCode');
let serverName = urlParams.get('serverName');
let serverNameBanner = document.getElementById("banner-title");
let serverBanner = document.getElementById("server-banner");
let channelsContainer = document.getElementById("channels");
let newChannelContainer = document.getElementById("new-channel");
let permissionsButton;
let currentUserPermission;

document.addEventListener("DOMContentLoaded", async () => {
    renderServerBanner();
    
    // Get user's permission level and setup UI accordingly
    fetch(`https://datcord.fly.dev/get-permission?username=${username}&serverCode=${serverCode}`, {
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
        currentUserPermission = body["permission"];
        if (currentUserPermission >= 4) {
            // Add permissions button
            permissionsButton = document.createElement("button");
            permissionsButton.id = "permissions-btn";
            permissionsButton.classList.add("banner-btn"); 
            permissionsButton.textContent = "Permissions";

            permissionsButton.addEventListener("click", () => {
                window.location.href = `https://datcord.fly.dev/permissions?serverCode=${serverCode}&serverName=${serverName}`;
            });

            serverBanner.appendChild(permissionsButton);

            // Add new channel button
            clearDivAndMakeNewChannelButton();
        }

        // Load channels
        loadChannels();
    }).catch(error => {
        console.log(error);
        showMessage(error.message, "error");
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

function clearDivAndMakeNewChannelButton() {
    while (newChannelContainer.firstChild) {
        newChannelContainer.removeChild(newChannelContainer.firstChild);
    }

    let newChannelButton = document.createElement("button");
    newChannelButton.id = "new-channel-btn";
    newChannelButton.classList.add("chat-btn");
    newChannelButton.textContent = "New Channel";
    newChannelButton.addEventListener("click", promptNewChannel);

    newChannelContainer.appendChild(newChannelButton);
}

function promptNewChannel() {
    while (newChannelContainer.firstChild) {
        newChannelContainer.removeChild(newChannelContainer.firstChild);
    }

    let nameInput = document.createElement("input");
    let permissionInput = document.createElement("input");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");
    let messageContainer = document.createElement("div");

    nameInput.classList.add("channel-input");
    permissionInput.classList.add("channel-input");
    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    nameInput.id = "channel-name-input";
    permissionInput.id = "channel-permission-input";
    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    messageContainer.id = "message-container";

    nameInput.placeholder = "Enter channel name";
    permissionInput.placeholder = "Permission level (1-5)";
    permissionInput.type = "number";
    permissionInput.min = "1";
    permissionInput.max = "5";
    permissionInput.value = "1"; // Set default value

    cancelButton.textContent = "Cancel";
    createButton.textContent = "Create";

    cancelButton.addEventListener("click", () => clearDivAndMakeNewChannelButton());
    createButton.addEventListener("click", () => {
        let channelName = nameInput.value.trim();
        let permissionLevel = parseInt(permissionInput.value);

        if (channelName && permissionLevel >= 1 && permissionLevel <= 5) {
            createNewChannel(channelName, permissionLevel);
        } else {
            showMessage("Please provide a valid channel name and permission level (1-5)", "error");
        }
    });

    newChannelContainer.appendChild(nameInput);
    newChannelContainer.appendChild(permissionInput);
    newChannelContainer.appendChild(cancelButton);
    newChannelContainer.appendChild(createButton);
    newChannelContainer.appendChild(messageContainer);
}

function createNewChannel(channelName, permissionLevel) {
    fetch("https://datcord.fly.dev/create-channel", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
            channelName,
            serverCode,
            permissionLevel
        })
    }).then(response => response.json())
    .then(data => {
        if (data.roomId) {
            showMessage(`Created new channel: ${channelName}`, "success");
            clearDivAndMakeNewChannelButton();
            loadChannels();
        } else {
            showMessage(data.message || "Failed to create channel", "error");
        }
    }).catch(error => {
        showMessage(error.message, "error");
    });
}

function loadChannels() {
    while (channelsContainer.firstChild) {
        channelsContainer.removeChild(channelsContainer.firstChild);
    }

    fetch(`https://datcord.fly.dev/get-channels?serverCode=${serverCode}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    }).then(response => response.json())
    .then(data => {
        if (data.channels && Array.isArray(data.channels)) {
            data.channels.forEach(channel => {
                let channelDiv = document.createElement("div");
                channelDiv.classList.add("channel-item");

                // Add delete button first for users with permission level 4 or 5
                if (currentUserPermission >= 4) {
                    let deleteButton = document.createElement("button");
                    deleteButton.classList.add("delete-btn");
                    deleteButton.textContent = "×";
                    deleteButton.addEventListener("click", (e) => {
                        e.stopPropagation();
                        deleteChannel(channel.roomid);
                    });
                    channelDiv.appendChild(deleteButton);
                }

                // Then add channel name
                let channelName = document.createElement("span");
                channelName.textContent = `${channel.name} (Level ${channel.permissionlevel})`;
                channelName.classList.add("channel-name");
                channelDiv.appendChild(channelName);

                channelDiv.addEventListener("click", () => {
                    let iframe = document.getElementById("current-channel");
                    iframe.src = `/home/chat?roomId=${channel.roomid}`;
                });

                channelsContainer.appendChild(channelDiv);
            });
        }
    }).catch(error => {
        showMessage(error.message, "error");
    });
}

function deleteChannel(roomId) {
    if (confirm("Are you sure you want to delete this channel?")) {
        fetch("https://datcord.fly.dev/delete-channel", {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                roomId,
                serverCode
            })
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage("Channel deleted successfully", "success");
                loadChannels();
            } else {
                showMessage(data.message || "Failed to delete channel", "error");
            }
        }).catch(error => {
            showMessage(error.message, "error");
        });
    }
}

function showMessage(message, type) {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.style.display = "block";
        messageContainer.className = "message-container " + type;

        setTimeout(() => {
            messageContainer.style.display = "none";
        }, 5000);
    }
}
