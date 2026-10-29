import React, { useState } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { 
  ShieldAlert, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CreditCard
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAntifraud();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Tizimga kirishda xatolik yuz berdi!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-[#060a12] overflow-hidden select-none">
      {/* =========================================================================
          ANTIFRAUD VISUAL EFFECTS: Radar Sweeper, Threat Intercept Grid & Shield
          ========================================================================= */}
      
      {/* Cybernetic Grid Floor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Ambient Radial Glowing Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Rotating Antifraud Radar Concentric Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-blue-500/15 animate-[spin_60s_linear_infinite]" />
        
        {/* Dashed Intermediate Ring */}
        <div className="absolute w-[82%] h-[82%] rounded-full border border-dashed border-cyan-500/20 animate-[spin_40s_linear_infinite_reverse]" />
        
        {/* Core Radar Ring */}
        <div className="absolute w-[64%] h-[64%] rounded-full border border-blue-400/20" />
        <div className="absolute w-[44%] h-[44%] rounded-full border border-cyan-400/25" />

        {/* 360-degree Radar Scanning Sweep Beam */}
        <div 
          className="absolute inset-0 rounded-full animate-[spin_6s_linear_infinite] pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0.22) 0deg, rgba(6, 182, 212, 0.08) 45deg, transparent 90deg, transparent 360deg)'
          }}
        />

        {/* Ambient Antifraud Intercept Blips positioned on radar rings */}
        <div className="absolute top-[8%] left-[12%] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/90 border border-emerald-500/50 text-[11px] font-mono text-emerald-400 shadow-xl shadow-emerald-950/50 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>DROP INTERCEPT</span>
        </div>

        <div className="absolute bottom-[10%] right-[10%] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/90 border border-blue-500/50 text-[11px] font-mono text-blue-400 shadow-xl shadow-blue-950/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          <span>FIREWALL ACTIVE</span>
        </div>

        <div className="absolute top-[12%] right-[12%] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/90 border border-rose-500/50 text-[11px] font-mono text-rose-400 shadow-xl shadow-rose-950/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
          <span>CARD BLOCKED</span>
        </div>

        <div className="absolute bottom-[12%] left-[10%] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/50 text-[11px] font-mono text-cyan-400 shadow-xl shadow-cyan-950/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>KLIRING SCANNER</span>
        </div>
      </div>

      {/* =========================================================================
          LOGIN CARD: Sleek, strictly Login + Parol, no redundant text
          ========================================================================= */}
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-slate-950/85 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl shadow-[0_0_50px_rgba(15,23,42,0.8)] backdrop-blur-xl p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all">
          
          {/* Subtle Top Scanner Line Effect */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

          {/* Antifraud Visual Emblem */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              {/* Outer pulsing halo */}
              <div className="absolute -inset-2 rounded-2xl bg-blue-500/20 blur-md animate-pulse" />
              
              {/* Central Shield Box */}
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/30 via-slate-900 to-blue-950 border border-blue-400/40 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <ShieldAlert className="w-7 h-7 text-blue-400" />
                
                {/* Micro scanner laser beam inside the shield */}
                <div className="absolute inset-x-2 h-[1px] bg-cyan-300 shadow-[0_0_6px_#22d3ee] animate-[bounce_2.5s_infinite]" />
              </div>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                ANTIFRAUD
              </h1>
            </div>
          </div>

          {/* Clean Credentials Form: Strictly Login & Parol */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Input 1: Login */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Login
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Login"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Input 2: Parol */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parol"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Kirish Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
