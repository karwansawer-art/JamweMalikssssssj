import React from 'react';

interface AlertProps {
  message: string;
}

export const ErrorAlert: React.FC<AlertProps> = ({ message }) => (
  <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg text-sm">
    {message}
  </p>
);

export const SuccessAlert: React.FC<AlertProps> = ({ message }) => (
  <p className="text-center text-green-300 bg-green-900/50 p-3 rounded-lg text-sm">
    {message}
  </p>
);
