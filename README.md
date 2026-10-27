# Innomick Technologies - Contract Management System (CMS) Prototype

Enterprise Contract Management System (CMS) prototype designed for Innomick Technologies, providing comprehensive contract lifecycle management, approval routing, template authoring, and Excel bulk ingestion inside a modern Microsoft 365 / SharePoint style interface.

---

## 🚀 How to Run

### Option 1: From the Root Directory (Node.js)
```bash
npm start
```
The prototype will be live at:
👉 **[http://localhost:3001](http://localhost:3001)**

### Option 2: From the `cms/` Directory
```bash
cd cms
npm start
```

### Option 3: Direct Browser File (No Node.js or server required)
Simply double-click [`cms/index.html`](cms/index.html) or open it directly in Google Chrome, Microsoft Edge, or any modern web browser.

---

## 📁 Project Structure

- [`cms/index.html`](cms/index.html) - Main SharePoint-styled CMS application interface
- [`cms/cms_style.css`](cms/cms_style.css) - Enterprise Teal SharePoint styling, stat cards, Copilot pill, and responsive layouts
- [`cms/cms_app.js`](cms/cms_app.js) - CMS interactive behavior, route switching, contract creation modal, template designer, Excel import workflow
- [`cms/cms_data.js`](cms/cms_data.js) - Preloaded contract repositories, vendor databases, template libraries, and approval logs
- [`cms/assets/`](cms/assets/) - Brand logos (`innomick_logo_horizontal.png`, `innomick_logo_square.png`)
- [`cms/screenshots/`](cms/screenshots/) - Captured reference walkthroughs and UI verification screenshots
- [`cms/server.js`](cms/server.js) - Zero-dependency Node.js HTTP web server (default port: 3001)
- [`cms/package.json`](cms/package.json) - CMS-specific package configuration
- [`package.json`](package.json) - Root workspace script runner
