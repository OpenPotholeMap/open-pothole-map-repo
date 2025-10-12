# 🚧 OpenPotholeMap

<p align="center">
  <img width="291" height="629" alt="Dashboard" src="https://github.com/user-attachments/assets/d8d54853-aa08-47f7-ab99-bc1b25339333" />
</p>
<br />
<p align="center">
  <img width="290" height="627" alt="Map" src="https://github.com/user-attachments/assets/1562d1d5-1119-442b-a019-78dd260cf1d2" />
</p>
<br />
<p align="center">
  <img width="293" height="632" alt="Pothole" src="https://github.com/user-attachments/assets/6eeb5139-b38b-40df-b3f7-56d196c7d224" />
</p>


## 🫳 **What it does** 

OpenPotholeMap is a crowdsourced pothole mapping system. Using a phone camera and AI, it detects potholes in real time, logs them to a central database, and visualizes them on a live interactive map. Drivers get instant alerts (“⚠ Pothole 50m ahead”), and admins can verify reports or export data to authorities.  

---

## 👊 **How we built it**  
- **Backend:** Node.js + Express, MongoDB (Mongoose), Socket.io for real-time events, Roboflow Universe for detection, Firebase Auth + JWT for login.  
- **Frontend:** React + TypeScript + Vite, Google Maps integration, camera streaming with WebSockets, REST + Socket.io clients.  
- **Infra:** GitHub Actions for CI/CD, hosting via Vercel, cloud inference via Roboflow.  

---

## 💪 **Challenges we ran into**  
- Keeping video streaming stable while sending frames at a usable rate.  
- Tuning the AI model confidence threshold \(p > 0.6\) to reduce false positives.  
- Matching detections with GPS coordinates reliably.  
- Designing a scalable geospatial data model that avoids duplicate entries.  

---

## 🙌 **Accomplishments we’re proud of**  
- A working end-to-end pipeline: camera → AI → DB → live map → alerts.  
- Clean Google Maps–like UI that feels intuitive.  
- Admin dashboard and verification tools for data integrity.  
- Bridging AI and geospatial mapping into a real safety tool.  

---

## 🫶 **What we learned**  
- Real-time distributed system design is harder than it looks.  
- Best practices in WebSocket communication, rate limiting, and recovery.  
- Handling geospatial queries and data visualization at scale.  
- Trade-offs between cloud inference and edge AI deployment.  

---

## 🤞 **What’s next**  
- Detect more hazards (speed bumps, flooding, debris).  
- Add gamification for user engagement.  
- Direct integration with FDOT/authority APIs for repair reporting.  
- Native mobile app for better performance.  
- On-device inference to cut latency and cloud costs.  
