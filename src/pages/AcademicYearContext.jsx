import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the Context
const AcademicYearContext = createContext();

// 2. Create the Provider (Wrap your app in this later)
export const AcademicYearProvider = ({ children }) => {
  // Default to the current real-world academic year, or load from local storage
  const [academicYear, setAcademicYear] = useState(
    localStorage.getItem('academicYear') || '2025-2026'
  );

  // Whenever the year changes, save it to LocalStorage automatically
  useEffect(() => {
    localStorage.setItem('academicYear', academicYear);
  }, [academicYear]);

  return (
    <AcademicYearContext.Provider value={{ academicYear, setAcademicYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

// 3. Create a custom hook so any page can easily ask "What year are we in?"
export const useAcademicYear = () => useContext(AcademicYearContext);