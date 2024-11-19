// extract room ID from URL
let pathParts = window.location.pathname.split("/");
let roomId = pathParts[pathParts.length - 1];

function appendMessage(message) {
    let item = document.createElement("div");
    item.textContent = message;
    messagesDiv.appendChild(item);
}

let socket = io();

// WARNING: socket.connected will NOT be true immediately
socket.on("connect", () => { 
    console.log("Connected to server", socket.id); 
});

let button = document.getElementById("send-button");
let input = document.getElementById("message-input");
let messagesDiv = document.getElementById("chat-container");

button.addEventListener("click", () => {
    let message = input.value;
    if (message === "") {
        return;
    }
    console.log("Sending message:", message);
    // socket.emit can send a string, object, array, etc.
    socket.emit("foo", { message });
    // need to append its own message, as it won't receive its own event
    appendMessage(message);
    input.value = ''; // Clear input after sending
});

/* MUST REGISTER socket.on(event) listener FOR EVERY event SERVER CAN SEND */
socket.on("bar", function(data) {
    console.log("Received message:", data);
    appendMessage(data);
});
