import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Routes from './routes';
import ThemeCustomization from './themes';

const App: React.FC = () => {
  return (
    <ThemeCustomization>
      <BrowserRouter>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeCustomization>
  );
};

export default App;