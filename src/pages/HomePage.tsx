import React from 'react';
import { Heart, Sparkles, ShoppingBag, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-20 pt-16">
      <div className="relative h-96 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <img
          src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
          alt="Happy pets"
          className="w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              PetMind AI
            </h1>
            <p className="text-xl md:text-2xl font-medium drop-shadow-md">
              Your Complete Pet Care Companion
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Everything Your Pet Needs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From AI-powered health insights to premium pet products, PetMind AI
            is your one-stop solution for keeping your furry friends happy and healthy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div
            onClick={() => user ? onNavigate('assistant') : onNavigate('login')}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-3 rounded-xl">
                <Sparkles className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 ml-4">
                AI Pet Assistant
              </h3>
            </div>
            <p className="text-gray-600">
              Get instant answers to all your pet care questions. Our AI assistant
              provides expert advice on nutrition, behavior, training, and more.
            </p>
          </div>

          <div
            onClick={() => user ? onNavigate('scanner') : onNavigate('login')}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-br from-blue-400 to-cyan-400 p-3 rounded-xl">
                <Camera className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 ml-4">
                Health Scanner
              </h3>
            </div>
            <p className="text-gray-600">
              Upload photos of your pet for AI-powered health analysis. Get insights
              on their wellbeing and early detection of potential issues.
            </p>
          </div>

          <div
            onClick={() => user ? onNavigate('marketplace') : onNavigate('login')}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-br from-green-400 to-emerald-400 p-3 rounded-xl">
                <ShoppingBag className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 ml-4">
                Pet Marketplace
              </h3>
            </div>
            <p className="text-gray-600">
              Shop premium pet food, toys, and accessories. Carefully curated
              products for dogs, cats, and all your beloved pets.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-br from-rose-400 to-red-400 p-3 rounded-xl">
                <Heart className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 ml-4">
                Why Choose Us?
              </h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                AI-powered pet care guidance
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Premium quality products
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Fast delivery across India
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                24/7 customer support
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your Pet Care Journey Today
          </h2>
          <p className="text-lg md:text-xl mb-6 opacity-90">
            Join thousands of happy pet parents who trust PetMind AI
          </p>
          {user ? (
            <button
              onClick={() => onNavigate('marketplace')}
              className="bg-white text-amber-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors shadow-lg"
            >
              Explore Marketplace
            </button>
          ) : (
            <button
              onClick={() => onNavigate('signup')}
              className="bg-white text-amber-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors shadow-lg"
            >
              Get Started Free
            </button>
          )}
        </div>
      </div>

      <footer className="bg-gray-100 py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">PetMind AI</h3>
            <p className="text-gray-600 text-sm">Your Complete Pet Care Companion</p>
          </div>
          <div className="flex justify-center gap-6 text-sm text-gray-600">
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
            <span>•</span>
            <a
              href="mailto:subratak236@gmail.com"
              className="hover:text-amber-600 transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <a
              href="https://petmindapp.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-600 transition-colors"
            >
              petmindapp.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
