document.addEventListener("DOMContentLoaded", async () => {
  await populateProfileFields();

  document.getElementById("save-btn").addEventListener("click", saveProfileData);
});

async function fetchUser(username) {
  try {
      const response = await fetch(`http://localhost:3000/get-user?username=${username}`);
      if (!response.ok) throw new Error('Failed to fetch current user data');
      return await response.json();
  } catch (error) {
      showMessage('Error fetching user data', 'error');
      return null;
  }
}

async function populateProfileFields() {
  const username = "johndoe"; // placeholder
  const currentUser = await fetchUser(username);

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
    const username = "johndoe"; // current username (placeholder)
    const currentUser = await fetchUser(username);
    if (!currentUser) {
        showMessage("Failed to fetch user data", "error");
        return;
    }

    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Check if passwords match if a new password was entered
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            showMessage("New passwords do not match!", "error");
            return;
        }
    }

    // create an updated user object with the correct format
    const updatedUser = {
        username: username, // original username for reference
        updatedUsername: document.getElementById("username").value || currentUser.username,
        updatedPassword: newPassword || null,  // Only send password if it's being changed
        updatedBio: document.getElementById("bio").value || currentUser.bio,
        updatedStatus: document.getElementById("status").value || currentUser.status,
        updatedDate: document.getElementById("birthday").value.split('-') // convert date string to array
    };

    try {
        const response = await fetch('http://localhost:3000/modify-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updatedUser)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving profile data');
        }
        
        showMessage("Profile updated successfully!", "success");
        
        // Clear password fields after successful update
        document.getElementById("new-password").value = '';
        document.getElementById("confirm-password").value = '';
    } catch (error) {
        showMessage(error.message, "error");
    }
}