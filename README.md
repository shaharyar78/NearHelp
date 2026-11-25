# 📍 NearHelp

> **Find the help you need, right around you.**

[![Live Demo](https://img.shields.io/badge/Live-Web_App-blue?style=flat-square)](https://near-by-help-1.onrender.com)
[![Download APK](https://img.shields.io/badge/Download-Android_APK-green?style=flat-square&logo=android)](https://github.com/shaharyar78/NearHelp/releases/tag/1.0)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Render](https://img.shields.io/badge/Hosted_on-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)

NearHelp helps people explore useful nearby places, view available results on a map, and suggest missing community locations for review.

**🔗 Live Web App:** [near-by-help-1.onrender.com](https://near-by-help-1.onrender.com)  
**📱 Android App:** [Download APK](https://github.com/shaharyar78/NearHelp/releases/tag/1.0) *(Built with Capacitor)*

---

## 📸 App Preview

> *(Add a screenshot of the map or AI chat here)*

<p align="center">
  <img src="screenshots/nearhelp-preview.png" alt="NearHelp App Preview" width="300">
</p>

---

## ✨ Features

- 🔍 **Search nearby places** by category
- 🗺️ **Interactive map** (Leaflet & OpenStreetMap)
- 📍 **View place details**
- 🤖 **AI Assistant** to ask questions (Powered by OpenRouter)
- 👤 **User accounts** (Sign up, login, manage profile)
- 💬 **Real-time Chat** with other registered members
- ➕ **Suggest a place** for admin review
- 🛡️ **Admin dashboard** for managing places and users

*Note: Place availability depends on geographic map data, which may be incomplete or out of date.*

---

## 🛠️ Built With

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express |
| **Frontend** | HTML · CSS · JavaScript |
| **Database & Auth** | Supabase (PostgreSQL) |
| **Maps** | Leaflet · OpenStreetMap |
| **Places Data** | Geoapify Places API |
| **AI Assistant** | OpenRouter API |
| **Mobile App** | Capacitor · Android Studio (APK) |
| **Hosting** | Render |

---

## 📁 Project Structure

```text
nearhelp/
├── server.js
├── src/
│   ├── routes/          # Express API routes
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth & validation
│   ├── utils/           # Helper functions
│   └── db/              # Database connections
├── public/
│   ├── *.html           # Frontend pages
│   ├── css/
│   ├── js/
│   └── assets/
├── android/             # Capacitor Android project
├── sql/                 # Supabase SQL setup files
└── docs/
