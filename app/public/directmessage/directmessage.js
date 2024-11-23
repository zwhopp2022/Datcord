let urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('roomId');

console.log("Current Room ID:", roomId);

function appendMessage(username, message) {
    let item = document.createElement("div");
    item.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(item);
}

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
    console.log("Full Broadcast Received:", data);
    const { username, message } = data;
    appendMessage(username, message);
});

let button = document.getElementById("send-button");
let input = document.getElementById("message-input");
let messagesDiv = document.getElementById("chat-container");

button.addEventListener("click", () => {
    let message = input.value;
    if (message.trim() === "") {
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const username = currentUser ? currentUser.username : 'Anonymous';
    
    console.log("Attempting to send message:", message);
    
    socket.emit("messageBroadcast", {
        message: message,
        username: username,
        roomId: roomId
    });
    
    appendMessage(username, message);
    input.value = "";
});

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        button.click();
    }
});

socket.on("connect", () => {
    console.log("Socket state after connection:", {
        connected: socket.connected,
        id: socket.id
    });
});
