import { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, Users, Calendar, UserPlus, Trash2, 
  CheckCircle, XCircle, Clock, Search, Menu, X, LogOut, Activity, BarChart3, Bot
} from "lucide-react";

export default function App() {
  const [view, setView] = useState("dashboard"); 
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ 
    total_employees: 0, present_today: 0, absent_today: 0, 
    recent_activity: [], department_stats: [] 
  });
  const [form, setForm] = useState({ name: "", email: "", department: "" });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const API_URL = "http://127.0.0.1:8000"; 

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [empRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/employees`),
        axios.get(`${API_URL}/stats`)
      ]);
      setEmployees(empRes.data);
      setStats(statsRes.data);
    } catch (err) { console.error("API Error"); }
  };

  const showNotification = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/employees`, form);
      setForm({ name: "", email: "", department: "" });
      fetchData(); 
      showNotification("Employee added successfully!");
    } catch (err) { showNotification("Email already exists!", "error"); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await axios.delete(`${API_URL}/employees/${id}`);
    fetchData();
    showNotification("Employee deleted.", "error"); // Red for delete
  };

  const markAttendance = async (id, status) => {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    try {
      await axios.post(`${API_URL}/attendance`, { employee_id: id, date: dateStr, status });
      fetchData(); 
      
      // FIX: Conditional Color Logic
      if (status === "Present") {
        showNotification(`Marked Present`, "success"); // Green
      } else {
        showNotification(`Marked Absent`, "error");   // Red
      }
      
    } catch (err) { showNotification("Failed to mark attendance", "error"); }
  };

  const fetchHistory = async (emp) => {
    const res = await axios.get(`${API_URL}/attendance/${emp.id}`);
    setHistory(res.data);
    setSelectedEmp(emp);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-100">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold tracking-wider text-white">HRMS<span className="text-blue-500">Pro</span></h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded text-slate-400"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} open={sidebarOpen} />
          <NavButton icon={<Users size={20} />} label="Employees" active={view === "employees"} onClick={() => setView("employees")} open={sidebarOpen} />
          <NavButton icon={<Calendar size={20} />} label="Attendance" active={view === "attendance"} onClick={() => setView("attendance")} open={sidebarOpen} />
        </nav>
        <div className="p-4">
            <div className={`flex items-center gap-3 p-3 rounded bg-slate-900 border border-slate-800 ${!sidebarOpen && "justify-center"}`}>
                <Bot size={20} className="text-purple-400" />
                {sidebarOpen && <span className="text-xs text-slate-400">AI Agent Ready</span>}
            </div>
            <button className="flex items-center gap-3 text-red-400 w-full p-3 hover:bg-slate-900 rounded mt-2"><LogOut size={20} />{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-900">
        <header className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-white capitalize">{view}</h2><p className="text-slate-400 text-sm">Overview of your organization</p></div>
          <div className="bg-slate-800 flex items-center px-4 py-2 rounded-lg border border-slate-700 text-white"><Search size={18} className="text-slate-400 mr-2"/><input placeholder="Search..." className="outline-none text-sm bg-transparent placeholder-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
        </header>

        {view === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Staff" value={stats.total_employees} icon={<Users size={24} className="text-blue-400"/>} color="border-l-4 border-blue-500 bg-slate-800" />
              <StatCard title="Present Today" value={stats.present_today} icon={<CheckCircle size={24} className="text-green-400"/>} color="border-l-4 border-green-500 bg-slate-800" />
              <StatCard title="Absent Today" value={stats.absent_today} icon={<XCircle size={24} className="text-red-400"/>} color="border-l-4 border-red-500 bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><Activity size={18}/> Recent Activity</h3>
                <div className="space-y-3">
                  {stats.recent_activity.map((act, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-700 rounded transition">
                      <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${act.status === "Present" ? "bg-green-500" : "bg-red-500"}`}></div><span className="font-medium text-slate-200">{act.name}</span></div>
                      <div className="flex items-center gap-4"><span className={`text-xs px-2 py-0.5 rounded ${act.status === "Present" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{act.status}</span><span className="text-slate-500 text-xs">{act.time}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><BarChart3 size={18}/> Department Distribution</h3>
                <div className="space-y-4">
                   {stats.department_stats.map((dept, i) => (
                     <div key={i}>
                       <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-300">{dept.name}</span><span className="text-slate-500">{dept.count} Staff</span></div>
                       <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(dept.count / stats.total_employees) * 100}%` }}></div></div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "employees" && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-semibold mb-4 text-slate-200">Add Employee</h3>
              <form onSubmit={handleAddEmployee} className="flex gap-4 items-end">
                <InputGroup label="Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Ex: Ritul Aryan" />
                <InputGroup label="Email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="Ex: ritul@ethara.ai" />
                <InputGroup label="Dept" value={form.department} onChange={v => setForm({...form, department: v})} placeholder="Ex: Engineering" />
                <button disabled={loading} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 h-[42px] font-medium transition">Add</button>
              </form>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold border-b border-slate-700"><tr><th className="p-4">Name</th><th className="p-4">Dept</th><th className="p-4 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-700">{filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-700 transition">
                    <td className="p-4"><div className="font-bold text-slate-200">{emp.name}</div><div className="text-xs text-slate-500">{emp.email}</div></td>
                    <td className="p-4"><span className="px-2 py-1 bg-slate-700 text-blue-300 text-xs rounded font-medium">{emp.department}</span></td>
                    <td className="p-4 text-right"><button onClick={() => handleDelete(emp.id)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 size={18}/></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {view === "attendance" && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold border-b border-slate-700"><tr><th className="p-4">Employee</th><th className="p-4">Today's Status</th><th className="p-4">History</th></tr></thead>
              <tbody className="divide-y divide-slate-700">{filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-700 transition">
                  <td className="p-4"><div className="font-bold text-slate-200">{emp.name}</div><div className="text-xs text-slate-500">{emp.department}</div></td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => markAttendance(emp.id, "Present")} className="flex items-center gap-1 bg-transparent border border-green-800 text-green-400 px-4 py-1.5 rounded text-sm font-medium hover:bg-green-900 transition"><CheckCircle size={16} /> Present</button>
                    <button onClick={() => markAttendance(emp.id, "Absent")} className="flex items-center gap-1 bg-transparent border border-red-800 text-red-400 px-4 py-1.5 rounded text-sm font-medium hover:bg-red-900 transition"><XCircle size={16} /> Absent</button>
                  </td>
                  <td className="p-4"><button onClick={() => fetchHistory(emp)} className="text-slate-500 hover:text-blue-400 transition"><Clock size={20}/></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-bounce flex items-center gap-2 ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.type === "error" ? <XCircle size={20}/> : <CheckCircle size={20}/>}
          {toast.message}
        </div>
      )}

      {selectedEmp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="bg-slate-950 p-4 flex justify-between items-center text-white"><h3 className="font-bold">History: {selectedEmp.name}</h3><button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-white"><X size={20}/></button></div>
            <div className="p-4 max-h-60 overflow-y-auto space-y-2">
                {history.map((rec, i) => (
                  <div key={i} className="flex justify-between p-3 bg-slate-900 rounded border border-slate-800">
                    <span className="text-sm font-medium text-slate-300">{rec.date}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${rec.status === "Present" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{rec.status}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, active, onClick, open }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{icon}{open && <span className="font-medium">{label}</span>}</button>
);
const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-xl shadow-sm flex items-center justify-between ${color}`}><div><p className="text-slate-400 text-sm font-medium">{title}</p><h3 className="text-3xl font-bold text-white mt-1">{value}</h3></div><div className="p-3 bg-slate-900 rounded-full">{icon}</div></div>
);
const InputGroup = ({ label, value, onChange, placeholder }) => (
  <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">{label}</label><input className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-slate-600" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></div>
);