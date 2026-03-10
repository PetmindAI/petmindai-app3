import React from 'react';
import { Home, Store, MessageCircle, PawPrint, ShoppingCart, Stethoscope } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  const { totalItems } = useCart();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'marketplace', icon: Store, label: 'Shop' },
    { id: 'vets', icon: Stethoscope, label: 'Vets' },
    { id: 'assistant', icon: MessageCircle, label: 'AI Chat' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                  isActive ? 'text-amber-600' : 'text-gray-500 hover:text-amber-500'
                }`}
              >
                <div className="relative">
                  <Icon size={24} />
                  {item.id === 'cart' && totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
