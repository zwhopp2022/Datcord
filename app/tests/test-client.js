// THIS FILE CONTAINS TEST FETCHES FOR EACH SQL ENDPOINT [modify, add, get, search]


const fetch = require('node-fetch');

// fetch("http://localhost:3000/modify-user", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         "username": "johndoe",
//         "updatedUsername": "johndoe",
//         "updatedHashedPassword": "c2713b62c903791bdefc5a6a99df04d4330de491bbc7a0ca6a5007337e4a6028",
//         "updatedBio": "new bio for testing",
//         "updatedStatus": "happy",
//         "updatedDate": ["2024", "10", "28"]
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


// fetch("http://localhost:3000/get-user?username=johndoe", {}).then(response => {
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

// fetch("http://localhost:3000/search-user?username=johndoe", {}).then(response => {
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






fetch("http://localhost:3000/add-user", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "username": "johndoe",
        "password": "thisismypassword",
        "bio": "johns livin man",
        "status": "johnin",
        "date": ["2024", "10", "28"]
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

fetch("http://localhost:3000/add-user", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "username": "janedee",
        "password": "thisismypassword",
        "bio": "jane's livin yo",
        "status": "jane-in'",
        "date": ["2024", "10", "28"]
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

