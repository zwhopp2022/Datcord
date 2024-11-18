const fetch = require('node-fetch');

fetch("http://localhost:3000/remove-friend", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "usernameOne": "johndoe",
        "usernameTwo": "janedee"
    }),
}).then(response => {
    if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
        return response.json();  // Parse JSON if content type is JSON
    } else {
        return response.text();  // Otherwise, parse as plain text
    }
}).then(body => {
    console.log(body);
}).catch(error => {
    console.log(error);
});