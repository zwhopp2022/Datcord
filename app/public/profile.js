document.addEventListener("DOMContentLoaded", async () => {
  await populateProfileFields();

  // Add event listener to save button after DOM is loaded
  const saveButton = document.getElementById("save-btn");
  if (saveButton) {
      saveButton.addEventListener("click", saveProfileData);
  } else {
      console.error("Save button not found in the DOM.");
  }
});


async function populateProfileFields() {
  const username = "johndoe";  // replace this with the current logged-in username
  try {
      const response = await fetch(`http://localhost:3000/get-user?username=${username}`);
      if (!response.ok) throw new Error("User data could not be fetched");

      const data = await response.json();
      document.getElementById("username").value = data.username;
      document.getElementById("bio").value = data.bio;
      document.getElementById("status").value = data.status;
  } catch (error) {
      console.error("Error fetching user data:", error);
  }
}

function scrapeProfileData() { // scrape profile data from input fields
  return {
      username: document.getElementById("username").value,
      bio: document.getElementById("bio").value,
      status: document.getElementById("status").value,
  };
}

async function saveProfileData() { // save profile data to server
  const updatedData = scrapeProfileData();

  try {
      const response = await fetch("http://localhost:3000/modify-user", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Profile could not be updated");

      alert("Profile updated successfully!");
  } catch (error) {
      console.error("Error saving profile data:", error);
      alert("Failed to update profile.");
  }
}
