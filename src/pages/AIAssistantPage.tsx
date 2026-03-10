import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShoppingCart, Star, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Vet {
  id: string;
  vet_name: string;
  clinic_name: string;
  specialization: string;
  city: string;
  rating: number;
  consultation_fee: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  products?: Product[];
  vets?: Vet[];
}

const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI Pet Care Assistant. How can I help you today? Feel free to ask me about pet nutrition, behavior, training, health concerns, or anything else related to your furry friend!",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      alert('Please login to use the AI assistant');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pet-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        products: data.recommendedProducts || [],
        vets: data.recommendedVets || [],
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error connecting to the AI service. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProduct(product.id);
    setTimeout(() => setAddedProduct(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    'Why is my dog scratching?',
    'What food is best for cats?',
    'How to train a puppy?',
    'Best grooming products for dogs?',
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-teal-50 to-cyan-50 pb-16">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">AI Pet Assistant</h1>
          <p className="opacity-90">Ask me anything about pet care</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-br from-teal-500 to-cyan-500'
                }`}
              >
                {message.sender === 'user' ? (
                  <User size={20} className="text-white" />
                ) : (
                  <Bot size={20} className="text-white" />
                )}
              </div>
              <div
                className={`max-w-xl px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-amber-500 text-white rounded-tr-none'
                    : 'bg-white shadow-md rounded-tl-none'
                }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.text}</p>

                {message.products && message.products.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Recommended Products:
                    </p>
                    {message.products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-50 rounded-lg p-3 flex gap-3 items-center"
                      >
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {product.description}
                          </p>
                          <p className="text-sm font-bold text-amber-600 mt-1">
                            ₹{product.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                            product.stock === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : addedProduct === product.id
                              ? 'bg-green-500 text-white'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          <ShoppingCart size={14} />
                          {addedProduct === product.id
                            ? 'Added!'
                            : product.stock === 0
                            ? 'Out of Stock'
                            : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.vets && message.vets.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Recommended Veterinarians:
                    </p>
                    {message.vets.map((vet) => (
                      <div
                        key={vet.id}
                        className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-800">
                              {vet.vet_name}
                            </h4>
                            <p className="text-xs text-green-600 font-medium">
                              {vet.clinic_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-xs font-bold text-gray-700">
                              {vet.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {vet.city}
                          </div>
                          <div>{vet.specialization}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-green-600">
                            ₹{vet.consultation_fee} consultation
                          </p>
                          <button
                            onClick={() => navigate(`/vet/${vet.id}`)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-all"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white shadow-md px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-2 font-medium">
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(question)}
                  className="text-sm bg-white hover:bg-teal-50 text-teal-600 px-3 py-2 rounded-full border border-teal-200 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about pet care..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
