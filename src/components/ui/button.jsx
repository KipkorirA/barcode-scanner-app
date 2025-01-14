import React from 'react';

export const Button = ({ children, onClick, className, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${className || ''}`}
  >
    {children}
  </button>
);

export default Button;
