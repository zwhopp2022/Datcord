// extract room ID from URL
let pathParts = window.location.pathname.split("/");
let roomId = pathParts[pathParts.length - 1];

console.log("Current Room ID:", roomId); // Debug log for room ID

function appendMessage(message) {
    let item = document.createElement("div");
    item.textContent = message;
    messagesDiv.appendChild(item);
}

// Improved socket connection with explicit room parameter
let socket = io('/', {
    query: { roomId: roomId }
});

// Extensive connection logging
socket.on("connect", () => { 
    console.log("Connected to server", socket.id); 
    console.log("Connection query:", socket.io.opts.query);
});

// Log any connection errors
socket.on("connect_error", (error) => {
    console.error("Connection Error:", error);
});

// Broader message event logging
socket.on("messageBroadcast", (data) => {
    console.log("Full Broadcast Received:", data);
    console.log("Received message type:", typeof data);
    
    // Handle different possible data formats
    const message = typeof data === 'object' ? data.message : data;
    appendMessage(message);
});

let button = document.getElementById("send-button");
let input = document.getElementById("message-input");
let messagesDiv = document.getElementById("chat-container");

button.addEventListener("click", () => {
    let message = input.value;
    if (message === "") {
        return;
    }
    
    console.log("Attempting to send message:", message);
    console.log("Current socket connected:", socket.connected);
    
    // Try different emission formats
    socket.emit("messageBroadcast", { 
        message: message, 
        roomId: roomId 
    });
    
    // Fallback emission
    socket.emit("messageBroadcast", message);
    
    // Append sender's own message
    appendMessage(message);
    
    input.value = ''; // Clear input after sending
});

// Debugging socket state
socket.on("connect", () => {
    console.log("Socket state after connection:", {
        connected: socket.connected,
        id: socket.id
    });
});