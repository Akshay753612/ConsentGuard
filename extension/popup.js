const analyzeButton = document.getElementById("analyze-button");
const statusMessage = document.getElementById("status");
const resultsSection = document.getElementById("results");
const fieldRows = document.getElementById("field-rows");
const fieldCount = document.getElementById("field-count");
const pageName = document.getElementById("page-name");
const jsonOutput = document.getElementById("json-output");
const jsonCode = jsonOutput.querySelector("code");
const toggleJsonButton = document.getElementById("toggle-json");
const copyJsonButton = document.getElementById("copy-json");

let latestPayload = null;

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

// Runs inside the active webpage. It returns field metadata only—never field values.
function extractFormMetadataFromPage() {
  const controls = Array.from(document.querySelectorAll("input, select, textarea"));
  const fields = controls
    .filter((element) => {
      const type = (element.getAttribute("type") || element.tagName.toLowerCase()).toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) return false;
      if (element.disabled) return false;
      return true;
    })
    .map((element, index) => {
      const associatedLabel = element.labels && element.labels.length
        ? Array.from(element.labels).map((label) => label.innerText.trim()).filter(Boolean).join(" ")
        : "";
      const nearbyLabel = element.closest("label")?.innerText?.trim() || "";
      const label = associatedLabel || nearbyLabel || element.getAttribute("aria-label") || element.getAttribute("name") || element.id || element.getAttribute("placeholder") || `Field ${index + 1}`;
      const fieldType = element.tagName.toLowerCase() === "input"
        ? (element.getAttribute("type") || "text").toLowerCase()
        : element.tagName.toLowerCase();

      return {
        label: label.replace(/\s+/g, " ").slice(0, 160),
        name: element.getAttribute("name") || "",
        id: element.id || "",
        type: fieldType,
        placeholder: element.getAttribute("placeholder") || "",
        required: element.required || element.getAttribute("aria-required") === "true"
      };
    });

  return {
    website: window.location.hostname,
    pageTitle: document.title,
    pageUrl: window.location.origin + window.location.pathname,
    extractedAt: new Date().toISOString(),
    fields
  };
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

function renderResults(payload) {
  fieldRows.replaceChildren();
  payload.fields.forEach((field) => {
    const row = document.createElement("tr");
    addCell(row, field.label || field.name || "Unlabelled field");
    addCell(row, field.type);
    addCell(row, field.required ? "Yes" : "No");
    fieldRows.appendChild(row);
  });

  fieldCount.textContent = `${payload.fields.length} field${payload.fields.length === 1 ? "" : "s"}`;
  pageName.textContent = `${payload.website} · ${payload.pageTitle || "Untitled page"}`;
  jsonCode.textContent = JSON.stringify(payload, null, 2);
  resultsSection.classList.remove("hidden");
}

analyzeButton.addEventListener("click", async () => {
  analyzeButton.disabled = true;
  setStatus("Inspecting the active tab…");
  resultsSection.classList.add("hidden");
  jsonOutput.classList.add("hidden");
  toggleJsonButton.textContent = "View JSON";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("No active tab was found.");

    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFormMetadataFromPage
    });
    const payload = injectionResults?.[0]?.result;
    if (!payload) throw new Error("The page did not return form metadata. Try refreshing the page.");

    latestPayload = payload;
    renderResults(payload);
    if (payload.fields.length === 0) {
      setStatus("No supported form fields were found on this page. Try a registration page.");
    } else {
      setStatus("Scan complete. Only field metadata was collected; entered values were not read.");
    }
  } catch (error) {
    const message = error?.message || "An unexpected error occurred.";
    setStatus(`Could not inspect this page: ${message}`, true);
  } finally {
    analyzeButton.disabled = false;
  }
});

toggleJsonButton.addEventListener("click", () => {
  const willShow = jsonOutput.classList.contains("hidden");
  jsonOutput.classList.toggle("hidden", !willShow);
  toggleJsonButton.textContent = willShow ? "Hide JSON" : "View JSON";
});

copyJsonButton.addEventListener("click", async () => {
  if (!latestPayload) {
    setStatus("Analyze a page before copying JSON.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(latestPayload, null, 2));
    setStatus("JSON copied to clipboard.");
  } catch {
    setStatus("Clipboard access failed. Use View JSON and copy the text manually.", true);
  }
});