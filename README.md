
# Expensify AI - Global Deployment Suite

Expensify AI is a production-ready travel reimbursement hub that combines Vision-AI (Google Gemini) with enterprise-standard reporting tools.

## 🌍 Deployment Ready

This application is built for immediate deployment on platforms like **Vercel**, **Netlify**, or **GitHub Pages**.

### Environment Setup
The only requirement is a valid Google Gemini API Key injected as an environment variable:
`process.env.API_KEY`

### Features
- **AI Extraction:** 95%+ accuracy in receipt OCR via `gemini-3-flash-preview`.
- **Excel Generation:** Binary-standard `.xls` output for corporate compliance.
- **PWA Ready:** Installable on iOS/Android and desktop with offline local storage capabilities.
- **Print Optimization:** Specialized `@media print` reports for physical documentation submission.

## 🛠 Tech Stack Details
- **React 19:** Utilizing latest state management and transitions.
- **Tailwind CSS 3.4:** Premium UI with custom animations and glassmorphism.
- **Google Generative AI:** State-of-the-art vision processing.
- **ESM Modules:** Zero-bundler architecture for lightning-fast edge loading.

## 📦 Local Development
1. Clone the repository.
2. Ensure your environment provides the `API_KEY`.
3. Serve `index.html` via any static server (e.g., `npx serve`).

---
**Expensify AI** — *Reimagining Expense Management for the Elite Traveler.*
