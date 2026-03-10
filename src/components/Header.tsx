import React from 'react';
import { LogIn, LogOut, User, ShieldCheck, Package, Tag, ShoppingBag, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold text-gray-800">PetMind AI</span>
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <button
                onClick={() => navigate('/vets')}
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-all text-sm font-medium"
                title="Find a Vet"
              >
                <Stethoscope size={18} />
                <span className="hidden md:inline">Find a Vet</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-all text-sm font-medium"
                  title="Admin Dashboard"
                >
                  <ShieldCheck size={18} />
                  <span className="hidden md:inline">Admin</span>
                </button>
              )}
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-all text-sm font-medium"
                title="My Orders"
              >
                <ShoppingBag size={18} />
                <span className="hidden md:inline">Orders</span>
              </button>
              <div className="flex items-center gap-2 text-gray-700">
                <User size={20} />
                <span className="text-sm font-medium hidden sm:inline">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              <LogIn size={18} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
