import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Map as MapIcon, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  Bell, 
  Search,
  Navigation,
  CloudRain,
  Activity,
  Info,
  Zap,
  Clock,
  Stethoscope,
  Calendar,
  History,
  User,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { explainLogisticsRisk } from './services/geminiService';

// Types
interface LogisticsData {
  trafficRisk: number;
  weatherRisk: number;
  historicalDelayRate: number;
  incidentDensity: number;
  delayRiskScore: number;
  emergencyLevel: number;
  timeSensitivity: number;
  criticalSupplyFactor: number;
  medicalPriorityScore: number;
  modelVersion: string;
  accuracy: string;
  activeFleets: number;
  onTimeRate: string;
}

interface FleetUnit {
  id: string;
  type: string;
  destination: string;
  status: string;
  eta: string;
}

interface Route {
  id: string;
  name: string;
  distance: string;
  baseTime: number;
  riskFactor: number;
  priorityPenalty: number;
  color: string;
  priority: string;
}

const PERFORMANCE_DATA = [
  { time: '08:00', delay: 2, volume: 15 },
  { time: '10:00', delay: 4, volume: 22 },
  { time: '12:00', delay: 3, volume: 18 },
  { time: '14:00', delay: 8, volume: 25 },
  { time: '16:00', delay: 12, volume: 30 },
  { time: '18:00', delay: 5, volume: 20 },
  { time: '20:00', delay: 2, volume: 12 },
];

export default function App() {
  const [activeView, setActiveView] = useState('Command Center');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<LogisticsData | null>(null);
  const [fleet, setFleet] = useState<FleetUnit[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Consultations State
  const [consultations, setConsultations] = useState([
    { id: 1, doctor: 'Dr. Sarah Chen', date: '2026-02-20', type: 'Follow-up', status: 'Completed' },
    { id: 2, doctor: 'Dr. Marcus Thorne', date: '2026-01-15', type: 'Initial Consultation', status: 'Completed' },
  ]);
  const [isBooking, setIsBooking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Risk Simulation State
  const [precipLevel, setPrecipLevel] = useState(45); // 0-100
  const [congestionLevel, setCongestionLevel] = useState(78); // 0-100

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, routesRes, fleetRes] = await Promise.all([
        fetch('/api/logistics/status'),
        fetch('/api/logistics/routes'),
        fetch('/api/logistics/fleet')
      ]);
      const statusData = await statusRes.json();
      const routesData = await routesRes.json();
      const fleetData = await fleetRes.json();
      
      setData(statusData);
      setRoutes(routesData);
      setFleet(fleetData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  // Calculate optimization objective for each route
  const calculatedRoutes = routes.map(route => {
    if (!data) return null;
    const delayRisk = data.delayRiskScore * route.riskFactor;
    const objectiveValue = delayRisk + route.baseTime + route.priorityPenalty;
    return {
      ...route,
      delayRisk,
      objectiveValue,
      estTime: route.baseTime + (delayRisk * 10)
    };
  }).filter(Boolean) as any[];

  const recommendedRoute = calculatedRoutes.reduce((prev, curr) => 
    prev.objectiveValue < curr.objectiveValue ? prev : curr, 
    calculatedRoutes[0]
  );

  const timeSaved = Math.max(0, Math.round(calculatedRoutes.find(r => r.id !== recommendedRoute?.id)?.estTime - recommendedRoute?.estTime || 0));

  const handleAnalyze = async () => {
    if (!data || !recommendedRoute) return;
    setIsAnalyzing(true);
    const explanation = await explainLogisticsRisk({ 
      ...data, 
      recommendedRoute, 
      timeSaved,
      accuracy: data.accuracy
    });
    setAiExplanation(explanation || '');
    setIsAnalyzing(false);
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/logistics/dispatch', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Dispatch failed:', error);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveView('Medical Store');
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'Command Center':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Delay Risk Score" 
                value={data?.delayRiskScore.toFixed(2) || "0.00"} 
                subValue="/ 1.00" 
                trend="Calculated" 
                trendType="neutral"
                icon={<AlertTriangle className="text-amber-500" size={20} />}
              />
              <StatCard 
                title="Medical Priority" 
                value={data?.medicalPriorityScore.toFixed(2) || "0.00"} 
                subValue="/ 1.00" 
                trend="Clinical Urgency" 
                trendType="down"
                icon={<Zap className="text-rose-500" size={20} />}
              />
              <StatCard 
                title="On-Time Delivery" 
                value={data?.onTimeRate || "98.4%"} 
                trend="+0.3% vs avg" 
                trendType="up"
                icon={<Clock className="text-emerald-500" size={20} />}
              />
              <StatCard 
                title="Confidence" 
                value={data?.accuracy || "94.8%"} 
                trend="Model Reliability" 
                trendType="up"
                icon={<Activity className="text-sky-500" size={20} />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Performance Chart */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2 glass-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Transport Latency</h3>
                    <p className="text-sm text-slate-500">Medical delivery delay vs volume (24h)</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PERFORMANCE_DATA}>
                      <defs>
                        <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="delay" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDelay)" strokeWidth={2} />
                      <Area type="monotone" dataKey="volume" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Formula Panel */}
              <div className="glass-card flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={20} className="text-rose-600" />
                    Clinical Risk Engine
                  </h3>
                  <p className="text-sm text-slate-500">Formula-based risk assessment</p>
                </div>
                <div className="p-6 flex-1 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delay Risk Factors</h4>
                    <RiskMetric label="Traffic Risk (0.4)" value={data?.trafficRisk || 0} icon={<Navigation size={14} />} color="bg-amber-500" />
                    <RiskMetric label="Weather Risk (0.3)" value={data?.weatherRisk || 0} icon={<CloudRain size={14} />} color="bg-sky-500" />
                    <RiskMetric label="Incident Density (0.1)" value={data?.incidentDensity || 0} icon={<AlertTriangle size={14} />} color="bg-orange-500" />
                    
                    <div className="h-px bg-slate-100 my-4" />
                    
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Priority Factors</h4>
                    <RiskMetric label="Emergency Level (0.5)" value={data?.emergencyLevel || 0} icon={<Zap size={14} />} color="bg-rose-500" />
                    <RiskMetric label="Time Sensitivity (0.3)" value={data?.timeSensitivity || 0} icon={<Clock size={14} />} color="bg-rose-400" />
                    <RiskMetric label="Supply Factor (0.2)" value={data?.criticalSupplyFactor || 0} icon={<Truck size={14} />} color="bg-rose-300" />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg",
                        isAnalyzing 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                          Calculating Optimization...
                        </>
                      ) : (
                        <>
                          <Activity size={18} />
                          Generate Optimization Report
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Medical Fleet':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Active Medical Fleet</h3>
                <p className="text-sm text-slate-500">{data?.activeFleets || 0} units currently operational</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDispatch}
                disabled={isDispatching}
                className={cn(
                  "bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2",
                  isDispatching && "opacity-70 cursor-not-allowed"
                )}
              >
                {isDispatching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Truck size={18} />
                    Dispatch New Unit
                  </>
                )}
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fleet.map((unit, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                  key={unit.id} 
                  className="glass-card p-5 space-y-4 group transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-rose-600 group-hover:bg-rose-50 transition-colors">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Unit {unit.id}</h4>
                        <p className="text-xs text-slate-500">{unit.type}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                      unit.status === 'In Transit' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {unit.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Destination</span>
                      <span className="font-medium text-slate-800">{unit.destination}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ETA</span>
                      <span className="font-medium text-emerald-600">{unit.eta}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex gap-2">
                    <button className="flex-1 text-xs font-bold py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">Live Track</button>
                    <button className="flex-1 text-xs font-bold py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">Emergency Comms</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'Priority Routing':
        return (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Route Optimization Objective</h3>
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Minimize: Delay + Time + Penalty</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculatedRoutes.map((route) => (
                  <motion.div 
                    key={route.id}
                    layoutId={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={cn(
                      "glass-card p-6 cursor-pointer transition-all border-2 relative overflow-hidden",
                      recommendedRoute?.id === route.id ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-transparent hover:border-slate-300",
                      selectedRouteId === route.id && recommendedRoute?.id !== route.id ? "border-rose-500" : ""
                    )}
                  >
                    {recommendedRoute?.id === route.id && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-3 py-1 font-bold uppercase tracking-widest rounded-bl-lg">
                        Recommended
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{route.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                            <Navigation size={12} /> {route.distance}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                            <Clock size={12} /> {Math.round(route.estTime)} min (est)
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        route.priority === 'Critical' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {route.priority} Priority
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Delay Risk</p>
                        <p className="text-base font-bold text-slate-700">{route.delayRisk.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Base Time</p>
                        <p className="text-base font-bold text-slate-700">{route.baseTime}m</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Penalty</p>
                        <p className="text-base font-bold text-slate-700">+{route.priorityPenalty}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0",
                    isAnalyzing 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                      Analyzing Clinical Routes...
                    </>
                  ) : (
                    <>
                      <Activity size={24} />
                      Analyze Optimal Path
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-card bg-slate-900 overflow-hidden relative min-h-[500px] border-none shadow-2xl cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
              >
                {/* Simulated Interactive Map */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]" />
                
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
                  {/* Grid Lines */}
                  <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="500" />
                    ))}
                    {Array.from({ length: 13 }).map((_, i) => (
                      <line key={`h-${i}`} x1="0" y1={i * 40} x2="800" y2={i * 40} />
                    ))}
                  </g>

                  {/* Routes */}
                  {calculatedRoutes.map((route) => {
                    const paths: Record<string, string> = {
                      'route-alpha': "M 100 400 L 200 350 L 400 380 L 600 200 L 700 100",
                      'route-gamma': "M 100 400 L 150 300 L 300 250 L 500 150 L 700 100",
                      'route-beta': "M 100 400 L 300 450 L 500 400 L 700 100",
                      'route-delta': "M 100 400 L 250 380 L 450 420 L 650 150 L 700 100"
                    };
                    
                    const isSelected = selectedRouteId === route.id;
                    const isHovered = hoveredRouteId === route.id;
                    const isRecommended = recommendedRoute?.id === route.id;

                    return (
                      <g key={route.id}>
                        {/* Hit Area (Invisible wider path for easier clicking) */}
                        <path 
                          d={paths[route.id]} 
                          stroke="transparent" 
                          strokeWidth="20" 
                          fill="none" 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredRouteId(route.id)}
                          onMouseLeave={() => setHoveredRouteId(null)}
                          onClick={() => setSelectedRouteId(route.id)}
                        />
                        {/* Visual Path */}
                        <motion.path 
                          d={paths[route.id]} 
                          stroke={route.color} 
                          strokeWidth={isSelected || isHovered ? "6" : "3"} 
                          fill="none" 
                          initial={false}
                          animate={{ 
                            strokeOpacity: isSelected || isHovered ? 1 : 0.3,
                            strokeWidth: isSelected || isHovered ? 6 : 3
                          }}
                          strokeDasharray={isRecommended ? "8,4" : "none"}
                          className={cn(
                            "transition-all duration-300 pointer-events-none",
                            isRecommended && "animate-[dash_20s_linear_infinite]"
                          )}
                        />
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  <circle cx="100" cy="400" r="6" fill="#f43f5e" />
                  <circle cx="700" cy="100" r="8" fill="#10b981" className="animate-pulse" />
                  
                  {/* Labels */}
                  <text x="80" y="420" fill="white" fontSize="12" fontWeight="bold">ORIGIN: DISPATCH</text>
                  <text x="680" y="80" fill="#10b981" fontSize="12" fontWeight="bold">DEST: ST. JUDE MEDICAL</text>
                </svg>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredRouteId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{ left: mousePos.x + 15, top: mousePos.y - 10 }}
                      className="absolute z-50 pointer-events-none bg-slate-800/95 backdrop-blur-md border border-slate-600 p-3 rounded-xl shadow-2xl min-w-[180px]"
                    >
                      {(() => {
                        const route = calculatedRoutes.find(r => r.id === hoveredRouteId);
                        if (!route) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-white truncate">{route.name}</p>
                              {recommendedRoute?.id === route.id && (
                                <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black uppercase">Best</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[8px] text-slate-400 uppercase font-bold">Risk</p>
                                <p className="text-xs font-bold text-rose-400">{route.delayRisk.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-slate-400 uppercase font-bold">Time</p>
                                <p className="text-xs font-bold text-sky-400">{Math.round(route.estTime)}m</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-700">
                              <p className="text-[9px] text-slate-300 italic">Click to select corridor</p>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {!hoveredRouteId && !selectedRouteId && (
                    <div className="text-center space-y-4 bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-white/5">
                      <div className="w-20 h-20 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/50 animate-pulse">
                        <Navigation className="text-rose-500" size={40} />
                      </div>
                      <div>
                        <p className="text-white text-xl font-bold">Priority Map Layer Active</p>
                        <p className="text-slate-400 text-sm">Hover or click routes for telemetry</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6 p-6 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Live Telemetry Corridor</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">Signal Priority: Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Signal Priority</p>
                      <p className="text-sm font-bold text-slate-200">GRANTED (LEVEL 4)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Lane Access</p>
                      <p className="text-sm font-bold text-slate-200">EMERGENCY CLEARANCE</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Explanation in Routing View */}
              <AnimatePresence mode="wait">
                {aiExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card bg-white p-8 border-rose-100 shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Clinical Optimization Report</h3>
                        <p className="text-sm text-slate-500">AI-generated route intelligence</p>
                      </div>
                    </div>
                    <div className="prose prose-slate prose-sm max-w-none markdown-body max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      case 'Clinical Analytics':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Historical Delivery Success</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PERFORMANCE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="volume" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Risk Factor Distribution</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Traffic Congestion</span>
                    <span className="text-sm font-bold text-amber-600">42% Impact</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[42%] h-full bg-amber-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Weather Severity</span>
                    <span className="text-sm font-bold text-sky-600">18% Impact</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[18%] h-full bg-sky-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Road Incidents</span>
                    <span className="text-sm font-bold text-rose-600">30% Impact</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[30%] h-full bg-rose-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Risk Intelligence':
        const getRiskColor = (level: number) => {
          if (level > 80) return 'text-rose-500';
          if (level > 50) return 'text-amber-500';
          return 'text-emerald-500';
        };

        const getPrediction = () => {
          const totalRisk = (precipLevel * 0.4) + (congestionLevel * 0.6);
          if (totalRisk > 75) return {
            type: 'Critical Alert',
            color: 'rose',
            text: `Extreme Risk: Predicted ${Math.round(totalRisk / 4)}% increase in delay risk for organ transport units. Immediate intervention required.`
          };
          if (totalRisk > 40) return {
            type: 'Cautionary Warning',
            color: 'amber',
            text: `Moderate Risk: System predicts potential 10-15% delays in urban corridors due to current environmental and traffic synergy.`
          };
          return {
            type: 'Optimal Conditions',
            color: 'emerald',
            text: 'System integrity stable. No significant delay vectors detected for the next 60-minute window.'
          };
        };

        const prediction = getPrediction();

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 bg-slate-900 text-white border-none">
                <h3 className="text-2xl font-bold mb-4">Real-Time Risk Vector Analysis</h3>
                <p className="text-slate-400 mb-8">Current environmental factors affecting medical logistics integrity. Adjust sliders to simulate scenarios.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Environmental Threat Simulator */}
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Environmental Threat</h4>
                      <span className={cn("text-xs font-bold px-2 py-1 rounded bg-slate-900", getRiskColor(precipLevel))}>
                        {precipLevel}% Intensity
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <motion.div 
                        animate={precipLevel > 50 ? { y: [0, -4, 0] } : {}}
                        transition={precipLevel > 50 ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                        className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", 
                          precipLevel > 50 ? "bg-rose-500/20 text-rose-500" : "bg-sky-500/20 text-sky-500"
                        )}
                      >
                        <CloudRain size={24} />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-lg font-bold">Precipitation Warning</p>
                        <p className="text-xs text-slate-400">
                          {precipLevel > 70 ? 'Severe impact on braking & visibility' : 
                           precipLevel > 30 ? 'Moderate impact on braking distance' : 'Minimal environmental impact'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span>Clear</span>
                        <span>Storm</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={precipLevel}
                        onChange={(e) => setPrecipLevel(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  </div>

                  {/* Infrastructure Status Simulator */}
                  <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Infrastructure Status</h4>
                      <span className={cn("text-xs font-bold px-2 py-1 rounded bg-slate-900", getRiskColor(congestionLevel))}>
                        {congestionLevel}% Capacity
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", 
                        congestionLevel > 80 ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                      )}>
                        <Navigation size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold">Grid Congestion</p>
                        <p className="text-xs text-slate-400">
                          {congestionLevel > 90 ? 'Critical gridlock in sector B' : 
                           congestionLevel > 60 ? 'Urban corridor B at high capacity' : 'Fluid traffic flow detected'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span>Fluid</span>
                        <span>Gridlock</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={congestionLevel}
                        onChange={(e) => setCongestionLevel(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">AI Risk Prediction</h3>
              <div className={cn("p-4 rounded-xl border mb-6 transition-colors", 
                prediction.color === 'rose' ? "bg-rose-50 border-rose-100" : 
                prediction.color === 'amber' ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
              )}>
                <div className={cn("flex items-center gap-2 font-bold text-sm mb-2", 
                  prediction.color === 'rose' ? "text-rose-700" : 
                  prediction.color === 'amber' ? "text-amber-700" : "text-emerald-700"
                )}>
                  <AlertTriangle size={16} />
                  {prediction.type}
                </div>
                <p className={cn("text-xs leading-relaxed", 
                  prediction.color === 'rose' ? "text-rose-600" : 
                  prediction.color === 'amber' ? "text-amber-600" : "text-emerald-600"
                )}>
                  {prediction.text}
                </p>
              </div>
              <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                View Full Risk Map
              </button>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-bold text-slate-800">System Settings</h3>
            <div className="glass-card divide-y divide-slate-100">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Emergency Protocol Alpha</p>
                  <p className="text-sm text-slate-500">Automatically grant signal priority to critical units</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">AI Optimization Depth</p>
                  <p className="text-sm text-slate-500">Balance between calculation speed and route precision</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium">
                  <option>High Precision</option>
                  <option>Balanced</option>
                  <option>Fast Response</option>
                </select>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Data Refresh Rate</p>
                  <p className="text-sm text-slate-500">Current interval: 10s</p>
                </div>
                <button className="text-sm font-bold text-rose-600 hover:text-rose-700">Change</button>
              </div>
            </div>
          </div>
        );
      case 'Medical Store':
        const storeItems = [
          { id: 1, name: 'O- Negative Blood Bag', category: 'Blood Bank', price: '$450', stock: 12, image: 'https://picsum.photos/seed/blood/200/200' },
          { id: 2, name: 'Critical Care Ventilator', category: 'Equipment', price: '$12,500', stock: 3, image: 'https://picsum.photos/seed/vent/200/200' },
          { id: 3, name: 'Emergency Trauma Kit', category: 'Supplies', price: '$299', stock: 45, image: 'https://picsum.photos/seed/kit/200/200' },
          { id: 4, name: 'Epinephrine Auto-Injector', category: 'Medicine', price: '$150', stock: 80, image: 'https://picsum.photos/seed/epi/200/200' },
          { id: 5, name: 'Plasma Unit (Fresh Frozen)', category: 'Blood Bank', price: '$380', stock: 8, image: 'https://picsum.photos/seed/plasma/200/200' },
          { id: 6, name: 'Portable Defibrillator', category: 'Equipment', price: '$1,800', stock: 15, image: 'https://picsum.photos/seed/defib/200/200' },
        ];

        const filteredItems = storeItems.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Medical Supply Store</h3>
                <p className="text-sm text-slate-500">Procure critical supplies for emergency operations</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cart</span>
                  <span className="w-5 h-5 bg-rose-600 text-white text-[10px] flex items-center justify-center rounded-full">0</span>
                </div>
              </div>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Showing results for:</span>
                <span className="font-bold text-rose-600">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 underline ml-2">Clear search</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }}
                    key={item.id} 
                    className="glass-card overflow-hidden group transition-all duration-300"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-bold text-slate-700 uppercase">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Stock available: {item.stock} units</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-rose-600">{item.price}</span>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => alert(`Order placed for: ${item.name}. Dispatching unit for pickup.`)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                        >
                          Purchase Now
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Search size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">No items found</h4>
                  <p className="text-sm text-slate-500">Try searching for "Blood", "Ventilator", or "Kit"</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'Consultations':
        const doctors = [
          { id: 1, name: 'Dr. Sarah Chen', specialty: 'Cardiology', availability: 'Today', image: 'https://picsum.photos/seed/dr1/200/200' },
          { id: 2, name: 'Dr. Marcus Thorne', specialty: 'Emergency Medicine', availability: 'Tomorrow', image: 'https://picsum.photos/seed/dr2/200/200' },
          { id: 3, name: 'Dr. Elena Rodriguez', specialty: 'Neurology', availability: 'In 2 days', image: 'https://picsum.photos/seed/dr3/200/200' },
        ];

        const handleBook = (doctorName: string) => {
          setIsBooking(true);
          setTimeout(() => {
            const newConsult = {
              id: consultations.length + 1,
              doctor: doctorName,
              date: new Date().toISOString().split('T')[0],
              type: 'Scheduled Consultation',
              status: 'Confirmed'
            };
            setConsultations([newConsult, ...consultations]);
            setIsBooking(false);
            alert(`Consultation booked with ${doctorName} for today.`);
          }, 1500);
        };

        const handleInstantConsult = () => {
          setIsBooking(true);
          setTimeout(() => {
            const newConsult = {
              id: consultations.length + 1,
              doctor: 'On-Call Specialist',
              date: new Date().toISOString().split('T')[0],
              type: 'Emergency Instant Consult',
              status: 'In Progress'
            };
            setConsultations([newConsult, ...consultations]);
            setIsBooking(false);
            alert("Connecting to on-call clinical lead...");
          }, 1000);
        };

        return (
          <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Clinical Consultations</h3>
                <p className="text-sm text-slate-500">Connect with medical experts for logistics-related clinical guidance</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBook('Dr. Sarah Chen')}
                disabled={isBooking}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                <Calendar size={18} />
                {isBooking ? 'Processing...' : 'New Appointment'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Section */}
              <div className="lg:col-span-2 space-y-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope size={20} className="text-rose-600" />
                  Available Specialists
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((dr, i) => (
                    <motion.div 
                      key={dr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="glass-card p-5 flex items-center gap-4 hover:border-rose-200 transition-colors group cursor-pointer"
                    >
                      <img src={dr.image} alt={dr.name} className="w-16 h-16 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-800">{dr.name}</h5>
                        <p className="text-xs text-slate-500">{dr.specialty}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 uppercase">
                          <Clock size={10} />
                          Available {dr.availability}
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: "#f43f5e", color: "#fff" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBook(dr.name)}
                        disabled={isBooking}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg transition-all disabled:opacity-30"
                      >
                        <ChevronRight size={18} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* History Section */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-slate-600" />
                  Previous History
                </h4>
                <div className="glass-card divide-y divide-slate-50">
                  {consultations.slice(0, showHistory ? undefined : 3).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm text-slate-800">{item.doctor}</p>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                          item.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.type}</p>
                      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <Calendar size={10} />
                        {item.date}
                      </p>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full py-3 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    {showHistory ? 'Show Less' : 'View Full History'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Card */}
            <div className="glass-card p-8 bg-slate-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold">Need Emergency Guidance?</h4>
                  <p className="text-slate-400 max-w-md">Connect with our on-call clinical logistics lead for immediate decision support in critical transport scenarios.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstantConsult}
                  disabled={isBooking}
                  className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap size={20} />
                  {isBooking ? 'Connecting...' : 'Start Instant Consult'}
                </motion.button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <Activity size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">MediSense</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Command Center" 
            active={activeView === 'Command Center'} 
            onClick={() => setActiveView('Command Center')}
          />
          <NavItem 
            icon={<Truck size={20} />} 
            label="Medical Fleet" 
            active={activeView === 'Medical Fleet'} 
            onClick={() => setActiveView('Medical Fleet')}
          />
          <NavItem 
            icon={<MapIcon size={20} />} 
            label="Priority Routing" 
            active={activeView === 'Priority Routing'} 
            onClick={() => setActiveView('Priority Routing')}
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Clinical Analytics" 
            active={activeView === 'Clinical Analytics'} 
            onClick={() => setActiveView('Clinical Analytics')}
          />
          <NavItem 
            icon={<Stethoscope size={20} />} 
            label="Consultations" 
            active={activeView === 'Consultations'} 
            onClick={() => setActiveView('Consultations')}
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Risk Intelligence" 
            active={activeView === 'Risk Intelligence'} 
            onClick={() => setActiveView('Risk Intelligence')}
          />
          <NavItem 
            icon={<Search size={20} />} 
            label="Medical Store" 
            active={activeView === 'Medical Store'} 
            onClick={() => setActiveView('Medical Store')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeView === 'Settings'}
            onClick={() => setActiveView('Settings')} 
          />
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Live</span>
            </div>
            <p className="text-[10px] text-slate-400">Model v{data?.modelVersion || '2.2.0-HC'}</p>
            <p className="text-[10px] text-slate-400">Accuracy: {data?.accuracy || '94.8%'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-white border-bottom border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medical units, blood bags, or organs..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </form>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">Clinical Logistics Lead</p>
                <p className="text-xs text-slate-500">Emergency Operations</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                <img src="https://picsum.photos/seed/doctor/100/100" alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
        active 
          ? "bg-rose-50 text-rose-700 shadow-sm" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute left-0 w-1 h-6 bg-rose-600 rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className={cn(active ? "text-rose-600" : "text-slate-400 group-hover:text-slate-600")}>
        {icon}
      </span>
      {label}
    </motion.button>
  );
}

function StatCard({ title, value, subValue, trend, trendType, icon }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="glass-card p-6 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {subValue && <span className="text-sm font-medium text-slate-400">{subValue}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-md",
          trendType === 'up' ? "bg-emerald-50 text-emerald-600" : 
          trendType === 'down' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
        )}>
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function RiskMetric({ label, value, icon, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          className={cn("h-full", color)}
        />
      </div>
    </div>
  );
}
