// Supabase Credentials
const SUPABASE_URL = "https://vftfiwzifecxooklbfrl.supabase.co";
const SUPABASE_KEY = "sb_publishable_tZGVPnUWlyGc7uRoZ3Coug_ikVpy2HW";

document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loading");
  const errorMsg = document.getElementById("error");
  const successMsg = document.getElementById("success");
  const form = document.getElementById("candidate-form");
  const submitBtn = document.getElementById("submit-btn");

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject the content script
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_script.js"]
    });

    if (result && result.name) {
      // Hide loading, show form
      loading.classList.add("hidden");
      form.classList.remove("hidden");

      // Populate form
      document.getElementById("name").value = result.name || "";
      document.getElementById("role").value = result.role || "";
      document.getElementById("location").value = result.location || "";
      document.getElementById("summary").value = result.summary || "";
      document.getElementById("source").value = result.source || "Social";
      
      // Basic heuristics for experience from summary
      let exp = 0;
      if (result.summary && result.summary.toLowerCase().includes("senior")) exp = 5;
      if (result.role && result.role.toLowerCase().includes("senior")) exp = 5;
      document.getElementById("experience").value = exp;

    } else {
      loading.classList.add("hidden");
      errorMsg.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    loading.classList.add("hidden");
    errorMsg.classList.remove("hidden");
  }

  // Handle Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Importing...";

    const name = document.getElementById("name").value;
    const role = document.getElementById("role").value;
    const location = document.getElementById("location").value;
    const experience = parseInt(document.getElementById("experience").value) || 0;
    const skills = document.getElementById("skills").value.split(",").map(s => s.trim()).filter(s => s);
    const summary = document.getElementById("summary").value;
    const source = document.getElementById("source").value;

    const payload = {
      name,
      initials: name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase(),
      role,
      location,
      experience,
      skills: skills.length ? skills : ["General"],
      source,
      stage: "sourced",
      notice_days: 30,
      expected_ctc: 0,
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
      phone: "",
      summary: summary.substring(0, 500)
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/candidates`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to insert candidate");
      }

      form.classList.add("hidden");
      successMsg.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alert("Error saving candidate to Supabase!");
      submitBtn.disabled = false;
      submitBtn.textContent = "Import to 99Placement";
    }
  });
});
