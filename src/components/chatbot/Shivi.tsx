'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  WHATSAPP_NUMBER_DISPLAY,
} from '@/lib/contact';

interface Message {
  id: string;
  type: 'user' | 'shivi';
  content: string;
  timestamp: Date;
  options?: { label: string; action: string }[];
  serviceCard?: {
    title: string;
    description: string;
    icon: string;
    url: string;
  };
}

export function Shivi() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message when first opened
    if (isOpen && messages.length === 0) {
      addShiviMessage(
        "Hi! I'm Shivi, your booking assistant! 🚗\n\nHow can I help you today?",
        [
          { label: '🚗 Rent a Car', action: 'car-rental' },
          { label: '🏍️ Rent a Bike', action: 'bike-rental' },
          { label: '🚌 Rent a Bus', action: 'bus-rental' },
          { label: '🚚 Rent a Truck', action: 'truck-rental' },
          { label: '❓ I need help', action: 'help' },
        ]
      );
    }
  }, [isOpen]);

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addShiviMessage = (
    content: string,
    options?: { label: string; action: string }[],
    serviceCard?: { title: string; description: string; icon: string; url: string }
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      const message: Message = {
        id: Date.now().toString(),
        type: 'shivi',
        content,
        timestamp: new Date(),
        options,
        serviceCard,
      };
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    handleUserQuery(inputValue.toLowerCase());
    setInputValue('');
  };

  const handleOptionClick = (action: string) => {
    switch (action) {
      case 'car-rental':
        addUserMessage('I want to rent a car');
        addShiviMessage(
          "Great choice! 🚗 We offer various car rental options:",
          [
            { label: 'Round Trip', action: 'car-round-trip' },
            { label: 'One Way', action: 'car-one-way' },
            { label: 'Airport Transfer', action: 'car-airport' },
            { label: 'Self Drive Car', action: 'car-self-drive' },
            { label: 'Luxury Car', action: 'car-luxury' },
          ]
        );
        break;

      case 'bike-rental':
        addUserMessage('I want to rent a bike');
        addShiviMessage(
          "Perfect for adventures! 🏍️ Which type of bike?",
          [
            { label: 'Regular Bike', action: 'bike-regular' },
            { label: 'Activa/Scooter', action: 'bike-activa' },
            { label: 'Royal Enfield', action: 'bike-enfield' },
          ]
        );
        break;

      case 'bus-rental':
        addUserMessage('I want to rent a bus');
        addShiviMessage(
          "Great for group travel! 🚌 What do you need?",
          [
            { label: 'Outstation Trip', action: 'bus-outstation' },
            { label: 'Local/City Tour', action: 'bus-local' },
          ]
        );
        break;

      case 'truck-rental':
        addUserMessage('I want to rent a truck');
        addShiviMessage(
          "I can help with that! 🚚 What's your requirement?",
          [
            { label: 'Personal Moving', action: 'truck-personal' },
            { label: 'Commercial Transport', action: 'truck-commercial' },
          ]
        );
        break;

      case 'car-round-trip':
      case 'car-one-way':
      case 'car-airport':
      case 'car-self-drive':
      case 'car-luxury':
      case 'bike-regular':
      case 'bike-activa':
      case 'bike-enfield':
      case 'bus-outstation':
      case 'bus-local':
      case 'truck-personal':
      case 'truck-commercial':
        handleServiceSelection(action);
        break;

      case 'help':
        addUserMessage('I need help');
        addShiviMessage(
          "I'm here to help! 😊 What would you like to know?",
          [
            { label: '📍 Where do you operate?', action: 'locations' },
            { label: '💰 What are the prices?', action: 'pricing' },
            { label: '📞 How to contact support?', action: 'contact' },
            { label: '🎁 Do you have offers?', action: 'offers' },
          ]
        );
        break;

      case 'locations':
        addUserMessage('Where do you operate?');
        addShiviMessage(
          "We operate in 500+ cities across India! 🇮🇳\n\nPopular locations include:\n• Goa\n• Manali\n• Bangalore\n• Mumbai\n• Delhi\n• Jaipur\n• Leh Ladakh\n• Kerala\n\nAnd many more!",
          [{ label: 'Book Now', action: 'car-rental' }]
        );
        break;

      case 'pricing':
        addUserMessage('What are the prices?');
        addShiviMessage(
          "Prices vary based on:\n• Vehicle type\n• Duration\n• Location\n• Season\n\nTo get exact quotes:\n1. Select your service\n2. Fill the booking form\n3. Multiple vendors will send quotations\n4. Choose the best price!\n\nYou'll get competitive prices guaranteed! 💰",
          [{ label: 'Get Quote Now', action: 'car-rental' }]
        );
        break;

      case 'contact':
        addUserMessage('How to contact support?');
        addShiviMessage(
          `You can reach us at:\n\n📧 Email: ${CONTACT_EMAIL}\n📱 WhatsApp: ${WHATSAPP_NUMBER_DISPLAY}\n📞 Phone: ${CONTACT_PHONE}\n⏰ Available: 24/7\n\nWe are always here to help!`,
          [{ label: 'Start Booking', action: 'car-rental' }]
        );
        break;

      case 'offers':
        addUserMessage('Do you have offers?');
        addShiviMessage(
          "Yes! 🎁 We have amazing offers:\n\n🪙 Earn 50 Backr Tokens on every booking!\n🎡 Daily spin wheel - win up to 100 tokens\n💸 Convert tokens to Solana crypto\n📱 Download our app for exclusive deals\n\nStart booking to earn rewards!",
          [{ label: 'Book & Earn', action: 'car-rental' }]
        );
        break;

      default:
        addShiviMessage("I didn't quite get that. How can I assist you?");
    }
  };

  const handleServiceSelection = (action: string) => {
    const serviceMap: Record<string, { url: string; name: string }> = {
      'car-round-trip': { url: '/car-rental', name: 'Round Trip Car Rental' },
      'car-one-way': { url: '/car-rental/one-way', name: 'One Way Car Rental' },
      'car-airport': { url: '/car-rental/airport-transfer', name: 'Airport Transfer' },
      'car-self-drive': { url: '/self-drive-car-rentals', name: 'Self Drive Car' },
      'car-luxury': { url: '/luxury-car-rental', name: 'Luxury Car Rental' },
      'bike-regular': { url: '/bike-on-rent', name: 'Bike Rental' },
      'bike-activa': { url: '/activa-on-rent', name: 'Activa Rental' },
      'bike-enfield': { url: '/royal-enfield-on-rent', name: 'Royal Enfield' },
      'bus-outstation': { url: '/bus-rental', name: 'Bus Rental' },
      'bus-local': { url: '/local-bus-rental', name: 'Local Bus Rental' },
      'truck-personal': { url: '/truck-rental', name: 'Truck Rental' },
      'truck-commercial': { url: '/commercial-truck-rental', name: 'Commercial Truck' },
    };

    const service = serviceMap[action];
    if (service) {
      addUserMessage(service.name);
      addShiviMessage(
        `Perfect! Let me take you to the ${service.name} page where you can:\n\n✅ View all available options\n✅ Fill the booking form\n✅ Get quotes from multiple vendors\n✅ Choose the best deal\n\nClick below to continue! 👇`
      );

      // Add delay then redirect
      setTimeout(() => {
        window.location.href = service.url;
      }, 2000);
    }
  };

  const handleUserQuery = (query: string) => {
    if (query.includes('car') || query.includes('cab')) {
      handleOptionClick('car-rental');
    } else if (query.includes('bike') || query.includes('scooty') || query.includes('activa')) {
      handleOptionClick('bike-rental');
    } else if (query.includes('bus')) {
      handleOptionClick('bus-rental');
    } else if (query.includes('truck') || query.includes('tempo')) {
      handleOptionClick('truck-rental');
    } else if (query.includes('price') || query.includes('cost') || query.includes('charge')) {
      handleOptionClick('pricing');
    } else if (query.includes('location') || query.includes('city') || query.includes('where')) {
      handleOptionClick('locations');
    } else if (query.includes('contact') || query.includes('support') || query.includes('help')) {
      handleOptionClick('contact');
    } else if (query.includes('offer') || query.includes('discount') || query.includes('deal')) {
      handleOptionClick('offers');
    } else {
      addShiviMessage(
        "I can help you with:\n• Vehicle rentals (Car, Bike, Bus, Truck)\n• Pricing information\n• Location details\n• Booking assistance\n\nWhat would you like to know?",
        [
          { label: '🚗 Rent Vehicles', action: 'car-rental' },
          { label: '❓ Get Help', action: 'help' },
        ]
      );
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>

            {/* Tooltip */}
            <div className="absolute right-full mr-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Chat with Shivi 💬
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Shivi</h3>
                  <p className="text-xs text-blue-100">Your Booking Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white shadow-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>

                    {/* Options */}
                    {message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option.action)}
                            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition border border-gray-200"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
