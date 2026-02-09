import { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, Users, Calendar, CheckCircle, XCircle, Clock, Search, Menu, X, Activity, Download, RefreshCw, Trash2, TrendingUp, ChevronRight, Edit2, AlertTriangle, PieChart
} from "lucide-react";

export default function App() {
  const [view, setView] = useState("dashboard"); 
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ 
    total_employees: 0, present_today: 0, absent_today: 0, 
    recent_activity: [], department_stats: [] 
  });
  
  // State for Forms & Modals
  const [form, setForm] = useState({ emp_code: "", name: "", email: "", department: "" });
  const [isEditing, setIsEditing] = useState(false); 
  const [editId, setEditId] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: "" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // --------------- CONFIGURATION ---------------
  // ✅ LIVE MODE (Uncomment for Deployment):
  const API_URL = "https://hrms-backend-crtf.onrender.com"; 
  
  // 💻 LOCAL MODE (Uncomment for Testing):
  // const API_URL = "http://127.0.0.1:8000"; 
  // ---------------------------------------------

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

  const restoreData = async () => {
    try {
      await axios.post(`${API_URL}/seed`);
      fetchData();
      showNotification("Demo Data Restored!");
    } catch(err) { showNotification("Failed to restore", "error"); }
  };

  const showNotification = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    if (!form.name || !form.emp_code) return;
    setLoading(true);
    try {
      if (isEditing) {
        // REAL UPDATE (PUT)
        await axios.put(`${API_URL}/employees/${editId}`, form);
        showNotification("Employee Updated Successfully!");
      } else {
        await axios.post(`${API_URL}/employees`, form);
        showNotification("Employee Added Successfully!");
      }
      setForm({ emp_code: "", name: "", email: "", department: "" });
      setIsEditing(false);
      fetchData(); 
    } catch (err) { showNotification("Error: check ID or Email", "error"); }
    setLoading(false);
  };

  const confirmDelete = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  const executeDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await axios.delete(`${API_URL}/employees/${deleteModal.id}`);
      fetchData();
      showNotification("Employee deleted.", "error");
    } catch(err) { showNotification("Failed to delete", "error"); }
    setDeleteModal({ show: false, id: null, name: "" });
  };

  const markAttendance = async (id, status) => {
    try {
      await axios.post(`${API_URL}/attendance`, { employee_id: id, date: selectedDate, status });
      fetchData(); 
      status === "Present" ? showNotification("Marked Present") : showNotification("Marked Absent", "error");
    } catch (err) { showNotification("Failed to mark", "error"); }
  };

  const fetchHistory = async (emp) => {
    const res = await axios.get(`${API_URL}/attendance/${emp.id}`);
    setHistory(res.data);
    setSelectedEmp(emp);
  };

  const downloadCSV = () => {
    const headers = "Name,Department,Date,Status,Time\n";
    const rows = stats.recent_activity.map(act => 
      `${act.name},${act.department || "N/A"},${act.date},${act.status},${act.time}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_report_${selectedDate}.csv`;
    a.click();
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[100dvh] bg-slate-900 font-sans text-slate-100 overflow-hidden w-full relative">
      
      {/* SMART COLLAPSIBLE WIDGET */}
      <div className="fixed bottom-6 right-6 z-30 group">
        <div className="bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-500/30 rounded-full h-14 w-14 group-hover:w-auto group-hover:px-6 flex items-center justify-center group-hover:justify-start gap-4 transition-all duration-300 overflow-hidden cursor-pointer border border-blue-400/30">
           <PieChart className="text-white min-w-[24px]" size={24} />
           <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto whitespace-nowrap">
             <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-blue-100 uppercase">Present</span>
                <span className="text-xl font-black text-white">{stats.present_today}</span>
             </div>
             <div className="h-8 w-[1px] bg-blue-400/50"></div>
             <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-blue-100 uppercase">Total</span>
                <span className="text-xl font-black text-white">{stats.total_employees}</span>
             </div>
           </div>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-950 p-4 flex justify-between items-center z-50 border-b border-slate-800 h-16">
        <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8" alt="Logo"/>
            <h1 className="text-xl font-bold tracking-wider text-white">HRMS<span className="text-blue-500">Pro</span></h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} pt-16 md:pt-0 shadow-xl flex flex-col`}>
        <div className="hidden md:flex p-6 items-center gap-3 h-20">
          <img src="/logo.png" className="w-8 h-8" alt="Logo"/>
          <h1 className="text-xl font-bold tracking-wider text-white">HRMS<span className="text-blue-500">Pro</span></h1>
        </div>
        <nav className="px-4 space-y-2 mt-4 flex-1">
          <NavButton icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === "dashboard"} onClick={() => {setView("dashboard"); setIsMobileMenuOpen(false);}} />
          <NavButton icon={<Users size={20} />} label="Employees" active={view === "employees"} onClick={() => {setView("employees"); setIsMobileMenuOpen(false);}} />
          <NavButton icon={<Calendar size={20} />} label="Attendance" active={view === "attendance"} onClick={() => {setView("attendance"); setIsMobileMenuOpen(false);}} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">AD</div>
            <div>
              <div className="text-sm font-bold">Admin User</div>
              <div className="text-xs text-slate-500">admin@ethara.ai</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative pt-16 md:pt-0 w-full max-w-full">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full pb-32">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{view}</h2>
              <p className="text-slate-400 text-sm">Overview of your organization</p>
            </div>
            <div className="w-full md:w-auto bg-slate-800 flex items-center px-4 py-2 rounded-lg border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <Search size={18} className="text-slate-400 mr-2"/>
              <input placeholder="Search ID or Name..." className="w-full md:w-48 outline-none text-sm bg-transparent placeholder-slate-500 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
          </header>

          {/* DASHBOARD VIEW */}
          {view === "dashboard" && (
            <div className="space-y-6">
              {stats.total_employees === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-blue-500/20 p-3 rounded-full"><RefreshCw className="text-blue-400 animate-spin-slow" size={24}/></div>
                     <div>
                        <h3 className="font-bold text-white">Welcome to HRMS Pro!</h3>
                        <p className="text-slate-400 text-sm">The database is currently empty. Restore demo data to see the magic.</p>
                     </div>
                  </div>
                  <button onClick={restoreData} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-lg shadow-blue-500/20">Restore Demo Data</button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Staff" value={stats.total_employees} icon={<Users size={24} className="text-blue-400"/>} color="border-l-4 border-blue-500 bg-slate-800" />
                <StatCard title="Present Today" value={stats.present_today} icon={<CheckCircle size={24} className="text-green-400"/>} color="border-l-4 border-green-500 bg-slate-800" />
                <StatCard title="Absent Today" value={stats.absent_today} icon={<XCircle size={24} className="text-red-400"/>} color="border-l-4 border-red-500 bg-slate-800" />
              </div>

              {/* Performance Overview */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2"><TrendingUp size={18} className="text-purple-400"/> Top Performance</h3>
                    <button onClick={() => setView("employees")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center bg-blue-500/10 px-3 py-1 rounded-full transition">View All <ChevronRight size={14}/></button>
                 </div>
                 <div className="space-y-5">
                    {employees.slice(0, 5).map(emp => (
                      <div key={emp.id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-300">{emp.name}</span>
                          <span className="text-slate-400 font-mono">{emp.attendance_rate}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${emp.attendance_rate > 75 ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-orange-500 to-red-400"}`} style={{ width: `${emp.attendance_rate}%` }}></div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <h3 className="font-bold text-slate-100 mb-6 flex items-center gap-2"><Activity size={18} className="text-blue-400"/> Recent Activity</h3>
                  <div className="space-y-0 divide-y divide-slate-700/50">
                    {stats.recent_activity.slice(0, 5).map((act, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-3 px-2 hover:bg-slate-700/30 rounded transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-slate-800 ${act.status === "Present" ? "bg-green-500 ring-green-500/30" : "bg-red-500 ring-red-500/30"}`}></div>
                          <div>
                            <div className="font-bold text-slate-200">{act.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{act.department}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${act.status === "Present" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{act.status}</span>
                          <div className="text-slate-500 text-xs mt-1 font-mono">{act.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES VIEW */}
          {view === "employees" && (
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2"><Users size={20}/> {isEditing ? "Edit Employee Details" : "Add New Employee"}</h3>
                  {isEditing && <button onClick={() => {setIsEditing(false); setForm({ emp_code: "", name: "", email: "", department: "" });}} className="text-xs text-red-400 hover:text-red-300">Cancel Edit</button>}
                </div>
                <form onSubmit={handleSubmitEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <InputGroup label="Emp ID" value={form.emp_code} onChange={v => setForm({...form, emp_code: v})} placeholder="Ex: EMP01" />
                  <InputGroup label="Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Ex: Ritul" />
                  <InputGroup label="Email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="Ex: email@ethara.ai" />
                  <InputGroup label="Dept" value={form.department} onChange={v => setForm({...form, department: v})} placeholder="Ex: Engineering" />
                  <button disabled={loading} className={`md:col-span-4 w-full text-white px-6 py-3 rounded-lg font-bold transition shadow-lg ${isEditing ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"}`}>
                    {isEditing ? "Update Changes" : "Create Employee"}
                  </button>
                </form>
              </div>
              
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden w-full max-w-[calc(100vw-2rem)] md:max-w-full shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-700">
                      <tr><th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Dept</th><th className="p-4">Performance</th><th className="p-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredEmployees.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-500"><div className="flex flex-col items-center"><Search size={32} className="mb-2 opacity-50"/><p>No employees found matching "{searchTerm}"</p></div></td></tr>
                      ) : (
                        filteredEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-700/50 transition group">
                            <td className="p-4"><span className="font-mono text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-300">{emp.emp_code}</span></td>
                            <td className="p-4"><div className="font-bold text-slate-200">{emp.name}</div><div className="text-xs text-slate-500">{emp.email}</div></td>
                            <td className="p-4"><span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded font-medium">{emp.department}</span></td>
                            <td className="p-4">
                              <div className="w-32">
                                  <div className="flex justify-between text-[10px] mb-1 text-slate-400 uppercase font-bold"><span>Attendance</span><span>{emp.attendance_rate}%</span></div>
                                  <div className="w-full bg-slate-900 rounded-full h-1.5"><div className={`h-1.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ${emp.attendance_rate >= 80 ? "bg-green-500 shadow-green-500/20" : "bg-orange-500 shadow-orange-500/20"}`} style={{ width: `${emp.attendance_rate}%` }}></div></div>
                              </div>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setForm(emp); setIsEditing(true); setEditId(emp.id); }} className="text-slate-500 hover:text-blue-400 p-2 bg-slate-900 rounded border border-slate-700 hover:border-blue-500 transition"><Edit2 size={16}/></button>
                              <button onClick={() => confirmDelete(emp.id, emp.name)} className="text-slate-500 hover:text-red-400 p-2 bg-slate-900 rounded border border-slate-700 hover:border-red-500 transition"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE VIEW */}
          {view === "attendance" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <span className="text-slate-400 text-sm font-bold bg-slate-900 px-3 py-1.5 rounded border border-slate-700">DATE</span>
                      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-900 border border-slate-600 text-white rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition"/>
                  </div>
                  <button onClick={downloadCSV} className="w-full md:w-auto flex justify-center items-center gap-2 text-blue-400 hover:text-white transition text-sm font-bold border border-blue-500/30 bg-blue-500/10 p-2 px-4 rounded hover:bg-blue-600 hover:border-blue-600 hover:text-white shadow-lg shadow-blue-500/10"><Download size={16}/> Download Report</button>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden w-full max-w-[calc(100vw-2rem)] md:max-w-full shadow-xl">
               <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-700"><tr><th className="p-4">Employee</th><th className="p-4">Rate</th><th className="p-4">Mark Status</th><th className="p-4">History</th></tr></thead>
                  <tbody className="divide-y divide-slate-700/50">{filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-700/50 transition">
                      <td className="p-4"><div className="font-bold text-slate-200">{emp.name}</div><div className="font-mono text-[10px] text-slate-500">{emp.emp_code}</div></td>
                      <td className="p-4"><span className={`text-[10px] font-black px-2 py-1 rounded border ${emp.attendance_rate > 75 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{emp.attendance_rate}%</span></td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => markAttendance(emp.id, "Present")} className="bg-slate-900 border border-green-800 text-green-400 px-4 py-1.5 rounded text-xs font-bold hover:bg-green-600 hover:text-white hover:border-green-600 transition shadow-sm">Present</button>
                        <button onClick={() => markAttendance(emp.id, "Absent")} className="bg-slate-900 border border-red-800 text-red-400 px-4 py-1.5 rounded text-xs font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition shadow-sm">Absent</button>
                      </td>
                      <td className="p-4"><button onClick={() => fetchHistory(emp)} className="text-slate-500 hover:text-blue-400 transition p-2 hover:bg-slate-700 rounded-full"><Clock size={20}/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
               </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TOAST & MODALS */}
      {toast.show && (
        <div className={`fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-10 px-6 py-3 rounded-xl shadow-2xl text-white font-bold animate-bounce flex items-center gap-3 z-50 border ${toast.type === "error" ? "bg-red-600/90 border-red-400 backdrop-blur-md" : "bg-green-600/90 border-green-400 backdrop-blur-md"}`}>
          {toast.type === "error" ? <XCircle size={20}/> : <CheckCircle size={20}/>}
          {toast.message}
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Employee?</h3>
                <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete <strong className="text-white">{deleteModal.name}</strong>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteModal({ show: false, id: null, name: "" })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition">Cancel</button>
                  <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition">Delete</button>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="bg-slate-950 p-4 flex justify-between items-center text-white border-b border-slate-800"><h3 className="font-bold flex items-center gap-2"><Clock size={18} className="text-blue-400"/> History: {selectedEmp.name}</h3><button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-white transition"><X size={20}/></button></div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                {history.length === 0 ? <p className="text-center text-slate-500 py-4">No records found.</p> : history.map((rec, i) => (
                  <div key={i} className="flex justify-between p-3 bg-slate-900 rounded-lg border border-slate-800/50 hover:border-slate-700 transition">
                    <span className="text-sm font-medium text-slate-300 font-mono">{rec.date}</span>
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${rec.status === "Present" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{rec.status}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub Components
const NavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{icon}<span className="font-medium">{label}</span></button>
);
const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-2xl shadow-lg flex items-center justify-between transition-transform hover:-translate-y-1 ${color}`}><div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p><h3 className="text-3xl font-black text-white mt-1">{value}</h3></div><div className="p-3 bg-slate-900/50 rounded-xl">{icon}</div></div>
);
const InputGroup = ({ label, value, onChange, placeholder }) => (
  <div className="flex-1 w-full"><label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest ml-1">{label}</label><input className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-xl text-sm outline-none transition-all shadow-inner" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></div>
);
