import React, { useState } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  onUpdatePassword: (newPassword: string) => void;
}

export const TeacherPasswordModal: React.FC<TeacherPasswordModalProps> = ({
  isOpen,
  onClose,
  currentPassword,
  onUpdatePassword,
}) => {
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (oldPasswordInput !== currentPassword) {
      setErrorMsg('原管理密碼輸入不正確，請重新確認。');
      return;
    }

    if (!newPasswordInput.trim()) {
      setErrorMsg('新密碼不可為空白。');
      return;
    }

    if (newPasswordInput.length < 4) {
      setErrorMsg('為確保後台安全，密碼長度建議至少 4 個字元。');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMsg('兩次輸入的新密碼不一致，請再次確認。');
      return;
    }

    onUpdatePassword(newPasswordInput.trim());
    setSuccessMsg(`管理密碼已成功更新！下次進入後台請使用新密碼。`);
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  const handleResetToDefault = () => {
    if (confirm('確定要將教師管理密碼重設為系統預設值「6415」嗎？')) {
      onUpdatePassword('6415');
      setSuccessMsg('管理密碼已成功恢復為系統預設密碼：6415');
      setErrorMsg(null);
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    }
  };

  return (
    <div
      id="teacher-password-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">教師管理密碼管理</h3>
              <p className="text-xs text-slate-500">管理教師後台登入存取權限與安全密碼</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Current Status Card */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-700 block">目前登入管理密碼：</span>
                <span className="text-xs font-mono font-bold text-indigo-900">
                  {showCurrentPw ? currentPassword : '••••••••'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-100/70 transition"
            >
              {showCurrentPw ? '隱藏密碼' : '顯示密碼'}
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                原管理密碼 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-old-password"
                  type="password"
                  required
                  placeholder="請輸入目前的管理密碼"
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                新管理密碼 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-new-password"
                  type={showNewPw ? 'text' : 'password'}
                  required
                  placeholder="請輸入新設定的密碼 (例如 6415 或新密碼)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                確認新管理密碼 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-confirm-password"
                  type={showNewPw ? 'text' : 'password'}
                  required
                  placeholder="請再次輸入新密碼"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium py-2 transition"
                title="快速恢復為系統預設 6415"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢復為預設 (6415)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  關閉
                </button>
                <button
                  id="btn-save-new-password"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  儲存新密碼
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
