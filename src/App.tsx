import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// --- Constants ---
const ITEMS = [
  "機油", "齒輪油", "空氣濾芯", "大保養", "火星塞", "煞車油", 
  "煞車皮", "傳動皮帶", "普利珠", "輪胎", "節流閥清洗", "冷卻液", "電瓶"
];

const RULES: Record<string, number> = { 
  "機油": 1000, 
  "齒輪油": 2000, 
  "空氣濾芯": 5000, 
  "大保養": 10000, 
  "火星塞": 10000, 
  "煞車油": 10000 
};

// --- Types ---
interface MaintenanceRecord {
  id: string;
  date: string;
  mileage: number;
  items: string[];
  cost: number;
  notes: string;
}

interface DraftRecord {
  id: string; // temp id
  date: string;
  mileage: number | "";
  items: string[];
  cost: number | "";
  notes: string;
}

// Custom Multi-select Dropdown Component
const MultiSelectDropdown = ({ selected, onChange }: { selected: string[], onChange: (val: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="dropdown" ref={containerRef}>
      <div 
        className="dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length > 0 ? (
          selected.map(s => <span key={s} className="item-tag">{s}</span>)
        ) : (
          "選擇項目..."
        )}
      </div>
      <div className={`dropdown-content ${isOpen ? 'show' : ''}`}>
        {ITEMS.map(item => (
          <label key={item} className="option" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={selected.includes(item)}
              onChange={() => toggleItem(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [licensePlate, setLicensePlate] = useState<string>("ABC-1234");
  const [tempIdCounter, setTempIdCounter] = useState(0);

  // Cloud Firestore Sync Effect
  useEffect(() => {
    const recordsUnsub = onSnapshot(collection(db, "maintenance_records"), (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      // Sort by date descending
      fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.mileage - a.mileage);
      setRecords(fetchedRecords);
    });

    const configUnsub = onSnapshot(doc(db, "bike_config", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setLicensePlate(docSnap.data().licensePlate || "");
      } else {
        setDoc(doc(db, "bike_config", "general"), { licensePlate: "ABC-1234" });
      }
    });

    return () => {
      recordsUnsub();
      configUnsub();
    };
  }, []);

  // Sync License Plate periodically to Firebase
  const handleUpdatePlate = (val: string) => {
    setLicensePlate(val);
    setDoc(doc(db, "bike_config", "general"), { licensePlate: val }, { merge: true });
  };

  // Calculations Native
  let maxKm = 0;
  let totalCost = 0;
  const lasts: Record<string, number> = { "機油": 0, "齒輪油": 0, "空氣濾芯": 0, "大保養": 0, "火星塞": 0 };

  const allRows = [...records, ...drafts.filter(d => (d.mileage !== "" && d.mileage > 0))];

  allRows.forEach(row => {
    const km = Number(row.mileage) || 0;
    const cost = Number(row.cost) || 0;
    
    if (km > maxKm) maxKm = km;
    totalCost += cost;

    row.items.forEach(item => {
      if (lasts[item] !== undefined && km > lasts[item]) {
        lasts[item] = km;
      }
    });
  });

  const getNextAlert = (item: string) => {
    const lastKm = lasts[item] || 0;
    const rule = RULES[item];
    if (lastKm > 0) return (lastKm + rule).toLocaleString();
    if (maxKm > 0) return (Math.ceil(maxKm / rule) * rule).toLocaleString();
    return '--';
  };

  // Handlers
  const handleAddDraft = () => {
    setDrafts([...drafts, {
      id: `draft_${tempIdCounter}`,
      date: new Date().toISOString().split('T')[0],
      mileage: maxKm > 0 ? maxKm : "",
      items: ["機油"],
      cost: "",
      notes: ""
    }]);
    setTempIdCounter(c => c + 1);
  };

  const updateDraft = (id: string, field: keyof DraftRecord, value: any) => {
    setDrafts(drafts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const saveDraftToCloud = async (draft: DraftRecord) => {
    if (draft.mileage === "" || draft.items.length === 0) {
      alert("請輸入里程數並至少選擇一個項目 (Mileage and Item required)");
      return;
    }
    const newRecord = {
      date: draft.date,
      mileage: Number(draft.mileage),
      items: draft.items,
      cost: Number(draft.cost) || 0,
      notes: draft.notes
    };
    
    // Write to Firebase
    await addDoc(collection(db, "maintenance_records"), newRecord);
    // Remove from local drafts
    setDrafts(drafts.filter(d => d.id !== draft.id));
  };

  const discardDraft = (id: string) => {
    setDrafts(drafts.filter(d => d.id !== id));
  };

  const deleteCloudRecord = async (id: string) => {
    if (confirm("確定刪除此雲端紀錄？ (Delete Cloud Record?)")) {
      await deleteDoc(doc(db, "maintenance_records", id));
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="doc-title">智能保養紀錄系統</div>
        <div className="doc-sub">Smart Maintenance Log System <span>(CLOUD SYNC)</span></div>
      </header>

      {/* Dashboard */}
      <div className="section">
        <div className="section-title">保養儀表板 Maintenance Dashboard</div>
        <div className="dashboard">
          <div className="card">
            <span className="stat-label">累積總里程</span>
            <div className="stat-val">{maxKm.toLocaleString()}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">下次機油更換</span>
            <div className="stat-val">{getNextAlert("機油")}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">下次齒輪油</span>
            <div className="stat-val">{getNextAlert("齒輪油")}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">下次空氣濾芯</span>
            <div className="stat-val">{getNextAlert("空氣濾芯")}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">下次大保養</span>
            <div className="stat-val">{getNextAlert("大保養")}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">下次火星塞</span>
            <div className="stat-val">{getNextAlert("火星塞")}</div>
            <span className="stat-unit">KM</span>
          </div>
          <div className="card">
            <span className="stat-label">累積總支出</span>
            <div className="stat-val">{totalCost.toLocaleString()}</div>
            <span className="stat-unit">TWD</span>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="section">
        <div className="section-title">車輛資訊 VEHICLE INFO</div>
        <div class="info-row">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>車牌號碼</span>
          <input 
            type="text" 
            className="plate-input" 
            placeholder="ABC-1234"
            value={licensePlate}
            onChange={(e) => handleUpdatePlate(e.target.value)}
          />
        </div>
      </div>

      {/* Service Logs */}
      <div className="section">
        <div className="section-title">保養紀錄 SERVICE LOGS</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th width="14%">日期</th>
                <th width="14%">里程(KM)</th>
                <th width="32%">項目 (複選)</th>
                <th width="12%">費用</th>
                <th width="20%">備註</th>
                <th width="8%">操作</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Draft Rows (Editing) */}
              {drafts.map(draft => (
                <tr key={draft.id} style={{ background: '#FFFAED' }}>
                  <td>
                    <input type="date" className="table-input" style={{ background: 'transparent' }}
                      value={draft.date} onChange={e => updateDraft(draft.id, 'date', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="table-input" placeholder="0" style={{ background: 'transparent' }}
                      value={draft.mileage} onChange={e => updateDraft(draft.id, 'mileage', e.target.value)} />
                  </td>
                  <td>
                    <MultiSelectDropdown selected={draft.items} onChange={(vals) => updateDraft(draft.id, 'items', vals)} />
                  </td>
                  <td>
                    <input type="number" className="table-input" placeholder="0" style={{ background: 'transparent' }}
                      value={draft.cost} onChange={e => updateDraft(draft.id, 'cost', e.target.value)} />
                  </td>
                  <td>
                    <input type="text" className="table-input" placeholder="備註..." style={{ background: 'transparent' }}
                      value={draft.notes} onChange={e => updateDraft(draft.id, 'notes', e.target.value)} />
                  </td>
                  <td>
                    <div className="btn-action-col">
                      <button className="btn-save" onClick={() => saveDraftToCloud(draft)} title="儲存上雲 ✔️">✔️</button>
                      <button className="btn-delete" onClick={() => discardDraft(draft.id)} title="取消 ✕">✕</button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Saved Cloud Records (Read-Only) */}
              {records.map(record => (
                <tr key={record.id}>
                  <td>
                    <input type="text" className="table-input" disabled value={record.date} style={{ opacity: 0.8 }} />
                  </td>
                  <td>
                    <input type="text" className="table-input" disabled value={record.mileage} style={{ opacity: 0.8 }} />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {record.items.map(i => <span key={i} className="item-tag" style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#555' }}>{i}</span>)}
                    </div>
                  </td>
                  <td>
                    <input type="text" className="table-input" disabled value={record.cost} style={{ opacity: 0.8 }} />
                  </td>
                  <td>
                    <input type="text" className="table-input" disabled value={record.notes} style={{ opacity: 0.8, textAlign: 'left', paddingLeft: '10px' }} />
                  </td>
                  <td>
                    <div className="btn-action-col">
                      <button className="btn-delete" onClick={() => deleteCloudRecord(record.id)} title="刪除雲端紀錄 ✕">✕</button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
        <button className="btn-add" onClick={handleAddDraft}>+ 新增紀錄項目 Add New Service Row</button>
      </div>

    </div>
  );
}
