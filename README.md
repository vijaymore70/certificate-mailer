# Certificate Mailer 🎓✉️

**Certificate Mailer** is a production-ready, full-stack web application designed for event organizers to send personalized PDF certificates in bulk to participants via email. Powered by React, Vite, TypeScript, Tailwind CSS, and Google Apps Script (Gmail backend), it respects daily email sending quotas, auto-pauses when limits are hit, and allows seamless resumption without duplicate dispatches.

---

## 🌟 Key Features

1. **Multi-Event Workspaces**: Maintain separate participant lists, PDF certificates, email templates, and audit logs for multiple events (e.g. *Annual Seminar 2026*, *Computer Workshop 2026*).
2. **Flexible Import**: Ingest participant lists from **CSV** or **Excel (.xlsx, .xls)** spreadsheets with intelligent column mapping and pre-send data validation (missing names, invalid emails, duplicates).
3. **PDF Certificate Matching**: Drag-and-drop multiple PDF certificates or entire folders. Auto-matches using **Certificate ID** or **Participant Name**, with manual assignment override options.
4. **Personalized Email Templates**: Design custom HTML email templates using insertable tag chips (`{{name}}`, `{{email}}`, `{{certificate_id}}`, `{{event_name}}`, `{{registration_id}}`) with side-by-side live preview.
5. **Test Email Sender**: Send a sample email with attached PDF to your test inbox before initiating bulk runs.
6. **Quota-Aware Bulk Sending Engine**: Interrogates Google Apps Script `MailApp.getRemainingDailyQuota()`. Automatically pauses when the daily quota reaches 0, preserving remaining pending items for continuation on the next quota refresh.
7. **Resume & Retry System**: Easily resume pending dispatches after browser refresh/closure. Individually retry failed emails with detailed failure diagnostic logs.
8. **Comprehensive Audit Logs & CSV Export**: Real-time progress bar, status metrics, and one-click export of complete sending history to CSV.
9. **Zero-Secret Security**: No Gmail passwords or OAuth client secrets are stored or exposed in frontend code. All dispatches run through a secure Google Apps Script Web App URL.

---

## 📁 Repository Structure

```
certificate-mailer/
│
├── src/
│   ├── components/       # UI Components (Sidebar, Topbar, Modals, Tables, Drawers)
│   ├── context/          # EventContext state manager
│   ├── pages/            # Dashboard, Events, Import, Certificates, Preview, Template, Participants, History, Settings
│   ├── services/         # db (IndexedDB), gasService, parserService, matchingService, sendingEngine
│   ├── types/            # TypeScript data models
│   ├── utils/            # CSV exporter & validators
│   ├── App.tsx
│   └── main.tsx
│
├── google-apps-script/   # Backend Apps Script Files
│   ├── Code.gs           # Main doGet/doPost Web App router
│   ├── Config.gs         # Sheet names and structure
│   ├── EmailService.gs   # Gmail MailApp dispatcher & test sender
│   ├── ParticipantService.gs # Google Sheet logger
│   ├── CertificateService.gs # Drive folder file store (optional)
│   ├── QuotaService.gs   # MailApp.getRemainingDailyQuota wrapper
│   └── Utils.gs          # Template variable interpolator & JSON builder
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Local Development
1. Clone the repository and navigate into the directory:
   ```bash
   git clone https://github.com/your-username/certificate-mailer.git
   cd certificate-mailer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

### 2. Google Apps Script Backend Deployment

To send real emails using your Gmail or Google Workspace account:

1. Open [Google Apps Script Dashboard](https://script.google.com) and click **"New Project"**.
2. Copy the contents of `google-apps-script/Code.gs` (or copy all `.gs` files in `google-apps-script/`) into the Apps Script editor.
3. Click **Deploy > New deployment** in the top right.
4. Choose **Web app** as the deployment type.
5. Configure deployment settings:
   - **Description**: Certificate Mailer Backend
   - **Execute as**: `Me (your email address)`
   - **Who has access**: `Anyone` *(Required so your web application can send requests)*
6. Click **Deploy** and authorize the requested Gmail permissions when prompted.
7. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).
8. In the **Certificate Mailer** web app, navigate to **Settings**, paste your Web App URL, and click **Test Connection**.

---

### 3. Deploying to GitHub Pages

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Certificate Mailer application"
   git push origin main
   ```
2. Build the static distribution bundle:
   ```bash
   npm run build
   ```
3. Push the generated `dist/` folder to your repository's `gh-pages` branch, or configure GitHub Actions to automatically deploy the `dist/` build output.

---

## 📖 User Operating Workflow

1. **Create/Select an Event**: Go to **Events** and create your event (e.g. *MS-CIT Certificate Distribution 2026*).
2. **Import Participants**: Go to **Import Data**, upload your `.csv` or `.xlsx` file, map the spreadsheet columns (Name, Email, Certificate ID), and confirm import.
3. **Upload Certificates**: Go to **Upload Certificates** and drop your folder containing PDF files (`CERT001.pdf`, `Rahul_Patil.pdf`, etc.).
4. **Review Matching**: Go to **Matching Preview** to verify auto-matched pairs. Manually assign any unmatched files if needed.
5. **Customize Template & Send Test Email**: Go to **Email Template**, customize your subject and body using tag chips like `{{name}}`, then click **Send Test Email** to inspect the attachment in your inbox.
6. **Start Bulk Sending**: Go to **Participants & Send** and click **Start Bulk Sending**. The app dispatches emails sequentially while showing real-time progress.
7. **Daily Quota Handling**: If daily Gmail quotas are exhausted, the app automatically pauses dispatches safely. Simply return the next day and click **Resume Sending**.
8. **Export History**: Go to **Sending History** to review timestamps and export complete audit logs to CSV.

---

## 🔒 Security & Privacy

- **Zero Passwords / API Keys in Frontend**: No Gmail account credentials, client secrets, or service account keys exist in client code.
- **Client-Side Processing**: Excel/CSV files and PDF certificates are parsed locally in the user's browser using Web APIs and IndexedDB.
- **Safe Web App Requests**: API payloads sent to Apps Script use text-encoded JSON strings to prevent CORS issues without requiring dangerous permissions.

---

## 📄 License

Created by **Refresh Technology**. Distributed under the MIT License.
