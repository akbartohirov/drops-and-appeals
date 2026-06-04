import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Modal from '../components/Modal';
import { 
  Users, 
  UserCheck, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  User,
  Shield,
  Lock
} from 'lucide-react';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Form States
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('User');
  const [formPassword, setFormPassword] = useState('');

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("Xodimlarni yuklashda xato:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');
    if (activeUser.id === userId) {
      alert("Siz joriy tizimga kirib turgan o'z hisobingizni o'chira olmaysiz!");
      return;
    }

    if (window.confirm("Haqiqatan ham ushbu operatorni tizimdan butunlay o'chirib tashlamoqchimisiz?")) {
      try {
        await apiService.deleteUser(userId);
        await fetchUsers();
      } catch (err) {
        alert("O'chirishda xatolik: " + err.message);
      }
    }
  };

  // Handle status toggle (Faol / Oflayn)
  const handleToggleStatus = async (userId) => {
    try {
      await apiService.toggleUserStatus(userId);
      await fetchUsers();
    } catch (err) {
      console.error("Status o'zgartirishda xato:", err);
    }
  };

  // Handle submit form (Create User)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newUser = {
      username: formUsername,
      email: formEmail,
      role: formRole,
      password: formPassword,
      status: 'Faol'
    };

    try {
      await apiService.createUser(newUser);
      setIsAddModalOpen(false);

      // Reset fields
      setFormUsername('');
      setFormEmail('');
      setFormRole('User');
      setFormPassword('');

      // Show success modal
      setIsSuccessModalOpen(true);

      // Refresh list
      await fetchUsers();
    } catch (err) {
      alert("Operator qo'shishda xatolik: " + err.message);
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  const activeAdmins = users.filter(u => u.role === 'Admin').length;
  const activeUsers = users.filter(u => u.status === 'Faol').length;

  return (
    <div className="space-y-stack-lg animate-slide-up font-body-md text-on-surface">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-primary">Admin paneli</h1>
          <p className="text-on-surface-variant text-body-lg">Tizim operatorlari xavfsizlik sozlamalari va hisoblarini boshqarish</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Yangi operator qo'shish</span>
        </button>
      </div>

      {/* Bento Grid Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between hover:shadow-sm transition-shadow h-32 bg-white shadow-sm">
          <div>
            <span className="text-on-surface-variant font-label-md text-label-md block mb-1">Jami foydalanuvchilar</span>
            <h2 className="font-display-md text-display-md text-on-surface font-bold">{totalUsers} ta</h2>
          </div>
          <div className="h-1 bg-surface-container rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${(activeUsers / totalUsers) * 100}%` }}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between hover:shadow-sm transition-shadow h-32 bg-white shadow-sm">
          <div>
            <span className="text-on-surface-variant font-label-md text-label-md block mb-1">Faol xodimlar</span>
            <h2 className="font-display-md text-display-md text-on-surface font-bold">{activeUsers} ta</h2>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold select-none flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {(activeUsers / totalUsers * 100).toFixed(0)}% faollik ko'rsatkichi
          </p>
        </div>

        {/* Card 3: Info alert */}
        <div className="col-span-1 md:col-span-2 bg-surface border border-outline-variant p-6 rounded-xl relative overflow-hidden group h-32 bg-white shadow-sm flex items-center justify-between">
          <div className="z-10">
            <h3 className="font-bold text-primary mb-1">Xavfsizlik Auditi</h3>
            <p className="text-on-surface-variant text-xs max-w-sm">Tizim operatorlari faolligi va xavfsizlik kalitlari muntazam ravishda avtomatik tekshiriladi.</p>
          </div>
          <Shield className="w-20 h-20 text-primary-container/10 flex-shrink-0 absolute right-4 bottom-4 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Operators List Table */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">Tizim operatorlari ro'yxati</h2>
            <span className="bg-surface-container-highest text-on-surface px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
              {users.length} ta xodim
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <svg className="animate-spin h-8 w-8 text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-outline font-medium">Foydalanuvchilar ro'yxati yuklanmoqda...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] uppercase text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="px-6 py-4 whitespace-nowrap">ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Foydalanuvchi nomi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Roli</th>
                  <th className="px-6 py-4 whitespace-nowrap">Yaratilgan sana</th>
                  <th className="px-6 py-4 whitespace-nowrap">Holati (Faoliyat)</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-md">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors group zebra-row">
                    <td className="px-6 py-4 text-code-sm font-mono text-on-surface-variant whitespace-nowrap">#{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary font-bold text-xs select-none">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface font-mono">{u.username}</p>
                          <p className="text-[11px] text-outline">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase select-none ${
                        u.role === 'Admin' 
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' 
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">{u.createdDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[11px] font-semibold transition-all hover:bg-surface-container active:scale-95 ${
                          u.status === 'Faol' 
                            ? 'text-emerald-700 border-emerald-300 bg-emerald-50' 
                            : 'text-outline border-outline-variant bg-surface'
                        }`}
                        title="Foydalanuvchi holatini o'zgartirish"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Faol' ? 'bg-emerald-600' : 'bg-outline-variant'}`}></span>
                        {u.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 hover:bg-error-container/20 rounded-lg text-error transition-colors active:scale-90"
                          title="Operatorni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: YANGI FOYDALANUVCHI QO'SHISH */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yangi foydalanuvchi qo'shish"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="block font-label-md text-label-md text-on-surface-variant">Foydalanuvchi nomi (Username)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Masalan: alisher_99"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-body-md font-mono"
              />
            </div>
          </div>

          {/* Email address */}
          <div className="space-y-1">
            <label className="block font-label-md text-label-md text-on-surface-variant">Email manzili</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="example@bank.uz"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-body-md"
              />
            </div>
          </div>

          {/* Role and Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Tizim roli</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md bg-white"
              >
                <option value="User">User (Operator)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-body-md"
                />
              </div>
            </div>
          </div>

          {/* Help notice */}
          <div className="p-3 bg-primary-fixed/20 border border-primary-fixed rounded-lg text-xs text-primary flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Yangi yaratilgan xodim tizimga kirish uchun username nomi va oxiriga <strong>123</strong> qo'shilgan paroldan foydalanadi (Masalan: {formUsername || 'username'} / {formUsername || 'username'}123).
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3 border-t border-outline-variant/30">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95"
              type="button"
            >
              Bekor qilish
            </button>
            <button
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 shadow-md font-semibold"
              type="submit"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: SUCCESS MUVAFFAQIYATLI FOYDALANUVCHI QO'SHILDI */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Muvaffaqiyatli!"
        maxWidth="max-w-md"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-5 text-on-tertiary-fixed">
            <CheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
          </div>
          <h3 className="text-headline-sm text-center mb-2 font-bold text-primary">Xodim qo'shildi!</h3>
          <p className="text-body-md text-on-surface-variant text-center mb-8 px-4 font-medium">
            Yangi tizim operatori muvaffaqiyatli ro'yxatdan o'tkazildi va foydalanish huquqlari joriy qilindi.
          </p>
          <button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full bg-primary text-white py-3 rounded-xl font-label-md hover:bg-primary-container transition-all shadow-sm active:scale-95"
          >
            Tushunarli
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
