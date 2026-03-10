import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Check Your Email!
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to <strong>{email}</strong>.
              Please check your inbox and follow the link to reset your password.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-lg text-gray-600">
            Enter your email to receive reset instructions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-amber-600 hover:text-amber-700 font-bold"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
