const fetch = require('node-fetch');

fetch("http://localhost:3000/modify-user", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "username": "testing",
        "updatedUsername": "testing",
        "updatedHashedPassword": "testing",
        "updatedBio": "this was just modified!!!",
        "updatedStatus": "testing",
        "updatedDate": ["2024", "10", "28"]
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

// fetch("http://localhost:3000/search-user?username=testing", {}).then(response => {
//     if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
//         return response.json();  // Parse JSON if content type is JSON
//     } else {
//         return response.text();  // Otherwise, parse as plain text
//     }
// }).then(body => {
//     console.log(body);
// }).catch(error => {
//     console.log(error);
// });

