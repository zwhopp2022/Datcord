let urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('roomId');
let token = getCookie("token");
let username = getCookie("username");
let button = document.getElementById("send-button");
let input = document.getElementById("message-input");
let messagesDiv = document.getElementById("chat-container");

function appendMessage(messageUsername, message, messageId, isSelf = false) {
    let item = document.createElement("div");
    item.className = "message-item";
    item.dataset.username = messageUsername;
    item.dataset.message = message;
    item.dataset.messageid = messageId;

    let usernameSpan = document.createElement("span");
    usernameSpan.className = "message-username";
    usernameSpan.textContent = messageUsername;

    usernameSpan.classList.add(isSelf ? "self" : "other-user");

    let messageSpan = document.createElement("span");
    messageSpan.className = "message-text";
    messageSpan.textContent = message;

    let reactionsDiv = document.createElement("div");
    reactionsDiv.className = "message-reactions";

    const reactions = [
        { emoji: "👍", type: "thumbsUp" },
        { emoji: "👎", type: "thumbsDown" },
        { emoji: "😐", type: "neutralFace" },
        { emoji: "🍆", type: "eggplant" }
    ];

    reactions.forEach(reaction => {
        let reactionButton = document.createElement("button");
        reactionButton.className = "reaction-button";
        reactionButton.dataset.reactionType = reaction.type;
        reactionButton.innerHTML = `${reaction.emoji} <span class="reaction-count">0</span>`;

        reactionButton.addEventListener("click", () => {
            handleReaction(messageUsername, message, roomId, reaction.type, messageId);
        });

        reactionsDiv.appendChild(reactionButton);
    });

    let editSpan = document.createElement("span");
    editSpan.className = "message-edit";

    let editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.dataset.roomId = roomId;
    editButton.textContent = "✏️";

    editButton.addEventListener("click", () => {
        editButton.style.display = "none";

        let newMessage = document.createElement("input");
        newMessage.type = "text";
        newMessage.className = "message-edit-input";
        newMessage.value = message;

        let saveButton = document.createElement("button");
        saveButton.className = "save-button";
        saveButton.textContent = "✅";

        let cancelButton = document.createElement("button");
        cancelButton.className = "cancel-button";
        cancelButton.textContent = "🚫";

        let interactiveEditSpan = document.createElement("span");
        interactiveEditSpan.className = "message-text";

        saveButton.addEventListener("click", () => {
            let newMessageToSave = newMessage.value;
            let messageId = item.dataset.messageid;
            if (newMessageToSave) { // we shouldn't allow empty messages
                messageSpan.textContent = newMessageToSave;
                item.dataset.message = newMessageToSave;
                messageSpan.style.display = "inline";
                editButton.style.display = "inline";

                fetch(`https://datcord.fly.dev/edit-message`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        editedMessage: newMessageToSave,
                        messageId: messageId,
                        roomCode: roomId
                    })
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        console.log("failed to edit message");
                    }
                }).catch(error => {
                    console.log(error.message);
                });

                interactiveEditSpan.remove();
            }
        });

        cancelButton.addEventListener("click", () => {
            messageSpan.style.display = "inline";
            editButton.style.display = "inline";
            interactiveEditSpan.remove();
        });

        interactiveEditSpan.appendChild(newMessage);
        interactiveEditSpan.appendChild(saveButton);
        interactiveEditSpan.appendChild(cancelButton);

        messageSpan.style.display = "none";
        item.insertBefore(interactiveEditSpan, reactionsDiv);
    });

    if (messageUsername === username) {
        editSpan.appendChild(editButton);
    }
    reactionsDiv.appendChild(editSpan);

    item.appendChild(usernameSpan);
    item.appendChild(messageSpan);
    item.appendChild(reactionsDiv);
    messagesDiv.appendChild(item);

    loadReactionCounts(username, message, roomId, item);

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
    let message = input.value.trim();
    if (message) {
        fetch("https://datcord.fly.dev/save-message", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify({
                sentMessage: message,
                sentBy: username,
                roomCode: roomId
            })
        }).then(response => response.json())
        .then(data => {
            if (data.result) {
                input.value = "";
                appendMessage(username, message, data.messageId, true);
                socket.emit("message", {
                    username: username,
                    message: message,
                    messageId: data.messageId,
                    roomId: roomId
                });
            }
        }).catch(error => {
            console.log(error.message);
        });
    }
});

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        button.click();
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    fetch(`https://datcord.fly.dev/get-messages?roomId=${roomId}`, {
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
                appendMessage(message["sentby"], message["sentmessage"], message["messageid"], true);
            } else {
                appendMessage(message["sentby"], message["sentmessage"], message["messageid"], false);
            }
        }
    }).catch(error => {
        console.log(error);
    });
});

let socket = io('https://datcord.fly.dev', {
    query: { roomId: roomId }
});

socket.on("connect", () => {
    console.log("Connected to server", socket.id);
    console.log("Connection query:", socket.io.opts.query);
});

socket.on("connect_error", (error) => {
    console.error("Connection Error:", error);
});

socket.on('messageUpdate', (data) => {
    let messageDiv = document.querySelector(`[data-messageid="${data.messageId}"]`);

    if (messageDiv) {
        let messageSpan = messageDiv.querySelector('.message-text');
        messageSpan.textContent = data.editedMessage;
        messageDiv.dataset.message = data.editedMessage;
    }
});

socket.on("messageBroadcast", (data) => {
    const { username, message, messageId } = data;
    appendMessage(username, message, messageId, false);
});

socket.on("connect", () => {
    console.log("Socket state after connection:", {
        connected: socket.connected,
        id: socket.id
    });
});

async function handleReaction(messageUsername, message, roomId, reactionType, messageId) {
    try {
        const messageElement = document.querySelector(`.message-item[data-messageid="${messageId}"]`);
        if (!messageElement) {
            console.error('Message element not found');
            return;
        }

        const response = await fetch(`https://datcord.fly.dev/react-to-message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                messageId: parseInt(messageId),
                roomCode: roomId,
                reactionType: reactionType,
                reactingUser: username
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateReactionDisplay(messageId, reactionType, result.newCount, result.hasReacted);
                socket.emit('reaction', {
                    messageId,
                    roomId,
                    reactionType,
                    newCount: result.newCount,
                    hasReacted: result.hasReacted,
                    sentBy: messageUsername,
                    sentMessage: message,
                    reactingUser: username
                });
            }
        }
    } catch (error) {
        console.error('Error handling reaction:', error);
    }
}

function updateReactionDisplay(messageId, reactionType, newCount, hasReacted) {
    const messageElement = document.querySelector(`.message-item[data-messageid="${messageId}"]`);
    if (messageElement) {
        const reactionButton = messageElement.querySelector(`button[data-reaction-type="${reactionType}"]`);
        if (reactionButton) {
            const countSpan = reactionButton.querySelector('.reaction-count');
            countSpan.textContent = newCount;
            reactionButton.classList.toggle('active', hasReacted);
        }
    }
}

async function loadReactionCounts(messageUsername, message, roomId, messageElement) {
    try {
        const response = await fetch(`https://datcord.fly.dev/get-reaction-counts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify({
                sentBy: messageUsername,
                sentMessage: message,
                roomCode: roomId,
                currentUser: username
            })
        });

        if (response.ok) {
            const data = await response.json();
            const reactionButtons = messageElement.querySelectorAll('.reaction-button');

            reactionButtons.forEach(button => {
                const reactionType = button.dataset.reactionType;
                const countSpan = button.querySelector('.reaction-count');
                countSpan.textContent = data[reactionType] || 0;

                if (data.userReactions.includes(reactionType)) {
                    button.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error('Error loading reaction counts:', error);
    }
}

// Add socket listener for reaction updates
socket.on('reactionUpdate', (data) => {
    const { messageId, reactionType, newCount, hasReacted, reactingUser } = data;
    const messageElement = document.querySelector(`.message-item[data-messageid="${messageId}"]`);
    if (messageElement) {
        const reactionButton = messageElement.querySelector(`button[data-reaction-type="${reactionType}"]`);
        if (reactionButton) {
            const countSpan = reactionButton.querySelector('.reaction-count');
            countSpan.textContent = newCount;

            // Only update the active state if this is the current user's reaction
            if (reactingUser === username) {
                reactionButton.classList.toggle('active', hasReacted);
            }
        }
    }
});

function getEmojiForReactionType(type) {
    const emojiMap = {
        thumbsUp: '👍',
        thumbsDown: '👎',
        neutralFace: '😐',
        eggplant: '🍆'
    };
    return emojiMap[type];
}

function getReactionTypeFromEmoji(emoji) {
    const typeMap = {
        '👍': 'thumbsUp',
        '': 'thumbsDown',
        '😐': 'neutralFace',
        '🍆': 'eggplant'
    };
    return typeMap[emoji];
}
