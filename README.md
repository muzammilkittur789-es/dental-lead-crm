# Dental Lead Finder & CRM

A responsive, privacy-first web application designed to help freelance web developers and digital agencies discover dental clinics across Indian cities, identify clinics needing a modern website, and systematically manage sales outreach.

---

## 🌟 Key Features

1. **Free & Offline-First (No API Keys or Paid Services)**
   - Operates 100% locally in the browser using **IndexedDB**.
   - No backend required, zero tracking, zero monthly costs, and no third-party API dependencies.

2. **Manual Google Maps Discovery Workflow**
   - Select popular Indian cities (Mumbai, Bengaluru, Delhi NCR, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, etc.) or type any custom city and locality.
   - One-click **"Search on Google Maps"** launches live Google Maps with the targeted query `dental clinics in <locality>, <city>` in a new tab.
   - Quickly verify whether a clinic has an active website, an outdated profile, or no website at all.
   - Fast Lead Capture form with pre-filled city and locality to instantly record new leads into your CRM.

3. **Intelligent Duplicate Detection**
   - Real-time normalization of clinic names (stripping dental stop words like "dental clinic", "hospital", "care", "dr") and phone numbers (standardizing Indian `+91`, `0`, and STD codes).
   - Warns before saving if a similar clinic or phone number already exists in your CRM database.
   - Option to review the existing record, adjust details, or save anyway.

4. **Actionable Sales Dashboard**
   - 7 primary clickable metrics:
     - **Total clinics saved**
     - **Clinics without a website** (Primary sales targets)
     - **Clinics to call**
     - **Calls completed**
     - **Follow-ups due**
     - **Interested prospects**
     - **Websites sold**
   - Clicking any metric immediately filters the clinic management directory.
   - Quick preview of urgent follow-ups and high-priority prospects without websites.

5. **Clinic Directory & Advanced Management Table**
   - Search across clinic name, city, locality, phone number, and outreach notes.
   - Filters for City, Locality, Website Status, Sales Status, and Follow-up Schedule.
   - Quick-toggle pills for **"Clinics Without Website"** and **"Follow-ups Due Today/Overdue"**.
   - Sort by clinic name (A-Z/Z-A), date added (newest/oldest), or follow-up date (soonest/latest).
   - Clickable `tel:` phone links for instant dialing on mobile and desktop.
   - Direct external links to Google Maps listing and clinic website (if present).
   - CRUD modals: View complete history, edit details, and delete with safety confirmation.

6. **Sales Outreach Follow-up Pipeline**
   - Dedicated follow-up planner organizing leads into **Overdue**, **Due Today**, **Upcoming (Next 7 Days)**, and **Future**.
   - Quick actions directly on cards: 1-click **Mark Called**, reschedule follow-up date, and direct dialing.

7. **Data Backup & Restore**
   - **CSV Export**: RFC 4180 compliant with UTF-8 BOM encoding for seamless opening in Microsoft Excel and Google Sheets.
   - **Full JSON Backup**: Complete snapshot of all records, timestamps, and notes.
   - **JSON Import**: Schema validation and duplicate conflict resolution (Skip duplicates, Overwrite existing, or Import all).
   - **Database Health & Safety**: Storage usage statistics and safety confirmation dialog (requiring typing `DELETE ALL`) before clearing records.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or newer recommended, verified on Node v24)
- npm

### Installation & Launch

```bash
# 1. Navigate to the project directory
cd "C:\Users\Lenovo\.gemini\antigravity\scratch\dental-lead-crm"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start local development server
npm run dev
```

The app will start at `http://localhost:5173/` (or next available port). Open this URL in any modern web browser.

### Run Automated Tests

To run the core logic test suite (validating phone normalization, name normalization, string similarity, duplicate detection, CSV escaping, and JSON import validation):

```bash
npm test
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8 + tsx
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Storage**: Browser IndexedDB (with localStorage backup reminder tracking)
- **Zero External Backend / APIs**: Completely free and private to run locally.
