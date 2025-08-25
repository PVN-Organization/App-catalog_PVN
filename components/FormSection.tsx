
import React from 'react';
import type { FormSectionProps } from '../types';

const FormSection: React.FC<FormSectionProps> = ({ label, children }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
};

export default FormSection;
