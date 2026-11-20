# Shan Elegance – School Transport & Hostel Management System (Skardu, Gilgit-Baltistan)

MERN stack: **React + Vite**, **Node/Express**, **MongoDB/Mongoose**, **Socket.io** (live bus tracking), **Leaflet + OpenStreetMap** (map of Skardu).
All money is in **PKR (Rs)**, dates are **DD-MM-YYYY**, timezone **Asia/Karachi**.

## What's inside
| Role | Who (demo) | Can do |
|---|---|---|
| ADMIN | **Shan Elegance** | Everything: dashboard, buses/drivers, students, staff, hostel, fees, menu |
| WARDEN | Muhammad Ibrahim (1) | Students, 30 hostel rooms, fees, mess menu, live map |
| DRIVER | Ghulam Abbas, Muhammad Hussain, Ali Raza (3 drivers → 3 buses) | See route + riders, share live GPS |
| STUDENT | 24 sample students | Own bus tracking, room, fees, menu |

* **3 buses / routes** around Skardu (Satpara Road, Gamba–Hussainabad–Yadgar Chowk, Airport Road–Kachura Road–Bazaar).
* **30 hostel rooms** (3 floors × 10; 2/3/4-bed rooms, Rs 14,000 / 12,000 / 10,000 per bed).
* **Fees** in Rs: mess Rs 8,000, winter heating Rs 2,500 (Nov–Mar), bus Rs 3,500–5,000. Edit in `backend/config/fees.js` and the seed.
* **Mess menu** with Balti dishes (khambir, prapu, mamtu, gur-gur cha…).
* **Live map**: drivers broadcast GPS from their phone; with `SIMULATE_BUSES=true` buses drive their routes automatically so the demo is always alive.

## Run locally
```bash
# 1) Backend
cd backend && cp .env.example .env      # set JWT_SECRET + MONGO_URI
npm install
npm run seed:demo                       # or: npm run seed:admin (admin only)
npm run dev                             # http://localhost:5000

# 2) Frontend
cd ../frontend && cp .env.example .env
npm install && npm run dev              # http://localhost:5173
```
Demo logins (after `seed:demo`): `admin@shanelegance.pk / ChangeMe@123` (from your `.env`), `warden@shanelegance.pk`, `driver1@…driver3@shanelegance.pk`, `se-001@student.shanelegance.pk` … all with `Skardu@123`.

## Deploy
* **Database**: MongoDB Atlas → copy connection string to `MONGO_URI`.
* **Backend** (Render, Node web service, root `backend`, start `npm start`): set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel/Netlify URL), `ADMIN_*`; run `npm run seed:admin` once in the Render shell. Set `SIMULATE_BUSES=false` in production.
* **Frontend** (Vercel/Netlify, root `frontend`, build `npm run build`, output `dist`): set `VITE_API_URL` to the Render URL. Add an SPA rewrite to `index.html`.

## Notes
* Stop/school coordinates are **approximate** – correct them in `backend/seed/demo.js` and `backend/config/fees.js` (+ `frontend/src/constants.js`) using Google Maps.
* Drivers must open the site over **HTTPS** for browser GPS to work.
* Change every default password before going live.
