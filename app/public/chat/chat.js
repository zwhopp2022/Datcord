let urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('roomId');
let token = getCookie("token");
let username = getCookie("username");
let button = document.getElementById("send-button");
let input = document.getElementById("message-input");
let messagesDiv = document.getElementById("chat-container");

function appendMessage(username, message, isSelf = false) {
    let item = document.createElement("div");
    item.className = "message-item";

    let usernameSpan = document.createElement("span");
    usernameSpan.className = "message-username";
    usernameSpan.textContent = username;
    
    // Apply class based on whether the message is from the current user or not
    usernameSpan.classList.add(isSelf ? "self" : "other-user");

    let messageSpan = document.createElement("span");
    messageSpan.className = "message-text";
    messageSpan.textContent = message;

    item.appendChild(usernameSpan);
    item.appendChild(messageSpan);
    messagesDiv.appendChild(item);
    scrollToBottom();
}

function scrollToBottom() {
    console.log("Before Scroll - scrollTop:", messagesDiv.scrollTop, "scrollHeight:", messagesDiv.scrollHeight, "clientHeight:", messagesDiv.clientHeight);
    
    if (messagesDiv.scrollHeight > messagesDiv.clientHeight) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    console.log("After Scroll - scrollTop:", messagesDiv.scrollTop, "scrollHeight:", messagesDiv.scrollHeight);
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

button.addEventListener("click", () => {
    let message = input.value;
    if (message.trim() === "") {
        return;
    }
    
    const username = getCookie("username");
    
    socket.emit("messageBroadcast", {
        message: message,
        username: username,
        roomId: roomId
    });
    
    appendMessage(username, message, true);
    input.value = "";
    fetch(`http://localhost:3000/save-message`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        credentials: 'include',  
        body: JSON.stringify({
            "sentMessage": message,
            "sentBy": username,
            "roomCode": roomId
        })
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        if (body["result"]) {
            // handle sent status
        } else {
            // handle error status
        }
    }).catch(error => {
        console.log(error.message);
    });
});

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        button.click();
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    fetch(`http://localhost:3000/get-messages?roomId=${roomId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        credentials: 'include',
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        for (let message of body.result) {
            if (message["sentby"] === username) {
                appendMessage(message["sentby"], message["sentmessage"], true);
            } else {
                appendMessage(message["sentby"], message["sentmessage"], false);
            }
        }
    }).catch(error => {
        console.log(error);
    });
});

let socket = io('http://localhost:3001', {
    query: { roomId: roomId }
});

socket.on("connect", () => { 
    console.log("Connected to server", socket.id); 
    console.log("Connection query:", socket.io.opts.query);
});

socket.on("connect_error", (error) => {
    console.error("Connection Error:", error);
});

socket.on("messageBroadcast", (data) => {
    const { username, message } = data;
    appendMessage(username, message, false);
});

socket.on("connect", () => {
    console.log("Socket state after connection:", {
        connected: socket.connected,
        id: socket.id
    });
});
