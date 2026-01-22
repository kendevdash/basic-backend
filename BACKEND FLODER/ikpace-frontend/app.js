const API_URL = "http://localhost:8000";

// Modal controls
function showAuthModal(tab) {
  document.getElementById("authModal").style.display = "flex";
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById("authModal").style.display = "none";
}

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(form => form.classList.remove("active"));

  if (tab === "login") {
    document.querySelectorAll(".auth-tab")[0].classList.add("active");
    document.getElementById("loginForm").classList.add("active");
  } else {
    document.querySelectorAll(".auth-tab")[1].classList.add("active");
    document.getElementById("signupForm").classList.add("active");
  }
}

/* ================= SIGNUP API ================= */

document.getElementById("signupForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: name,
        email: email,
        password: password
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Account created successfully!");
      closeAuthModal();
      console.log("Backend response:", data);
    } else {
      alert(data.message || "Signup failed");
    }

  } catch (error) {
    console.error(error);
    alert("Backend not reachable. Make sure server is running.");
  }
});

/* ================= LOGIN (placeholder) ================= */

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  alert("Login API coming next step 👍");
});
