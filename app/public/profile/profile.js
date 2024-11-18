document.addEventListener("DOMContentLoaded", async () => {
    let storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        let currentUser = JSON.parse(storedUser);
        await populateProfileFields(currentUser.username, currentUser.token);
    } else {
        console.log("No user is logged in");
    }

    document.getElementById("save-btn").addEventListener("click", saveProfileData);
});

async function fetchUser(username, token) {
    try {
        const response = await fetch(`http://localhost:3000/get-user?username=${username}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch current user data');
        return await response.json();
    } catch (error) {
        showMessage('Error fetching user data', 'error');
        return null;
    }
}

async function populateProfileFields(username, token) {
    const currentUser = await fetchUser(username, token);

    if (!currentUser) {
        showMessage('Unable to load profile data', 'error');
        return;
    }

    document.getElementById("username").value = currentUser.username || '';
    document.getElementById("bio").value = currentUser.bio || '';
    document.getElementById("status").value = currentUser.status || '';

    if (currentUser.birthday) {
        const date = new Date(currentUser.birthday);
        document.getElementById("birthday").value = [
            date.getFullYear(),
            (date.getMonth() + 1).toString().padStart(2, '0'),
            date.getDate().toString().padStart(2, '0')
        ].join('-');
    }
}

function showMessage(message, type) {
    const messageContainer = document.getElementById("message-container");
    messageContainer.textContent = message;
    messageContainer.style.display = "block";
    messageContainer.className = "message-container " + type;

    // Hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.display = "none";
    }, 5000);
}

async function saveProfileData() {
    let storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        showMessage("No user is logged in", "error");
        return;
    }

    let currentUser = JSON.parse(storedUser);
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            showMessage("New passwords do not match!", "error");
            return;
        }
    }

    const updatedUser = {
        username: currentUser.username,
        updatedUsername: document.getElementById("username").value || currentUser.username,
        updatedPassword: newPassword || null,
        updatedBio: document.getElementById("bio").value || currentUser.bio,
        updatedStatus: document.getElementById("status").value || currentUser.status,
        updatedDate: document.getElementById("birthday").value.split('-')
    };

    try {
        const response = await fetch('http://localhost:3000/modify-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            credentials: 'include',
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving profile data');
        }

        // Update localStorage with new username if it was changed
        if (updatedUser.updatedUsername !== currentUser.username) {
            localStorage.setItem('currentUser', JSON.stringify({
                username: updatedUser.updatedUsername,
                token: currentUser.token
            }));
        }

        showMessage("Profile updated successfully!", "success");
        document.getElementById("new-password").value = '';
        document.getElementById("confirm-password").value = '';
    } catch (error) {
        showMessage(error.message, "error");
    }
}