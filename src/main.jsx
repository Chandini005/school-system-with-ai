import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App.jsx';
import authReducer from './store/authSlice.js';
import './index.css';

import { AcademicYearProvider } from './context/AcademicYearContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

console.log('[main.jsx] Script execution started.');

// Initialize Redux Store
const store = configureStore({
    reducer: {
        auth: authReducer
    }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('[main.jsx] FATAL: Root element not found!');
} else {
    console.log('[main.jsx] Root element found, starting render...');
    
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <Provider store={store}>
                    <ThemeProvider>
                        <AcademicYearProvider>
                            <App />
                        </AcademicYearProvider>
                    </ThemeProvider>
                </Provider>
            </React.StrictMode>
        );
        console.log('[main.jsx] Initial render command sent to React DOM.');
    } catch (err) {
        console.error('[main.jsx] Critical error during root render:', err);
    }
}
