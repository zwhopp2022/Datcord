let friends = [];
let friendRequests = [];
let currentUser = getCookie("username");

let searchBar = document.getElementById("search-bar");
let searchButton = document.getElementById("search-button");
let sidePanel = document.getElementById("friends");
let mainBody = document.getElementById('main-body');
let searchResultsContainer = document.getElementById("search-results");
const token = getCookie("token");

// resetting search results by clicking anywhere
document.addEventListener("click", () => {
    while (searchResultsContainer.firstChild) {
        searchResultsContainer.removeChild(searchResultsContainer.firstChild);
    }
});

searchButton.addEventListener("click", (event) => {
    let searchTarget = searchBar.value;

    fetch(`https://datcord.fly.dev/search-user?username=${searchTarget}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: 'include'  // Ensures cookies are sent with the request
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        let userWasFound = body["result"];

        if (userWasFound) {
            fetch(`https://datcord.fly.dev/search-friends?username=${currentUser}&searchTarget=${searchTarget}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: 'include'  // Ensures cookies are sent with the request
            }).then(response => {
                if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
                    return response.json();
                } else {
                    return response.text();
                }
            }).then(body => {
                let alreadyFriends = body["result"];

                if (alreadyFriends) {
                    let div = document.createElement('div');
                    div.classList.add('friend-request-row');
                    div.style.color = 'green';
                    div.textContent = "Already friends with user";
                    searchResultsContainer.appendChild(div);
                } else {
                    let div = document.createElement('div');
                    div.classList.add('friend-request-row');
                    
                    let usernameLabel = document.createElement('span');
                    usernameLabel.textContent = searchTarget;

                    let button = document.createElement('button');
                    button.textContent = "Send Friend Request";
                    button.style.backgroundColor = '#c9a0d3';
                    button.style.borderRadius = '5px';
                    button.classList.add('send-request-button');
                    button.addEventListener("click", () => sendFriendRequest(searchTarget, currentUser));

                    div.appendChild(usernameLabel);
                    div.appendChild(button);
                    searchResultsContainer.appendChild(div);
                }

            }).catch(error => {
                console.log(error);
            });
        } else {
            let div = document.createElement('div');
            div.classList.add('friend-request-row');
            div.style.color = 'red';  // Red text
            div.textContent = "User not found";
            searchResultsContainer.appendChild(div);
        }

    }).catch(error => {
        console.log(error);
    });
});

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

function goBack() {
    window.location.href = '/home';
}

// usernameTwo should be currentUser for most calls
function sendFriendRequest(usernameOne, usernameTwo) {
    fetch("https://datcord.fly.dev/add-friend", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "usernameOne": usernameOne,
            "usernameTwo": usernameTwo,
            "sentBy": usernameTwo
        }),
        credentials: 'include'  // Ensures cookies are sent with the request
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        let div = document.createElement('div');
        div.classList.add('friend-request-row');
        div.style.color = 'green';
        div.textContent = "Friend request sent!";
        searchResultsContainer.appendChild(div);
    }).catch(error => {
        console.log(error);
    });
    
}

// usernameTwo should be currentUser for most calls
function acceptRequest(usernameOne, usernameTwo) {
    fetch("https://datcord.fly.dev/accept-friend-request", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "usernameOne": usernameOne,
            "usernameTwo": usernameTwo
        }),
        credentials: 'include'  // Ensures cookies are sent with the request
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text();
        }
    }).then(body => {
        console.log(body);
        friends.push(usernameOne);
        let index = friendRequests.indexOf(usernameOne);
        if (index !== -1) {
            friendRequests.splice(index, 1);
        }
        renderFriendsAndRequests();
    }).catch(error => {
        console.log(error);
    });
}


// usernameTwo should be currentUser for most calls
function declineRequest(usernameOne, usernameTwo) {
    fetch("https://datcord.fly.dev/remove-friend", {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "usernameOne": usernameOne,
            "usernameTwo": usernameTwo
        }),
        credentials: 'include'  // Ensures cookies are sent with the request
    }).then(response => {
        if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
            return response.json();
        } else {
            return response.text(); 
        }
    }).then(body => {
        console.log(body);
        let requestIndex = friendRequests.indexOf(usernameOne);
        if (requestIndex !== -1) {
            friendRequests.splice(requestIndex, 1);
        }
        let friendIndex = friends.indexOf(usernameOne);
        if (friendIndex !== -1) {
            friends.splice(friendIndex, 1);
        }
        renderFriendsAndRequests();
    }).catch(error => {
        console.log(error);
    });
}

function renderFriendsAndRequests() {
    while (mainBody.firstChild) {
        mainBody.removeChild(mainBody.firstChild);
    }

    while (sidePanel.firstChild) {
        sidePanel.removeChild(sidePanel.firstChild);
    }

    for (let friend of friends) {
        addFriendToPanel(friend);
    }

    for (let request of friendRequests) {
        addFriendRequestToMainBody(request)
    }
}

function addFriendToPanel(username) {
    let newDiv = document.createElement("div");
    newDiv.classList.add("friend-panel-row"); 
    newDiv.textContent = username;

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button'); 
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => declineRequest(username, currentUser));

    newDiv.appendChild(removeButton);

    sidePanel.appendChild(newDiv);
}


function addFriendRequestToMainBody(username) {
    // Create the main div for the friend request row
    const requestDiv = document.createElement('div');
    requestDiv.classList.add('friend-request-row');
    requestDiv.id = username;

    const usernameLabel = document.createElement('span');
    usernameLabel.classList.add('friend-username');
    usernameLabel.textContent = username;

    const acceptButton = document.createElement('button');
    acceptButton.classList.add('accept-button');
    acceptButton.id = `${username}-accept`;
    acceptButton.textContent = "Accept";

    const declineButton = document.createElement('button');
    declineButton.classList.add('decline-button');
    declineButton.id = `${username}-decline`;
    declineButton.textContent = "Decline";

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('friend-request-buttons');
    buttonsDiv.appendChild(acceptButton);
    buttonsDiv.appendChild(declineButton);

    requestDiv.appendChild(usernameLabel);
    requestDiv.appendChild(buttonsDiv);

    acceptButton.addEventListener("click", () => acceptRequest(username, currentUser));
    declineButton.addEventListener("click", () => declineRequest(username, currentUser));

    mainBody.appendChild(requestDiv);
}

document.addEventListener("DOMContentLoaded", async () => {
    let currentUser = {};
    currentUser.username = getCookie("username");
    currentUser.token = getCookie("token");
    if (currentUser) {
        document.getElementById("left-panel-header").textContent = `${currentUser.username}'s Friends`;
        await fetchFriendsAndRequests(currentUser.username, currentUser.token);
    } else {
        console.log("No user is logged in");
    }

    document.getElementById("back-btn").addEventListener("click", goBack);
});

async function fetchFriendsAndRequests(username, token) {
    if (!token) {
        console.error("No authentication token available");
        return;
    }

    try {
        let friendsResponse = await fetch(`https://datcord.fly.dev/get-friends?username=${username}`, {
            method: 'GET',  // Specify the method (GET)
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // Ensures cookies are sent with the request
        });

        if (friendsResponse.ok) {
            let friendsBody = await friendsResponse.json();
            for (let friend of friendsBody.friends) {
                friends.push(friend);
                addFriendToPanel(friend);
            }
        } else {
            console.log("Failed to fetch friends:", await friendsResponse.text());
        }

        let requestsResponse = await fetch(`https://datcord.fly.dev/get-friend-requests?username=${username}`, {
            method: 'GET',  // Specify the method (GET)
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // Ensures cookies are sent with the request
        });

        if (requestsResponse.ok) {
            let friendRequestsBody = await requestsResponse.json();
            for (let friendRequest of friendRequestsBody.friends) {
                friendRequests.push(friendRequest);
                addFriendRequestToMainBody(friendRequest);
            }
        } else {
            console.log("Failed to fetch friend requests:", await requestsResponse.text());
        }
    } catch (error) {
        console.log("Error fetching friends data:", error);
    }
}
