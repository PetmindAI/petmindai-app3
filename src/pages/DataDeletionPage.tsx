import React from 'react';
import { Mail, Trash2, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DataDeletionPageProps {
  onNavigate: (page: string) => void;
}

const DataDeletionPage: React.FC<DataDeletionPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-red-100 p-4 rounded-full">
              <Trash2 className="text-red-600" size={48} />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
            Data Deletion Instructions
          </h1>

          <p className="text-gray-600 text-center mb-12 text-lg">
            Your privacy is important to us. Follow these instructions to request deletion of your data.
          </p>

          <div className="space-y-8">
            <div className="border-l-4 border-blue-500 pl-6 py-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
                <Shield className="mr-3 text-blue-500" size={28} />
                What Data We Collect
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Account information (email address, name)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Pet profiles and health records you create</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Purchase history and cart information</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>AI assistant conversation history</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Images uploaded for health scanning</span>
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-amber-500 pl-6 py-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
                <Mail className="mr-3 text-amber-500" size={28} />
                How to Request Data Deletion
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Option 1: Delete Your Account</p>
                <ol className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2 font-semibold">1.</span>
                    <span>Log in to your PetMind AI account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-semibold">2.</span>
                    <span>Navigate to Settings or Profile</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-semibold">3.</span>
                    <span>Click "Delete Account" and follow the prompts</span>
                  </li>
                </ol>

                <p className="font-semibold mt-6">Option 2: Email Request</p>
                <p>
                  Send an email to{' '}
                  <a
                    href="mailto:support@petmindapp.in"
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    support@petmindapp.in
                  </a>{' '}
                  with the subject line "Data Deletion Request\" and include:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your registered email address</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your full name associated with the account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Confirmation that you want to permanently delete all your data</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-6 py-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
                <Clock className="mr-3 text-green-500" size={28} />
                Processing Timeline
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">Immediate:</span> Your account will be deactivated immediately upon request
                </p>
                <p>
                  <span className="font-semibold">Within 30 days:</span> All your personal data will be permanently deleted from our systems
                </p>
                <p>
                  <span className="font-semibold">Backup deletion:</span> Data in backups will be purged within 90 days
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-2">Important Notes:</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Data deletion is permanent and cannot be reversed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You will receive a confirmation email once deletion is complete</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Some data may be retained for legal or regulatory compliance purposes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Active subscriptions will be cancelled upon account deletion</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-3">Need Help?</h3>
              <p className="text-gray-700 mb-4">
                If you have questions about data deletion or need assistance, please contact our support team:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:support@petmindapp.in"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
                >
                  Email Support
                </a>
                <Link
                  to="/privacy"
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-semibold"
                >
                  View Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <button
              onClick={() => onNavigate('')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage;
