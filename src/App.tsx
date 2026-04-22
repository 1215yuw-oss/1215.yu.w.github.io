import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wrench, Plus, Activity, Calendar, Settings, History, 
  Trash2, DollarSign, MapPin, AlertCircle, X, CheckCircle 
} from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// --- Knowledge Base (PTT Rules) ---
export const MAINTENANCE_RULES = [
  { id: 'oil', name: '機油', interval: 1000, desc: '潤滑引擎、降溫' },
  { id: 'tires', name: '輪胎/日常檢查', interval: 1000, desc: '胎壓、煞車、燈光' },
  { id: 'gear_oil', name: '齒輪油', interval: 2000, desc: '潤滑齒輪箱、減少異音' },
  { id: 'air_filter', name: '空氣濾清器', interval: 3000, desc: '確保引擎呼吸潔淨空氣' },
  { id: 'transmission_clean', name: '傳動組清潔', interval: 5000, desc: '清除皮帶粉塵、優化加速' },
  { id: 'brake_pad', name: '煞車皮/來令片', interval: 5000, desc: '檢查厚度，低於限度即更換' },
  { id: 'spark_plug', name: '火星塞', interval: 10000, desc: '確保點火順暢' },
  { id: 'fuel_filter', name: '汽油濾芯', interval: 10000, desc: '過濾汽油雜質' },
  { id: 'brake_fluid', name: '煞車油', interval: 10000, desc: '確保煞車系統靈敏' },
  { id: 'battery', name: '電瓶', interval: 10000, desc: '檢查電壓，確保啟動正常' },
  { id: 'transmission_belt', name: '傳動皮帶', interval: 15000, desc: '檢查龜裂、預防斷裂' },
];

export const SERVICE_TYPES = MAINTENANCE_RULES.map(r => r.name).concat(["其他 (Other)"]);

// --- Types ---
export interface MaintenanceRecord {
  id: string; // Firebase doc id
  date: string;
  type: string;
  mileage: number;
  cost: number;
  shop: string;
  notes: string;
}

export interface BikeInfo {
  brand: string;
  model: string;
  year: number;
  initMileage: number;
}

// --- Constants ---
const DEFAULT_BIKE: BikeInfo = {
  brand: "YAMAHA",
  model: "CYGNUS GRYPHUS",
  year: 2023,
  initMileage: 0,
};

// --- Sub-components ---
const StatusCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel p-6 flex items-start gap-4"
  >
    <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-secondary text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      {subtitle && <p className="text-xs text-muted mt-2">{subtitle}</p>}
    </div>
  </motion.div>
);

// --- Main Application ---
export default function App() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [bikeInfo, setBikeInfo] = useState<BikeInfo>(DEFAULT_BIKE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "knowledge">("dashboard");

  // Form State
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: SERVICE_TYPES[0],
    mileage: 0,
    cost: 0,
    shop: "",
    notes: ""
  });

  // Cloud Firestore Sync Effect
  useEffect(() => {
    // Listen to Firebase Records subcollection
    const recordsUnsub = onSnapshot(collection(db, "maintenance_records"), (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      setRecords(fetchedRecords);
    });

    // Listen to Master Bike Configuration
    const bikeUnsub = onSnapshot(doc(db, "bike_config", "main"), (docSnap) => {
      if (docSnap.exists()) {
        setBikeInfo(docSnap.data() as BikeInfo);
      } else {
        // Initialize default Bike profile dynamically into Cloud Firestore if blank
        setDoc(doc(db, "bike_config", "main"), DEFAULT_BIKE);
      }
    });

    return () => {
      recordsUnsub();
      bikeUnsub();
    };
  }, []);

  // Calculations
  const sortedRecords = useMemo(() => 
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.mileage - a.mileage),
  [records]);

  const latestMileage = useMemo(() => {
    return records.reduce((max, r) => Math.max(max, r.mileage), bikeInfo.initMileage);
  }, [records, bikeInfo.initMileage]);

  const totalSpent = useMemo(() => 
    records.reduce((sum, r) => sum + Number(r.cost), 0),
  [records]);

  // Knowledge Base Core Engine: Compute health for every component
  const componentStatuses = useMemo(() => {
    return MAINTENANCE_RULES.map(rule => {
      const relRecords = sortedRecords.filter(r => r.type === rule.name);
      const lastServicedMileage = relRecords.length > 0 ? relRecords[0].mileage : bikeInfo.initMileage;
      const currentUsage = Math.max(0, latestMileage - lastServicedMileage);
      
      // Dynamic Interval Logic (e.g. 300km new bike rule)
      let activeInterval = rule.interval;
      if ((rule.id === 'oil' || rule.id === 'gear_oil') && latestMileage < 1000 && lastServicedMileage === bikeInfo.initMileage) {
        activeInterval = 300;
      }

      const remaining = activeInterval - currentUsage;
      const healthRaw = (remaining / activeInterval) * 100;
      const healthPercentage = Math.max(0, Math.min(100, healthRaw));
      
      const isCritical = remaining <= 100 || healthPercentage <= 10;
      const isWarning = remaining <= activeInterval * 0.25;

      return {
        ...rule,
        activeInterval,
        lastServicedMileage,
        currentUsage,
        remaining,
        healthPercentage,
        isCritical,
        isWarning
      };
    }).sort((a, b) => a.remaining - b.remaining);
  }, [sortedRecords, latestMileage, bikeInfo.initMileage]);

  const critCount = componentStatuses.filter(s => s.isCritical).length;

  // Cloud Handlers
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      date: formData.date,
      type: formData.type,
      mileage: Number(formData.mileage),
      cost: Number(formData.cost),
      shop: formData.shop || "",
      notes: formData.notes || ""
    };
    
    // Firestore write
    await addDoc(collection(db, "maintenance_records"), newRecord);
    
    setIsFormOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: SERVICE_TYPES[0],
      mileage: Math.max(newRecord.mileage, latestMileage),
      cost: 0,
      shop: "",
      notes: ""
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("確定的要刪除這筆紀錄嗎？將直接刪除雲端資料庫中的紀錄。")) {
      await deleteDoc(doc(db, "maintenance_records", id));
    }
  };

  // Renderers
  return (
    <div className="relative min-h-screen pb-20">
      <header className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 sticky top-0 z-40 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-wider">MOTOR<span className="text-gradient">SYNC</span><span className="ml-2 text-[10px] bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-400/20 align-middle">CLOUD DB</span></h1>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
            <Settings className="w-5 h-5 text-secondary" />
            {critCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse blur-[1px]"></span>}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-5xl text-gradient mb-2">{bikeInfo.brand} {bikeInfo.model}</h2>
            <p className="text-secondary tracking-widest text-sm uppercase font-mono">{bikeInfo.year} | MILEAGE: {latestMileage} KM</p>
          </div>
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, mileage: latestMileage }));
              setIsFormOpen(true);
            }}
            className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>新增紀錄 (Add Log)</span>
          </button>
        </section>

        <div className="flex border-b border-[#ffffff14] mb-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 px-6 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "dashboard" ? "border-[#00f2fe] text-[#00f2fe]" : "border-transparent text-secondary hover:text-white"}`}
          >
            健康監測器 (Health Monitor)
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`py-3 px-6 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "history" ? "border-[#00f2fe] text-[#00f2fe]" : "border-transparent text-secondary hover:text-white"}`}
          >
            歷史紀錄 (History Logs)
          </button>
          <button 
            onClick={() => setActiveTab("knowledge")}
            className={`py-3 px-6 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "knowledge" ? "border-[#00f2fe] text-[#00f2fe]" : "border-transparent text-secondary hover:text-white"}`}
          >
            知識庫 (Knowledge Base)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard 
                  title="累積里程 (Total Mileage)" 
                  value={`${latestMileage.toLocaleString()} km`} 
                  icon={MapPin} 
                  colorClass="text-[#00f2fe]"
                />
                <StatusCard 
                  title="警示項目 (Alerts)" 
                  value={`${critCount} 項`} 
                  icon={AlertCircle} 
                  colorClass={critCount > 0 ? "text-red-400" : "text-[#00ffcc]"}
                  subtitle={critCount > 0 ? "需盡速檢測保養" : "目前狀況良好"}
                />
                <StatusCard 
                  title="總保養花費 (Total Spent)" 
                  value={`NT$ ${totalSpent.toLocaleString()}`} 
                  icon={DollarSign} 
                  colorClass="text-emerald-400"
                />
              </div>

              <div className="glass-panel p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold">零件健康矩陣 (Component Matrix)</h3>
                </div>
                
                <div className="space-y-6">
                  {componentStatuses.map((stat, i) => (
                    <motion.div 
                      key={stat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-md flex items-center gap-2">
                              {stat.name}
                              {stat.isCritical && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                            </h4>
                          </div>
                          <p className="text-xs text-muted block mt-1">{stat.desc} • 週期: {stat.activeInterval}km</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-sm ${stat.isCritical ? 'text-red-400 font-bold' : stat.isWarning ? 'text-yellow-400' : 'text-cyan-400'}`}>
                            {stat.remaining <= 0 ? `過期超出 ${Math.abs(stat.remaining)} km` : `剩餘 ${stat.remaining} km`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-2.5 w-full bg-[#1a1d24] rounded-full overflow-hidden border border-[#ffffff14]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.healthPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${
                            stat.isCritical 
                            ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                            : stat.isWarning 
                            ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="glass-panel p-0 overflow-hidden min-h-[50vh]">
                {sortedRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-16 text-secondary">
                    <History className="w-12 h-12 mb-4 opacity-20" />
                    <p>尚無保養紀錄，無數據可供智慧推算。</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#ffffff0a]">
                    {sortedRecords.map((record, index) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        key={record.id} 
                        className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-[#1a1d24] rounded-lg border border-[#ffffff14]">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-white">{record.type}</h4>
                            <div className="flex items-center gap-3 text-sm text-secondary mt-1 tracking-wider">
                              <span className="flex items-center gap-1 font-mono"><Calendar className="w-4 h-4"/> {record.date}</span>
                              <span className="flex items-center gap-1 font-mono text-cyan-300"><MapPin className="w-4 h-4"/> {record.mileage.toLocaleString()} km</span>
                            </div>
                            {(record.shop || record.notes) && (
                              <p className="text-sm mt-3 text-muted border-l-2 border-[#ffffff1a] pl-3 py-1">
                                {record.shop && <span className="block text-secondary mb-1">📍 {record.shop}</span>}
                                {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-full md:w-auto flex justify-between md:flex-col items-center md:items-end gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-[#ffffff0a] md:border-0">
                          <div className="text-xl font-bold text-[#00ffcc] font-mono">NT$ {record.cost.toLocaleString()}</div>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-muted hover:text-red-400 hover:bg-red-400/10 p-2 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "knowledge" && (
            <motion.div 
              key="knowledge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="glass-panel p-8">
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                   <Wrench className="text-cyan-400" /> 
                   定期保養一覽表（通用版）
                 </h3>
                 <div className="grid gap-4 md:grid-cols-2">
                    {MAINTENANCE_RULES.map(rule => (
                      <div key={rule.id} className="bg-[#1a1d24] p-5 rounded-xl border border-[#ffffff0a]">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-white text-lg">{rule.name}</h4>
                          <span className="text-cyan-400 font-mono text-sm bg-cyan-400/10 px-3 py-1 rounded-full">{rule.interval} km</span>
                        </div>
                        <p className="text-sm text-secondary leading-relaxed">{rule.desc}</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="mt-8 p-6 bg-red-400/10 border border-red-400/20 rounded-xl">
                   <h4 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                     <AlertCircle className="w-5 h-5" /> 重點注意事項
                   </h4>
                   <ul className="list-disc list-inside text-sm text-secondary space-y-2 leading-relaxed">
                     <li><strong>每 1,000 km：</strong> 檢查機油、胎壓、煞車、燈光。</li>
                     <li><strong>新車初次：</strong> 機油、齒輪接通常在 300km 做第一次更換。</li>
                     <li><strong>長期未騎：</strong> 若長時間未使用，建議保養項目同樣按月份時間計算，清潔噴油嘴。</li>
                     <li><strong>高風險項目：</strong> 若行駛砂石路面，應縮短空氣濾清器更換週期。</li>
                   </ul>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Record Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsFormOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-8 w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-6 right-6 text-secondary hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-[#00f2fe]" />
                新增保養紀錄
              </h2>

              <form onSubmit={handleAddRecord} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">日期 (Date)</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full focus:ring-2 ring-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">當時里程 (Mileage)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={formData.mileage}
                      onChange={e => setFormData({...formData, mileage: parseInt(e.target.value) || 0})}
                      className="w-full font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">保養項目 (Service Type)</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full"
                  >
                    {SERVICE_TYPES.map(type => <option key={type} value={type} className="bg-[#1a1d24]">{type}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">花費金額 (Cost NT$)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                    className="w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">車行/店家 (Shop) <span className="text-muted text-xs font-normal">- 選填</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. YAMAHA 授權店"
                    value={formData.shop}
                    onChange={e => setFormData({...formData, shop: e.target.value})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">備註事項 (Notes) <span className="text-muted text-xs font-normal">- 選填</span></label>
                  <textarea 
                    rows={3}
                    placeholder="更換了哪種廠牌的機油？機車技師有什麼建議？"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary flex-1 border-[#ffffff1a]">
                    取消 (Cancel)
                  </button>
                  <button type="submit" className="btn-primary flex-1 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
                    儲存進 Firebase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
