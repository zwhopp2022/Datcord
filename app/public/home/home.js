let currentUser = getCookie("username");
let token = getCookie("token");
let newChatContainer = document.getElementById("new-chat");
let chatSection = document.getElementById("chats");

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

document.addEventListener("DOMContentLoaded", async () => {
    let currentUser = {};
    currentUser.username = getCookie("username");
    currentUser.token = getCookie("token");
    if (currentUser) {
        document.getElementById("left-panel-header").textContent = `${currentUser.username}'s Chats`;
        renderChatsInPanel();
    } else {
        console.log("No user is logged in");
    }

    clearDivAndMakeNewChatButtons();

});

function createAndInsertChat(username, code) {
    let newChatBox = document.createElement("div");
    newChatBox.id = code;
    newChatBox.classList.add("chat-box");
    
    let removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.id = "remove-button";
    removeButton.classList.add("remove-button");
    removeButton.addEventListener("click", removeChat);

    let usernameButton = document.createElement("button");
    usernameButton.textContent = username;
    usernameButton.id = "username-button";
    usernameButton.classList.add("username-button");
    usernameButton.addEventListener("click", renderChatInMainContent);

    newChatBox.appendChild(removeButton);
    newChatBox.appendChild(usernameButton);
    
    chatSection.appendChild(newChatBox);
}



function extractUserName(row) {
    let usernames = [row.usernameone, row.usernametwo];
    for (let username of usernames) {
        if (username !== currentUser) {
            return username;
        }
    }
}


function renderChatsInPanel() {
    chatSection.innerHTML = ''; // Clear existing chat boxes first
    fetch(`http://localhost:3000/get-direct-messages?username=${currentUser}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    })
    .then(response => response.json())
    .then(body => {
        body.result.forEach(row => {
            createAndInsertChat(extractUserName(row), row["roomcode"]);
        });
    })
    .catch(error => console.log("Error fetching chats:", error));
}


function promptNewDirectMessageChat() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let messageContainer = document.createElement("div");
    let usernameInput = document.createElement("input");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");

    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    usernameInput.id = "username-input";
    messageContainer.id = "message-container";

    usernameInput.style.width = "100%";
    usernameInput.style.padding = "10px";
    usernameInput.style.borderRadius = "15px";
    usernameInput.style.marginBottom = "10px"; 
    usernameInput.style.border = "1px solid #ccc";

    cancelButton.style.marginRight = "2px";
    cancelButton.style.width = "48%";
    cancelButton.textContent = "Cancel";
    createButton.style.marginLeft = "2px"; 
    createButton.style.width = "48%";
    createButton.textContent = "Create";

    cancelButton.addEventListener("click", cancelNewChat);
    createButton.addEventListener("click", makeNewChat);

    newChatContainer.appendChild(usernameInput);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
}

function promptNewDirectMessageChat() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let messageContainer = document.createElement("div");
    let usernameInput = document.createElement("input");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");

    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    usernameInput.id = "username-input";
    messageContainer.id = "message-container";

    usernameInput.style.width = "100%";
    usernameInput.style.padding = "10px";
    usernameInput.style.borderRadius = "15px";
    usernameInput.style.marginBottom = "10px"; 
    usernameInput.style.border = "1px solid #ccc";

    cancelButton.style.marginRight = "2px";
    cancelButton.style.width = "48%";
    cancelButton.textContent = "Cancel";
    createButton.style.marginLeft = "2px"; 
    createButton.style.width = "48%";
    createButton.textContent = "Create";

    cancelButton.addEventListener("click", cancelNewChat);
    createButton.addEventListener("click", makeNewChat);

    newChatContainer.appendChild(usernameInput);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
}

function promptNewGroupChat() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let usernameInput = document.createElement("input");
    let addButton = document.createElement("button");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");
    let userInputsContainer = document.createElement("div");

    usernameInput.classList.add("username-input");
    usernameInput.style.width = "100%";
    usernameInput.style.padding = "10px";
    usernameInput.style.borderRadius = "15px";
    usernameInput.style.marginBottom = "10px";
    usernameInput.style.border = "1px solid #ccc";

    addButton.classList.add("chat-btn");
    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    addButton.id = "add-button";
    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    userInputsContainer.id = "user-inputs-container";

    addButton.textContent = "Add User";
    cancelButton.textContent = "Cancel";
    createButton.textContent = "Create Chat";

    addButton.style.marginRight = "2px";
    cancelButton.style.marginRight = "2px";
    createButton.style.marginLeft = "2px";
    addButton.style.width = "48%";
    cancelButton.style.width = "48%";
    createButton.style.width = "48%";

    userInputsContainer.appendChild(usernameInput);

    cancelButton.addEventListener("click", cancelNewChat);
    addButton.addEventListener("click", () => {
        let newInput = document.createElement("input");
        newInput.classList.add("username-input");
        newInput.style.width = "100%";
        newInput.style.padding = "10px";
        newInput.style.borderRadius = "15px";
        newInput.style.marginBottom = "10px";
        newInput.style.border = "1px solid #ccc";
        userInputsContainer.appendChild(newInput);
    });

    createButton.addEventListener("click", () => {
        let usernames = Array.from(
            userInputsContainer.getElementsByClassName("username-input")
        ).map(input => input.value.trim());

        usernames = usernames.filter(username => username !== "");

        if (usernames.length > 0) {
            makeNewGroupChat(usernames);
        } else {
            alert("Please add at least one username.");
        }
    });

    newChatContainer.appendChild(userInputsContainer);
    newChatContainer.appendChild(addButton);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
}

function clearDivAndMakeNewChatButtons() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let newDirectMessageButton = document.createElement("button");
    newDirectMessageButton.id = "dm-button";
    newDirectMessageButton.classList.add("chat-btn");
    newDirectMessageButton.textContent = "New Direct Message";

    let newGroupChatButton = document.createElement("button");
    newGroupChatButton.id = "gc-button";
    newGroupChatButton.classList.add("chat-btn");
    newGroupChatButton.textContent = "New Group Chat";

    newDirectMessageButton.addEventListener("click", promptNewDirectMessageChat);
    newGroupChatButton.addEventListener("click", promptNewGroupChat);
    let messageContainer = document.createElement("div");
    messageContainer.id = "message-container";
    newChatContainer.appendChild(newDirectMessageButton);
    newChatContainer.appendChild(newGroupChatButton);
    newChatContainer.appendChild(messageContainer);
}

function cancelNewChat() {
    clearDivAndMakeNewChatButtons();
}

function showMessage(message, type) {
    const messageContainer = document.getElementById("message-container");
    messageContainer.textContent = message;
    messageContainer.style.display = "block";
    messageContainer.className = "message-container " + type;

    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 5000);
}

function makeNewChat() {
    let targetUsername = document.getElementById("username-input").value;
    

    // search to see that user is friends with current logged in user first
    fetch(`http://localhost:3000/search-friends?username=${currentUser}&searchTarget=${targetUsername}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include'  // Ensures cookies are sent with the request
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();  // Parse JSON if content type is JSON
        } else {
            return response.text();  // Otherwise, parse as plain text
        }
    }).then(body => {
        if (body["result"]) {
            
            fetch(`http://localhost:3000/create-direct-message`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                credentials: 'include',  // Ensures cookies are sent with the request
                body: JSON.stringify({
                    "usernameOne": currentUser,
                    "usernameTwo": targetUsername
                })
            }).then(innerResponse => {
                if (innerResponse.ok && innerResponse.headers.get("Content-Type")?.includes("application/json")) {
                    return innerResponse.json();  // Parse JSON if content type is JSON
                } else {
                    return innerResponse.text();  // Otherwise, parse as plain text
                }
            }).then(innerBody => {
                if (innerBody["result"]) {
                    showMessage(`Created new chat with ${targetUsername}`, "success");
                    renderChatsInPanel();
                } else {
                    showMessage(`Failed to create new chat with ${targetUsername}`, "error");
                }
            }).catch(innerError => {
                showMessage(innerError.message, "error");
            });
            
        } else {
            showMessage(`Not friends with user ${targetUsername}`, "error");
        }
    }).catch(error => {
        showMessage(error.message, "error");
    });
}

function makeNewGroupChat() {

}

function removeChat(event) {
    let parentDiv = event.target.closest(".chat-box");
    let usernameButton = parentDiv.querySelector("#username-button");

    if (!usernameButton) {
        console.error("Username button not found.");
        return;
    }

    let targetUsername = usernameButton.textContent; 
    
    fetch("http://localhost:3000/remove-direct-message", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ "username": targetUsername }) 
    })
    .then(response => response.json())
    .then(body => {
        if (body.result) {
            showMessage(`Removed chat with ${targetUsername}`, "success");
            parentDiv.remove();
            const iframe = document.getElementById("current-chat");
            iframe.src = "";
        } else {
            showMessage(body.message, "error");
        }
    }).catch(error => showMessage(error.message, "error"));
}

function renderChatInMainContent(event) {
    let usernameButton = event.target;
    let parentDiv = usernameButton.closest("div");
    
    // Make sure you're accessing the id correctly.
    let roomId = parentDiv ? parentDiv.id : null;

    console.log(roomId);

    if (!roomId) {
        showMessage("Room ID not found", "error");
        return;
    }

    const iframe = document.getElementById("current-chat");

    iframe.src = `http://localhost:3000/home/chat/direct-message?roomId=${roomId}`;

    iframe.onload = () => {
        console.log(`Loaded chat room with roomId: ${roomId}`);
    };

    iframe.onerror = (error) => {
        showMessage("Failed to load chat room", "error");
    };
}



