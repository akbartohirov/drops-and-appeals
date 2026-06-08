const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const appealRoutes = require("./routes/appealRoutes");
const dropCardRoutes = require("./routes/dropCardRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fraudRoutes = require("./routes/fraudRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/appeals", appealRoutes);
app.use("/api/drop-cards", dropCardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fraud", fraudRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Serve Static Frontend files from dist
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use("/upload_files", express.static(path.join(__dirname, "upload_files")));

// Catch-all route to serve React index.html for client-side routing (SPA support)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Tizimda ichki xatolik yuz berdi!" });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda.`);
});
