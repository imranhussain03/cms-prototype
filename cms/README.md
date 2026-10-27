# Innomick Technologies - Contract Management System (CMS) Prototype

This is the standalone **Contract Management System (CMS)** prototype for Innomick Technologies.

## 🚀 How to Run

You can run this prototype independently using any of the following methods:

### Method 1: Using Node.js (Recommended)
```bash
# Navigate to the folder if you are not already in it
npm start
# or
node server.js
```
The prototype will be live at:
👉 **[http://localhost:3001](http://localhost:3001)**

*(To run on port 3000 instead, set PORT: `PORT=3000 node server.js`)*

### Method 2: Direct Browser File (No server required)
Simply double-click [`index.html`](index.html) or open it directly in Google Chrome, Microsoft Edge, or any modern web browser.

### Method 3: Live Server / Any HTTP Server
You can serve this folder with any static web server:
```bash
npx serve .
# or VS Code Live Server extension
```

---

## 📁 File Structure
- [`index.html`](index.html) - Main SharePoint-styled CMS application interface (Contract Lifecycle, Approvals, Templates, Excel Bulk Ingestion)
- [`index2.html`](index2.html) - Backward-compatibility alias for index.html
- [`cms_style.css`](cms_style.css) - Enterprise Teal SharePoint styling, stat cards, Copilot pill, and responsive layouts
- [`cms_app.js`](cms_app.js) - CMS interactive behavior, route switching, contract creation modal, template designer, Excel import workflow
- [`cms_data.js`](cms_data.js) - Preloaded contract repositories, vendor databases, template libraries, and approval logs
- `assets/` - Brand logos (`innomick_logo_horizontal.png`, `innomick_logo_square.png`)
- `screenshots/` - Captured reference screenshots and feature walkthroughs
- `server.js` - Zero-dependency Node.js HTTP web server (default port: 3001)
- `package.json` - Node project scripts (`npm start`)
