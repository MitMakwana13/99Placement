// This script runs in the context of the web page (LinkedIn or Indeed)

(() => {
  const url = window.location.href;
  let data = {
    name: "",
    role: "",
    location: "",
    summary: "",
    source: "Social"
  };

  try {
    if (url.includes("linkedin.com/in/")) {
      data.source = "Social";
      
      // LinkedIn DOM selectors (these change frequently, but these are standard fallbacks)
      const nameEl = document.querySelector('h1');
      if (nameEl) data.name = nameEl.innerText.trim();

      const roleEl = document.querySelector('div.text-body-medium.break-words');
      if (roleEl) data.role = roleEl.innerText.trim().split(" at ")[0];

      const locEl = document.querySelector('span.text-body-small.inline.t-black--light.break-words');
      if (locEl) data.location = locEl.innerText.trim();

      const aboutEl = document.querySelector('div#about ~ div.display-flex .visually-hidden');
      if (aboutEl) {
        data.summary = aboutEl.innerText.trim();
      } else {
        data.summary = data.role + " based in " + data.location;
      }
    } 
    else if (url.includes("indeed.com")) {
      data.source = "Portal";
      
      // Indeed resume selectors
      const nameEl = document.querySelector('.resume-ContactInformation-heading h1') || document.querySelector('h1');
      if (nameEl) data.name = nameEl.innerText.trim();

      const roleEl = document.querySelector('.resume-Headline');
      if (roleEl) data.role = roleEl.innerText.trim();

      const locEl = document.querySelector('.resume-ContactInformation-location');
      if (locEl) data.location = locEl.innerText.trim();

      data.summary = "Sourced from Indeed Resume.";
    }
  } catch (e) {
    console.error("Error parsing profile:", e);
  }

  // Only return if we found at least a name
  if (data.name) {
    return data;
  }
  return null;
})();
