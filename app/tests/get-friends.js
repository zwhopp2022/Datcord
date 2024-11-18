const fetch = require('node-fetch');

// fetch("http://localhost:3000/add-user", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "username": "johndoe",
//         "password": "thisismypassword",
//         "bio": "johns livin man",
//         "status": "johnin",
//         "date": ["2024", "10", "28"]
//     }),
// }).then(response => {
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

// fetch("http://localhost:3000/add-user", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "username": "janedee",
//         "password": "thisismypassword",
//         "bio": "jane's livin yo",
//         "status": "jane-in'",
//         "date": ["2024", "10", "28"]
//     }),
// }).then(response => {
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

// fetch("http://localhost:3000/add-user", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "username": "heelclicksmcgee",
//         "password": "thisismypassword",
//         "bio": "bro clicks his heels idk",
//         "status": "yorkin",
//         "date": ["2024", "10", "28"]
//     }),
// }).then(response => {
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

// fetch("http://localhost:3000/add-friend", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "usernameOne": "johndoe",
//         "usernameTwo": "janedee"
//     }),
// }).then(response => {
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

// fetch("http://localhost:3000/add-friend", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "usernameOne": "johndoe",
//         "usernameTwo": "heelclicksmcgee"
//     }),
// }).then(response => {
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



fetch("http://localhost:3000/get-friends?username=janedee", {}).then(response => {
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