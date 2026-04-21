import React from 'react';
import { useAcademicYear } from '../context/AcademicYearContext'; 

const C = { surface: '#ffffff', border: '#e2e8f0', text: '#1e293b', accent: '#3730a3', muted: '#475569', accentDim: '#eef2ff' };

export function GlobalYearSwitcher() {
  const { selectedYear, availableYears, updateSelectedYear } = useAcademicYear();
  
  if (availableYears.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: 12, 
      background: C.surface, padding: '6px 14px', 
      borderRadius: 12, border: `1px solid ${C.border}`, 
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
    }}>
      <div style={{ 
        width: 32, height: 32, borderRadius: 8, background: C.accentDim, 
        color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 
      }}>
        🗓️
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>
          Academic Year
        </span>
        <select
          value={selectedYear}
          onChange={e => updateSelectedYear(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', padding: 0 }}
        >
          {availableYears.map(y => (
            <option key={y._id} value={y.name}>{y.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}