import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 mb-4 text-white hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-lg opacity-90">Last updated: March 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <section>
            <p className="text-gray-700 leading-relaxed text-lg">
              Welcome to PetMind AI.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              PetMind AI provides AI-powered pet health information and a pet product marketplace.
            </p>
          </section>

          <section className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <h2 className="text-xl font-bold text-amber-800 mb-3">Important notice:</h2>
            <p className="text-amber-900 leading-relaxed">
              PetMind AI is not a replacement for professional veterinary advice. Always consult a licensed veterinarian for serious medical conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Users agree:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>To use the platform responsibly</li>
              <li>Not to misuse AI pet health recommendations</li>
              <li>To understand that AI results are informational</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Marketplace terms:</h2>
            <p className="text-gray-700 leading-relaxed">
              Products listed in the pet marketplace are subject to availability and pricing changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Liability:</h2>
            <p className="text-gray-700 leading-relaxed">
              PetMind AI is not responsible for health decisions made based on AI analysis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact:</h2>
            <p className="text-gray-700 leading-relaxed">
              <a
                href="mailto:subratak236@gmail.com"
                className="text-teal-600 hover:text-teal-700 underline"
              >
                subratak236@gmail.com
              </a>
            </p>
          </section>

          <div className="pt-6 border-t flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-all"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="px-6 py-3 border-2 border-teal-300 text-teal-700 rounded-lg font-medium bg-teal-50 hover:bg-teal-100 transition-all"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
