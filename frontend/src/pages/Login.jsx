import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { User, Lock, Eye, EyeOff, LogIn, CheckCircle, AlertTriangle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const activeUser = localStorage.getItem('active_user');
    if (activeUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await apiService.login(username, password);
      setSuccess(true);
      setIsLoading(false);

      // Save active user in localStorage
      localStorage.setItem('active_user', JSON.stringify(user));

      // Delay navigation to show success animation
      setTimeout(() => {
        const origin = location.state?.from?.pathname || '/dashboard';
        navigate(origin, { replace: true });
      }, 1000);

    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || "Tizimga kirishda xatolik yuz berdi!");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 bg-background overflow-hidden font-body-md">
      {/* Background Pattern/Atmosphere */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-3xl -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-tertiary-fixed-dim/5 rounded-full blur-3xl -ml-64 -mb-64"></div>
      </div>

      <main className="w-full max-w-[440px] animate-slide-up">
        {/* Login Form Card */}
        <div className="bg-white p-8 rounded-xl border border-outline-variant shadow-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">Tizimga kirish</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-error-container text-on-error-container rounded-lg flex items-start gap-2.5 text-sm font-medium animate-slide-up border border-error/20">
                <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="username">
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || success}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  placeholder='username'
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || success}
                  className="w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  placeholder='********'
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || success}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container active:scale-90"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                disabled={isLoading || success}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary bg-surface"
              />
              <label htmlFor="remember" className="ml-2 font-body-md text-body-md text-on-surface-variant select-none cursor-pointer">
                Meni eslab qol
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className={`w-full font-label-md text-label-md py-4 rounded-lg transition-all duration-300 shadow-sm flex items-center justify-center gap-2 text-white font-semibold active:scale-[0.98] ${success
                ? 'bg-emerald-600'
                : 'bg-primary-container hover:bg-primary'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Tekshirilmoqda...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 animate-bounce" />
                  <span>Xush kelibsiz!</span>
                </>
              ) : (
                <>
                  <span>Kirish</span>
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>


      </main>
    </div>
  );
};

export default Login;
