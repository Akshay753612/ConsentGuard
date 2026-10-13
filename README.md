# ConsentGuard

ConsentGuard is an AI-powered privacy assistant that helps users understand and minimize unnecessary personal-data disclosure before submitting online forms.

## Chrome extension prototype

This first prototype demonstrates the browser-extension layer: it inspects form controls on the active page and displays field metadata as a table and JSON. It does **not** yet perform DPDP/RAG analysis, generate aliases, or calculate a Privacy Score.

### Features
- Chrome Extension Manifest V3.
- User-triggered inspection of the active tab.
- Extracts field label, name, id, type, placeholder, and required status.
- Does not read or send values entered into form fields.
- Displays results in a table and JSON; JSON can be copied.
- Includes a demo registration form for testing.

### Load the extension
1. Download or clone this repository.
2. Open Chrome and visit `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the `extension` folder.
5. Open a normal webpage containing a form, click the ConsentGuard extension icon, and select **Analyze current page**.
6. To use the bundled demo, open `demo/demo-form.html` in Chrome. If Chrome blocks the extension from inspecting local files, enable **Allow access to file URLs** for ConsentGuard on `chrome://extensions`, then reopen the demo page.

### Privacy and limitations
- The extension runs only after the user clicks **Analyze current page**.
- It extracts metadata only. It intentionally does not access input values, checked states, or selected option values.
- The page URL is limited to the origin and path; query strings and fragments are omitted.
- Browser-internal pages and the Chrome Web Store cannot be inspected by extensions.
- Form detection is a prototype and may not detect controls rendered inside cross-origin iframes or some custom web components.
- No backend, LLM, ChromaDB, SQLite, or external API is connected yet.
- The categories and risk assessment described in the wider project are not part of this prototype. Do not present the prototype as a completed DPDP compliance checker.

### Project structure
```
extension/
  manifest.json
  popup.html
  popup.css
  popup.js
demo/
  demo-form.html
```

### Next milestone
Connect the extracted metadata to a FastAPI backend. The backend can retrieve relevant DPDP Act/Rules passages through RAG and return an explainable, context-aware assessment. Any Privacy Score should be computed using documented rules rather than invented by the language model.
