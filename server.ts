import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory fleet state
let fleet = [
  { id: 'MED-100', type: 'Organ Transport', destination: 'St. Jude Medical', status: 'In Transit', eta: '8 mins' },
  { id: 'MED-101', type: 'Blood Supply', destination: 'City General', status: 'Loading', eta: '15 mins' },
  { id: 'MED-102', type: 'Emergency Plasma', destination: 'Central Hospital', status: 'In Transit', eta: '4 mins' },
  { id: 'MED-103', type: 'Critical Equipment', destination: 'North Clinic', status: 'In Transit', eta: '12 mins' },
  { id: 'MED-104', type: 'Blood Supply', destination: 'East Medical Center', status: 'Loading', eta: '20 mins' },
  { id: 'MED-105', type: 'Organ Transport', destination: 'West Surgical', status: 'In Transit', eta: '6 mins' },
  { id: 'MED-106', type: 'Medicine Delivery', destination: 'Childrens Hospital', status: 'In Transit', eta: '10 mins' },
  { id: 'MED-107', type: 'Emergency Plasma', destination: 'Trauma Center', status: 'Loading', eta: '18 mins' },
  { id: 'MED-108', type: 'Blood Supply', destination: 'General Clinic', status: 'In Transit', eta: '5 mins' },
  { id: 'MED-109', type: 'Organ Transport', destination: 'Heart Institute', status: 'In Transit', eta: '9 mins' },
];

// Mock Healthcare Logistics Data API
app.get("/api/logistics/status", (req, res) => {
  // Sub-metrics for formulas
  const trafficRisk = (0.2 + Math.random() * 0.5);
  const weatherRisk = (0.05 + Math.random() * 0.2);
  const historicalDelayRate = 0.18;
  const incidentDensity = (Math.random() * 0.4);

  const emergencyLevel = (0.6 + Math.random() * 0.4);
  const timeSensitivity = (0.7 + Math.random() * 0.3);
  const criticalSupplyFactor = (0.5 + Math.random() * 0.5);

  // Formulas
  const delayRiskScore = (
    (trafficRisk * 0.4) + 
    (weatherRisk * 0.3) + 
    (historicalDelayRate * 0.2) + 
    (incidentDensity * 0.1)
  );

  const medicalPriorityScore = (
    (emergencyLevel * 0.5) + 
    (timeSensitivity * 0.3) + 
    (criticalSupplyFactor * 0.2)
  );
  
  res.json({
    trafficRisk,
    weatherRisk,
    historicalDelayRate,
    incidentDensity,
    delayRiskScore: parseFloat(delayRiskScore.toFixed(2)),
    emergencyLevel,
    timeSensitivity,
    criticalSupplyFactor,
    medicalPriorityScore: parseFloat(medicalPriorityScore.toFixed(2)),
    modelVersion: "2.2.0-HC-CORE",
    accuracy: "94.8%",
    activeFleets: fleet.length,
    onTimeRate: "98.4%"
  });
});

app.get("/api/logistics/fleet", (req, res) => {
  res.json(fleet);
});

app.post("/api/logistics/dispatch", (req, res) => {
  const newId = `MED-${100 + fleet.length}`;
  const types = ['Organ Transport', 'Blood Supply', 'Emergency Plasma', 'Medicine Delivery'];
  const destinations = ['Central General', 'St. Jude Medical', 'City Hospital', 'Trauma Center'];
  
  const newUnit = {
    id: newId,
    type: types[Math.floor(Math.random() * types.length)],
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    status: 'In Transit',
    eta: `${Math.floor(Math.random() * 20) + 5} mins`
  };
  
  fleet = [newUnit, ...fleet];
  res.json(newUnit);
});

app.get("/api/logistics/routes", (req, res) => {
  res.json([
    {
      id: "route-alpha",
      name: "Medical Emergency Corridor (Alpha)",
      distance: "8.2 km",
      baseTime: 12, // minutes
      riskFactor: 0.1, // Multiplier for delay risk
      priorityPenalty: 0, // Penalty for medical urgency
      color: "#10b981",
      priority: "Critical"
    },
    {
      id: "route-gamma",
      name: "Bypass Expressway (Gamma)",
      distance: "12.4 km",
      baseTime: 15,
      riskFactor: 0.05,
      priorityPenalty: 5,
      color: "#0ea5e9",
      priority: "Critical"
    },
    {
      id: "route-beta",
      name: "Standard Urban Route (Beta)",
      distance: "7.5 km",
      baseTime: 28, // minutes
      riskFactor: 0.8,
      priorityPenalty: 15, // High penalty for standard routes in medical context
      color: "#f59e0b",
      priority: "Standard"
    },
    {
      id: "route-delta",
      name: "Residential Backroads (Delta)",
      distance: "6.8 km",
      baseTime: 35,
      riskFactor: 0.4,
      priorityPenalty: 20,
      color: "#64748b",
      priority: "Standard"
    }
  ]);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
