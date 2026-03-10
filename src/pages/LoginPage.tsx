import React, { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signInWithGoogle, signInWithFacebook, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithFacebook();
    } catch (err: any) {
      setError(err.message || 'Failed to login with Facebook');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await signInWithEmail(email, password);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-6">
            <span className="text-4xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Welcome to PetMind AI
          </h1>
          <p className="text-lg text-gray-600">
            Your complete AI pet care companion
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!showEmailForm ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleFacebookLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#166FE5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Mail size={20} />
                Login with Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => onNavigate('reset-password')}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Back to other options
              </button>
            </form>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-amber-600 hover:text-amber-700 font-bold"
              >
                Create new account
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 space-x-4">
          <Link
            to="/privacy"
            className="hover:text-amber-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            to="/terms"
            className="hover:text-amber-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
