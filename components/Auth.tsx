import React, { useState } from 'react';
import Welcome from './auth/Welcome.tsx';
import Login from './auth/Login.tsx';
import Signup from './auth/Signup.tsx';
import ForgotPassword from './auth/ForgotPassword.tsx';

interface AuthProps {
  handleGuestLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ handleGuestLogin }) => {
  const [view, setView] = useState('main');

  switch(view) {
    case 'login':
      return <Login setView={setView} />;
    case 'signup':
      return <Signup setView={setView} />;
    case 'forgot-password':
      return <ForgotPassword setView={setView} />;
    default:
      return <Welcome setView={setView} handleGuestLogin={handleGuestLogin}/>;
  }
};

export default Auth;