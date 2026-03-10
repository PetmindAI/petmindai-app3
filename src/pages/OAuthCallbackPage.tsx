import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('OAuth callback error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data?.session) {
          navigate('/marketplace');
        } else {
          setError('No session found. Please try logging in again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('Unexpected error during OAuth callback:', err);
        setError('An unexpected error occurred. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="text-red-600" size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Loader2 className="animate-spin text-amber-500" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Completing Sign In
        </h2>
        <p className="text-gray-600">
          Please wait while we verify your credentials...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
