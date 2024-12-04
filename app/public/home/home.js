let currentUser = getCookie("username");
let token = getCookie("token");
console.log(token);
let newChatContainer = document.getElementById("new-chat");
let chatSection = document.getElementById("chats");
let serverSection = document.getElementById("server-list");

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
        renderServersInPanel();
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

function createAndInsertServer(serverName, code) {
    let newServerBox = document.createElement("div");
    newServerBox.id = code;
    newServerBox.dataset.serverName = serverName;
    newServerBox.classList.add("server-box");
    
    let removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.id = "remove-button";
    removeButton.classList.add("remove-button");
    removeButton.addEventListener("click", removeServer);

    let serverNameButton = document.createElement("button");
    serverNameButton.textContent = serverName;
    serverNameButton.id = "username-button";
    serverNameButton.classList.add("username-button");
    serverNameButton.addEventListener("click", renderServerInMainContent);

    newServerBox.appendChild(removeButton);
    newServerBox.appendChild(serverNameButton);
    
    serverSection.appendChild(newServerBox);
}




function extractUserName(row) {
    let usernames = [row.usernameone, row.usernametwo];
    for (let username of usernames) {
        if (username !== currentUser) {
            return username;
        }
    }
}

function extractCreateDirectMessageTitle(title) {
    return title.replace(currentUser, '').trim();
}


function renderChatsInPanel() {
    chatSection.innerHTML = '';
    fetch(`http://localhost:3000/get-chats?username=${currentUser}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    })
    .then(response => response.json())
    .then(body => {
        body.result.forEach(row => {
            createAndInsertChat(extractCreateDirectMessageTitle(row["title"]), row["roomid"]);
        });
    })
    .catch(error => console.log("Error fetching chats:", error));
}

function renderServersInPanel() {
    serverSection.innerHTML = '';
    fetch(`http://localhost:3000/get-servers?username=${currentUser}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
    })
    .then(response => response.json())
    .then(body => {
        body.result.forEach(row => {
            createAndInsertServer(row["name"], row["code"]);
        });
    })
    .catch(error => console.log("Error fetching Servers:", error));
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

    // Adding placeholder text
    usernameInput.style.width = "100%";
    usernameInput.style.padding = "10px";
    usernameInput.style.borderRadius = "15px";
    usernameInput.style.marginBottom = "10px"; 
    usernameInput.style.border = "1px solid #ccc";
    usernameInput.placeholder = "Enter username";  // Placeholder text

    cancelButton.style.marginRight = "2px";
    cancelButton.style.width = "48%";
    cancelButton.textContent = "Cancel";
    createButton.style.marginLeft = "2px"; 
    createButton.style.width = "48%";
    createButton.textContent = "Create";

    cancelButton.addEventListener("click", cancelNewChat);
    createButton.addEventListener("click", () => {
        let targetUsername = usernameInput.value.trim();
        if (targetUsername && targetUsername !== currentUser) {
            makeNewChat("direct-message", "", [currentUser, targetUsername]);
        } else {
            showMessage("Please enter a valid username for DM.", "error");
        }
    });

    newChatContainer.appendChild(usernameInput);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
}

function promptNewServer() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let messageContainer = document.createElement("div");
    let nameInput = document.createElement("input");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");

    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    nameInput.id = "name-input";
    messageContainer.id = "message-container";

    // Adding placeholder text
    nameInput.style.width = "100%";
    nameInput.style.padding = "10px";
    nameInput.style.borderRadius = "15px";
    nameInput.style.marginBottom = "10px"; 
    nameInput.style.border = "1px solid #ccc";
    nameInput.placeholder = "Enter the server name here";  // Placeholder text

    cancelButton.style.marginRight = "2px";
    cancelButton.style.width = "48%";
    cancelButton.textContent = "Cancel";
    createButton.style.marginLeft = "2px"; 
    createButton.style.width = "48%";
    createButton.textContent = "Create";

    cancelButton.addEventListener("click", cancelNewChat);
    createButton.addEventListener("click", () => {
        let newServerName = nameInput.value.trim();
        console.log(newServerName);
        if (newServerName != "") {
            makeNewServer(newServerName, currentUser);
        } else {
            showMessage("Please enter a valid server name.", "error");
        }
    });

    newChatContainer.appendChild(nameInput);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
}

function promptNewGroupChat() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let titleInput = document.createElement("input");
    let addButton = document.createElement("button");
    let cancelButton = document.createElement("button");
    let createButton = document.createElement("button");
    let userInputsContainer = document.createElement("div");
    let messageContainer = document.createElement("div");

    titleInput.classList.add("username-input");
    titleInput.style.width = "100%";
    titleInput.style.padding = "10px";
    titleInput.style.borderRadius = "15px";
    titleInput.style.marginBottom = "10px";
    titleInput.style.border = "1px solid #ccc";
    titleInput.placeholder = "Enter chat title";

    addButton.classList.add("chat-btn");
    cancelButton.classList.add("chat-btn");
    createButton.classList.add("chat-btn");

    addButton.id = "add-button";
    cancelButton.id = "cancel-button";
    createButton.id = "create-button";
    userInputsContainer.id = "user-inputs-container";
    messageContainer.id = "message-container";

    addButton.textContent = "Add User";
    cancelButton.textContent = "Cancel";
    createButton.textContent = "Create Chat";

    addButton.style.marginRight = "2px";
    cancelButton.style.marginRight = "2px";
    createButton.style.marginLeft = "2px";
    addButton.style.width = "48%";
    cancelButton.style.width = "48%";
    createButton.style.width = "48%";

    userInputsContainer.appendChild(titleInput);

    cancelButton.addEventListener("click", cancelNewChat);
    addButton.addEventListener("click", () => {
        let newInput = document.createElement("input");
        newInput.classList.add("username-input");
        newInput.style.width = "100%";
        newInput.style.padding = "10px";
        newInput.style.borderRadius = "15px";
        newInput.style.marginBottom = "10px";
        newInput.style.border = "1px solid #ccc";
        newInput.placeholder = "Add a user";
        userInputsContainer.appendChild(newInput);
    });

    

    createButton.addEventListener("click", () => {
        let usernames = Array.from(userInputsContainer.getElementsByClassName("username-input"))
            .map(input => input.value.trim())
            .filter(username => username !== "" && username !== currentUser); 

        let title = titleInput.value.trim();

        let reducedUserFields = [];
        for (let i = 1; i < usernames.length; i++) {
            reducedUserFields.push(usernames[i]);
        }

        if (reducedUserFields.length > 0 && title !== '') {
            makeNewChat("group-chat", title, reducedUserFields);
        } else {
            showMessage("Please provide a title and add at least one user.", "error");
        }
    });

    newChatContainer.appendChild(userInputsContainer);
    newChatContainer.appendChild(addButton);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
}

function promptJoinServer() {
    while (newChatContainer.firstChild) {
        newChatContainer.removeChild(newChatContainer.firstChild);
    }

    let messageContainer = document.createElement("div");
    let codeInput = document.createElement("input");
    let cancelButton = document.createElement("button");
    let joinButton = document.createElement("button");

    cancelButton.classList.add("chat-btn");
    joinButton.classList.add("chat-btn");

    cancelButton.id = "cancel-button";
    joinButton.id = "create-button";
    codeInput.id = "code-input";
    messageContainer.id = "message-container";

    // Adding placeholder text
    codeInput.style.width = "100%";
    codeInput.style.padding = "10px";
    codeInput.style.borderRadius = "15px";
    codeInput.style.marginBottom = "10px"; 
    codeInput.style.border = "1px solid #ccc";
    codeInput.placeholder = "Enter the server code here";  // Placeholder text

    cancelButton.style.marginRight = "2px";
    cancelButton.style.width = "48%";
    cancelButton.textContent = "Cancel";
    joinButton.style.marginLeft = "2px"; 
    joinButton.style.width = "48%";
    joinButton.textContent = "Join";

    cancelButton.addEventListener("click", cancelNewChat);
    createButton.addEventListener("click", () => {
        let newServerName = nameInput.value.trim();
        if (newServerName != "") {
            makeNewServer(newServerName, currentUser);
        } else {
            showMessage("Please enter a valid server code.", "error");
        }
    });

    newChatContainer.appendChild(nameInput);
    newChatContainer.appendChild(cancelButton);
    newChatContainer.appendChild(createButton);
    newChatContainer.appendChild(messageContainer);
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

    let newServerButton = document.createElement("button");
    newServerButton.id = "server-button";
    newServerButton.classList.add("chat-btn");
    newServerButton.textContent = "New Server";
    
    let joinServerButton = document.createElement("button");
    joinServerButton.id = "server-button";
    joinServerButton.classList.add("chat-btn");
    joinServerButton.textContent = "Join Server";

    newDirectMessageButton.addEventListener("click", promptNewDirectMessageChat);
    newGroupChatButton.addEventListener("click", promptNewGroupChat);
    newServerButton.addEventListener("click", promptNewServer);
    joinServerButton.addEventListener("click", promptJoinServer);

    let messageContainer = document.createElement("div");
    messageContainer.id = "message-container";
    newChatContainer.appendChild(newDirectMessageButton);
    newChatContainer.appendChild(newGroupChatButton);
    newChatContainer.appendChild(newServerButton);
    newChatContainer.appendChild(joinServerButton)
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

function makeNewServer(serverName, createdBy) {
    if (!(serverName.length > 0) || !(createdBy.length > 0)) {
        showMessage("Invalid data for creating a server.", "error");
        return;
    }

    fetch ("http://localhost:3000/create-server", {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            "serverName": serverName,
            "createdBy": createdBy
        })
    }).then(response => response.json())
    .then(body => {
        console.log(body["serverCode"]);
        if (body.hasOwnProperty("serverCode")) {
            showMessage(`Created new Server: ${serverName}`, "success");
            renderServersInPanel();
        } else {
            showMessage(`Failed to create new server`, "error");
        }
    }).catch(error => {
        showMessage(error.message, "error");
    });
}

function makeNewChat(type, title, usernames) {
    // Ensure title and usernames are provided
    if (!Array.isArray(usernames) || usernames.length === 0) {
        showMessage("Invalid data for creating a chat.", "error");
        return;
    }

    if (type === "direct-message") {
        if (usernames.length !== 2 || usernames[1] === currentUser) {
            showMessage("Please enter a valid username for DM.", "error");
            return; 
        }

        const targetUsername = usernames[1];
        const directMessageTitle = `${currentUser} ${targetUsername}`;

        // Proceed to create the direct message chat
        fetch("http://localhost:3000/create-direct-message", {
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            credentials: 'include',  // Ensures cookies are sent with the request
            body: JSON.stringify({
                "usernameOne": currentUser,
                "usernameTwo": targetUsername,
                "title": directMessageTitle
            })
        }).then(response => response.json())
        .then(body => {
            if (body.result) {
                showMessage(`Created new direct message: ${directMessageTitle}`, "success");
                renderChatsInPanel();
            } else {
                showMessage(`Failed to create new direct message`, "error");
            }
        }).catch(error => {
            showMessage(error.message, "error");
        });

    } else if (type === "group-chat") {
        // For group chats, validate and proceed
        if (usernames.length > 0 && title !== '') {
            fetch("http://localhost:3000/create-group-message", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                credentials: 'include', 
                body: JSON.stringify({
                    "usernames": [currentUser, ...usernames], 
                    "title": title
                })
            }).then(innerResponse => innerResponse.json())
            .then(innerBody => {
                if (innerBody.result) {
                    showMessage(`Created new group chat: ${title}`, "success");
                    renderChatsInPanel();  // Refresh the list of chats
                } else {
                    showMessage(`Failed to create new group chat`, "error");
                }
            }).catch(innerError => {
                showMessage(innerError.message, "error");
            });
        } else {
            console.log("got here 4");
            showMessage("Please provide a title and add at least one user.", "error");
        }
    }
}

function removeChat(event) {
    let parentDiv = event.target.closest(".chat-box");

    let roomId = parentDiv.id;
    
    fetch("http://localhost:3000/remove-chat", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ "roomId":  roomId}) 
    })
    .then(response => response.json())
    .then(body => {
        if (body.result) {
            showMessage(`Removed chat with id ${roomId}`, "success");
            parentDiv.remove();
            const iframe = document.getElementById("current-chat");
            iframe.src = "";
        } else {
            showMessage(body.message, "error");
        }
    }).catch(error => showMessage(error.message, "error"));
}

function removeServer(event) {
    let parentDiv = event.target.closest(".server-box");

    let serverCode = parentDiv.id;
    
    fetch("http://localhost:3000/leave-server", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ "serverCode":  serverCode, "user": currentUser}) 
    })
    .then(response => response.json())
    .then(body => {
        if (body.result) {
            showMessage(`Left server with code ${serverCode}`, "success");
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

    iframe.src = `http://localhost:3000/home/chat?roomId=${roomId}`;

    iframe.onload = () => {
        console.log(`Loaded chat room with roomId: ${roomId}`);
    };

    iframe.onerror = (error) => {
        showMessage("Failed to load chat room", "error");
    };
}

function renderServerInMainContent(event) {
    let serverButton = event.target;
    let parentDiv = serverButton.closest("div");
    
    // Make sure you're accessing the id correctly.
    let serverCode = parentDiv ? parentDiv.id : null;
    let serverName = parentDiv ? parentDiv.dataset.serverName : null;

    console.log(serverCode);

    if (!serverCode) {
        showMessage("Server Code not found", "error");
        return;
    }

    const iframe = document.getElementById("current-chat");

    iframe.src = `http://localhost:3000/home/server?serverCode=${serverCode}&serverName=${serverName}`;

    iframe.onload = () => {
        console.log(`Loaded Server with code: ${serverCode}`);
    };

    iframe.onerror = (error) => {
        showMessage("Failed to load Server", "error");
    };
}



