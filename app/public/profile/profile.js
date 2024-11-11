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
      console.error('Error fetching current user:', error);
      return null;
  }
}

async function populateProfileFields() {
  const username = "johndoe"; // placeholder
  const currentUser = await fetchUser(username);

  if (!currentUser) return;

  document.getElementById("username").value = currentUser.username || '';
  document.getElementById("bio").value = currentUser.bio || '';
  document.getElementById("status").value = currentUser.status || '';
  
  // convert the date string to array format if it exists
  if (currentUser.birthday) {
      const date = new Date(currentUser.birthday);
      document.getElementById("birthday").value = [
          date.getFullYear(),
          (date.getMonth() + 1).toString().padStart(2, '0'),
          date.getDate().toString().padStart(2, '0')
      ].join('-');
  }
}

async function saveProfileData() {
  const username = "johndoe"; // current username (placeholder)
  const currentUser = await fetchUser(username);
  if (!currentUser) return;

  // create an updated user object with the correct format
  const updatedUser = {
      username: username, // original username for reference
      updatedUsername: document.getElementById("username").value || currentUser.username,
      updatedHashedPassword: currentUser.hashedPassword,
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
      console.log('Profile updated successfully!');
  } catch (error) {
      console.error('Error saving profile data:', error);
  }
}