import React from 'react';
import type { TextInputProps } from '../types';

const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder = '', name }) => {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  );
};

export default TextInput;