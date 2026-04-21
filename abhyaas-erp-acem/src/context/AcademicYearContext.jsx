import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/apiConfig';

const AcademicYearContext = createContext();

/**
 * Robust JSON parsing helper to prevent crashing on malformed or missing localStorage data.
 */
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

export const AcademicYearProvider = ({ children }) => {
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(
    localStorage.getItem('selectedAcademicYear') || ''
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AcademicYearContext] Initialising...');
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      // 1. SAFELY extract token from nested persist state
      const persistRoot = localStorage.getItem('persist:root');
      const rootData = safeJsonParse(persistRoot);
      const authData = safeJsonParse(rootData?.auth);
      const token = authData?.token;

      if (!token) {
        console.warn('[AcademicYearContext] No auth token found in localStorage.');
      }

      const res = await fetch(`${API_URL}/academic-years`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (data.success) {
        setAvailableYears(data.data);
        
        // If no year selected, default to the active one
        if (!selectedYear) {
          const active = data.data.find(y => y.isActive);
          if (active) {
            updateSelectedYear(active.name);
          } else if (data.data.length > 0) {
            updateSelectedYear(data.data[0].name);
          }
        }
      }
    } catch (error) {
      console.error('[AcademicYearContext] Failed to fetch academic years:', error);
    } finally {
      console.log('[AcademicYearContext] Initialisation complete.');
      setLoading(false);
    }
  };

  const updateSelectedYear = (year) => {
    setSelectedYear(year);
    localStorage.setItem('selectedAcademicYear', year);
  };

  if (loading) {
    // Premium loading state to replace the white screen during initialization
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '500' }}>Initialising ABHYAAS ERP...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AcademicYearContext.Provider value={{ 
      selectedYear, 
      availableYears, 
      updateSelectedYear, 
      loading,
      refresh: fetchYears 
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
