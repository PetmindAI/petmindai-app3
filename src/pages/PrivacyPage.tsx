import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 mb-4 text-white hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-lg opacity-90">Last updated: March 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <section>
            <p className="text-gray-700 leading-relaxed">
              PetMind AI respects your privacy. This website may collect minimal user information to provide services such as account login, AI pet health analysis, and marketplace purchases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Information we may collect:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Email address when signing in with Google</li>
              <li>Basic authentication data</li>
              <li>User activity related to pet health queries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How we use information:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>To provide AI pet health analysis</li>
              <li>To manage user accounts</li>
              <li>To improve the PetMind AI platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Data protection:</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell, rent, or share personal information with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-party services:</h2>
            <p className="text-gray-700 leading-relaxed">
              This site may use services like Supabase authentication and Google Sign-In.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact:</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy concerns contact:{' '}
              <a
                href="mailto:subratak236@gmail.com"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                subratak236@gmail.com
              </a>
            </p>
          </section>

          <div className="pt-6 border-t flex gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              View Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
