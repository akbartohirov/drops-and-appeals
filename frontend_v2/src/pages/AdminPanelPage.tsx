import React, { useState } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ModalDialog } from '../components/common/ModalDialog';
import { SystemUserItem, SystemUserRole } from '../types/antifraud';
import {
  UserPlus,
  Trash2,
  X,
  Check,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ROLE_OPTIONS: SystemUserRole[] = ['Operator', 'Admin'];

export const AdminPanelPage: React.FC = () => {
  const {
    systemUsers,
    addSystemUser,
    toggleSystemUserStatus,
    updateSystemUserRole,
    deleteSystemUser,
    currentUser,
  } = useAntifraud();

  // Add User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    role: 'Operator' as SystemUserRole,
  });

  // Sync aria-invalid with native :user-invalid state on blur/input
  const syncAriaInvalid = (
    e: React.FocusEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const el = e.currentTarget;
    if (el.matches) {
      el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = newUserForm.username.trim();

    if (!trimmedUsername || !newUserForm.password) {
      setErrorMessage("Iltimos, login va parolni kiriting.");
      return;
    }

    try {
      await addSystemUser({
        username: trimmedUsername,
        password: newUserForm.password,
        role: newUserForm.role,
      });

      setIsAddModalOpen(false);
      setNewUserForm({
        username: '',
        password: '',
        role: 'Operator',
      });

      setSuccessMessage(
        `Yangi foydalanuvchi (@${trimmedUsername} — ${newUserForm.role}) muvaffaqiyatli qo'shildi!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Foydalanuvchi qo'shishda xatolik yuz berdi!");
    }
  };

  const handleDelete = async (user: SystemUserItem) => {
    if (currentUser && currentUser.id === user.id) {
      setErrorMessage("Siz joriy tizimga kirib turgan o'z hisobingizni o'chira olmaysiz!");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    try {
      await deleteSystemUser(user.id);
      setSuccessMessage(`Foydalanuvchi (@${user.username}) tizimdan o'chirildi.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Foydalanuvchini o'chirishda xatolik!");
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const columns: ColumnDef<SystemUserItem>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
          #{row.id}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'Foydalanuvchi nomi (Login)',
      render: (row) => {
        const initials = row.username.substring(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3 min-w-[160px]">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-mono text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-xs font-semibold font-mono text-slate-100">
              {row.username}
            </span>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Roli',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) =>
            updateSystemUserRole(row.id, e.target.value as SystemUserRole)
          }
          aria-label={`${row.username} uchun tizim roli`}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            row.role === 'Admin'
              ? 'bg-purple-950/70 text-purple-300 border-purple-700/60'
              : 'bg-blue-950/70 text-blue-300 border-blue-700/60'
          }`}
        >
          {ROLE_OPTIONS.map((roleOpt) => (
            <option
              key={roleOpt}
              value={roleOpt}
              className="bg-slate-900 text-slate-100"
            >
              {roleOpt}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdDate',
      header: 'Yaratilgan sana',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {row.createdDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Holati (Faoliyat)',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSystemUserStatus(row.id);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
            row.status === 'Faol'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/80'
          }`}
          title="Holatni o'zgartirish uchun bosing"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.status === 'Faol' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span>{row.status}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      sortable: false,
      align: 'center',
      render: (row) => {
        const isSelf = currentUser && currentUser.id === row.id;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              disabled={Boolean(isSelf)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSelf
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                  : 'border-red-900/50 bg-red-950/40 hover:bg-red-900/60 text-red-400 cursor-pointer'
              }`}
              title={
                isSelf
                  ? "Joriy foydalanuvchini o'chirib bo'lmaydi"
                  : "Foydalanuvchini o'chirish"
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Admin Panel
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/80">
              {systemUsers.length} ta foydalanuvchi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tizim foydalanuvchilari ro'yxati va yangi foydalanuvchi qo'shish
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
            <span>Yangi Foydalanuvchi Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Feedback Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-center justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users DataTable */}
      <DataTable
        data={systemUsers}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Login yoki rol bo'yicha qidirish..."
        searchField={(item) => `${item.username} ${item.role} ${item.id}`}
        pageSizeDefault={10}
        emptyMessage="Foydalanuvchilar topilmadi"
        exportFileName="antifrod_foydalanuvchilar_reyestri.csv"
      />

      {/* Add User Modal: Strictly Login, Parol, Role (Operator / Admin) */}
      <ModalDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        ariaLabel="Yangi Foydalanuvchi Qo'shish"
        maxWidthClass="max-w-md"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Yangi Foydalanuvchi Qo'shish
                  </h3>
                  <p className="text-xs text-slate-400">
                    Login, parol va rolni belgilang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              {/* 1. Login */}
              <div>
                <label
                  htmlFor="user-username"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Login <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="user-username"
                    type="text"
                    required
                    minLength={3}
                    aria-describedby="username-rules"
                    placeholder="Login kiriting"
                    value={newUserForm.username}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, username: e.target.value })
                    }
                    onBlur={syncAriaInvalid}
                    onInput={syncAriaInvalid}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 user-invalid:border-red-500"
                  />
                </div>
                <p id="username-rules" className="text-[10px] text-slate-500 mt-1">
                  Kamida 3 ta belgidan iborat login
                </p>
              </div>

              {/* 2. Parol */}
              <div>
                <label
                  htmlFor="user-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Parol <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    aria-describedby="password-rules"
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, password: e.target.value })
                    }
                    onBlur={syncAriaInvalid}
                    onInput={syncAriaInvalid}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 user-invalid:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p id="password-rules" className="text-[10px] text-slate-500 mt-1">
                  Kamida 4 ta belgidan iborat parol
                </p>
              </div>

              {/* 3. Role (Operator / Admin) */}
              <div>
                <label
                  htmlFor="user-role"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Roli <span className="text-red-400">*</span>
                </label>
                <select
                  id="user-role"
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({
                      ...newUserForm,
                      role: e.target.value as SystemUserRole,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Operator">Operator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
        </div>
      </ModalDialog>
    </div>
  );
};
