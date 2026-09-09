import React, { useState } from 'react';
import {
  Lock,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface TeacherLoginCardProps {
  onLogin: (password: string) => boolean;
  onCancel: () => void;
  defaultPasswordHint?: string;
}

export const TeacherLoginCard: React.FC<TeacherLoginCardProps> = ({
  onLogin,
  onCancel,
  defaultPasswordHint = '6415',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const success = onLogin(password.trim());
    if (!success) {
      setErrorMessage('密碼錯誤！請輸入正確的教師管理密碼（預設密碼：' + defaultPasswordHint + '）。');
      setIsSubmitting(false);
    }
  };

  const handleFillDefault = () => {
    setPassword(defaultPasswordHint);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-indigo-100" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">教師教學管理專區</h3>
          <p className="text-xs text-indigo-150 mt-1 opacity-90">
            試卷題庫增刪編修、動態配分與全班成績總表
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>此區域僅供任課教師登入使用，以保護試卷題目與學生成績隱私。</span>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="teacher-password-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  請輸入教師管理密碼 <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillDefault}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  title="帶入預設管理密碼 6415"
                >
                  帶入預設密碼 ({defaultPasswordHint})
                </button>
              </div>

              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="teacher-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="請輸入密碼 (預設: 6415)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-10 py-3 text-sm font-mono tracking-wider border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                id="btn-teacher-login-submit"
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md transition"
              >
                <span>解鎖並進入教師管理區</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-teacher-login-cancel"
                type="button"
                onClick={onCancel}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-xl transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>返回學生測驗區</span>
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              系統預設管理密碼為 <span className="font-mono font-bold text-slate-600">6415</span>。進入後台後可隨時更換。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
