import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [navigationDirection, setNavigationDirection] = useState('right'); // 'left' or 'right'

  return (
    <NavigationContext.Provider value={{ navigationDirection, setNavigationDirection }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationDirection = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationDirection must be used within NavigationProvider');
  }
  return context;
};
