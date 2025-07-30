import React from 'react';
import { X, Mail, Phone } from 'lucide-react';

interface DemoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoPopup({ isOpen, onClose }: DemoPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Version
          </h2>

                     {/* Message */}
           <p className="text-gray-600 mb-6 leading-relaxed">
             For demo purposes, please contact{' '}
             <span className="font-semibold text-orange-600">KLUGAI</span> to get full access to the platform.
           </p>

           {/* Contact info */}
           <div className="bg-orange-50 rounded-lg p-4 mb-6">
             <div className="flex items-center justify-center space-x-2 text-orange-700">
               <Phone className="w-4 h-4" />
               <span className="font-medium">Contact us for full access</span>
             </div>
             <button
               onClick={() => {
                 onClose();
                 // This will be handled by the parent component
                 window.dispatchEvent(new CustomEvent('openContactForm'));
               }}
               className="mt-3 w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
             >
               Open Contact Form
             </button>
           </div>

          {/* Demo credentials */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Demo Login Credentials:</p>
            <div className="text-left">
              <p className="text-sm"><span className="font-medium">Email:</span> admin@klug.com</p>
              <p className="text-sm"><span className="font-medium">Password:</span> Klug2025</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
} 