# 💰 Web Expense Tracker (肥蟲記賬本 🐛)

A responsive, full-stack expense tracking web application featuring a modern Glassmorphism UI, real-time cloud synchronization, and interactive data visualization. 

這是一款具備現代化「毛玻璃 (Glassmorphism)」介面設計的全端記帳網頁應用，支援雲端即時同步、中英語言與圖表分析功能。

---

## ✨ Key Features (核心功能)

* **🔐 Secure Google Login:** User authentication powered by Firebase Auth (OAuth 2.0).
* **☁️ Real-time Cloud Sync:** CRUD operations seamlessly synced across multiple devices using Firebase Cloud Firestore (NoSQL).
* **🎨 Glassmorphism UI & Theming:** Modern frosted-glass design with seamless Dark/Light mode switching.
* **🌐 Bilingual Support (i18n):** One-click toggle between English and Traditional Chinese (繁體中文).
* **📊 Interactive Analytics:** Dynamic doughnut charts powered by Chart.js for expense and income source analysis.
* **🖼️ Customization:** Users can upload custom background images saved via local storage mechanisms.
* **📄 Detailed Reports:** A dedicated, filterable transaction history page with custom date-range queries.

## 🛠️ Tech Stack (技術架構)

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Backend / BaaS:** Google Firebase (Authentication, Cloud Firestore)
* **Data Visualization:** Chart.js
* **Architecture:** Component-based UI logic, Asynchronous JS (`async`/`await`) for cloud operations, separation of concerns (HTML/CSS/JS).
