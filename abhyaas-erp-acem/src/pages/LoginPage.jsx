import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, authStart, authFailure, selectCurrentSchoolId } from '../store/authSlice';

const LoginPage = () => {
    const { schoolCode } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const school_id = useSelector(selectCurrentSchoolId) || schoolCode;

    // Modes: 'login', 'forgot', 'verify', 'reset'
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ 
        loginId: '',
        password: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [localError, setLocalError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const { isLoading: reduxLoading } = useSelector(state => state.auth || { isLoading: false });

    const isLoading = loading || reduxLoading;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMsg('');

        if (mode === 'login') {
            dispatch(authStart());
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        loginId: formData.loginId || formData.email, 
                        password: formData.password, 
                        school_id 
                    })
                });
                const data = await response.json();
                if (data.success) {
                    dispatch(setCredentials({ user: data.user, token: data.token, school_id: data.user.school_id }));
                    navigate(`/dashboard/${data.user.role.toLowerCase()}`);
                } else {
                    setLocalError(data.message || 'Login failed');
                    dispatch(authFailure(data.message));
                }
            } catch (err) {
                setLocalError('Network error connecting to login service.');
                dispatch(authFailure('Network error'));
            }
        } 
        
        else if (mode === 'forgot') {
            setLoading(true);
            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: formData.loginId })
                });
                const data = await res.json();
                if (data.success) {
                    setSuccessMsg('OTP sent! Check console log (dev mode).');
                    setMode('verify');
                } else {
                    setLocalError(data.message);
                }
            } catch (err) {
                setLocalError('Failed to request OTP. Try again.');
            }
            setLoading(false);
        }

        else if (mode === 'verify') {
            setLoading(true);
            try {
                const res = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: formData.loginId, otp: formData.otp })
                });
                const data = await res.json();
                if (data.success) {
                    setSuccessMsg('OTP verified! Set your new password.');
                    setMode('reset');
                } else {
                    setLocalError(data.message);
                }
            } catch (err) {
                setLocalError('Verification failed. Try again.');
            }
            setLoading(false);
        }

        else if (mode === 'reset') {
            if (formData.newPassword !== formData.confirmPassword) {
                return setLocalError('Passwords do not match');
            }
            if (formData.newPassword.length < 6) {
                return setLocalError('Password must be at least 6 characters');
            }
            setLoading(true);
            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        loginId: formData.loginId, 
                        otp: formData.otp, 
                        newPassword: formData.newPassword 
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setSuccessMsg('Password reset successful!');
                    setTimeout(() => {
                        setMode('login');
                        setFormData({ loginId: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
                        setSuccessMsg('');
                    }, 1800);
                } else {
                    setLocalError(data.message);
                }
            } catch (err) {
                setLocalError('Reset failed. Try again.');
            }
            setLoading(false);
        }
    };

    const modeTitle = {
        login: 'Welcome Back',
        forgot: 'Forgot Password',
        verify: 'Verify OTP',
        reset: 'Set New Password'
    };

    const modeSubtitle = {
        login: 'Sign in to access your ERP dashboard',
        forgot: 'Enter your Login ID — OTP will be sent to your email',
        verify: 'Enter the 6-digit OTP sent to your registered email',
        reset: 'Create a strong, new password to secure your account'
    };

    const btnLabel = {
        login: isLoading ? 'Signing In...' : 'Sign In →',
        forgot: isLoading ? 'Sending OTP...' : 'Send OTP →',
        verify: isLoading ? 'Verifying...' : 'Verify Code →',
        reset: isLoading ? 'Resetting...' : 'Reset Password →'
    };

    /* Step indicator for non-login modes */
    const steps = ['Enter ID', 'Verify OTP', 'New Password'];
    const stepIndex = { forgot: 0, verify: 1, reset: 2 };

    return (
        <div style={{
            minHeight: '100vh',
            fontFamily: '"Sora", "Inter", sans-serif',
            background: 'var(--color-bg, #0a1128)',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--color-text, #fff)',
            overflowY: 'auto',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-orb {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50%       { opacity: 0.7; transform: scale(1.06); }
                }

                .lp-input {
                    width: 100%;
                    padding: 11px 14px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.13);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.9rem;
                    font-family: inherit;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    outline: none;
                }
                .lp-input:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96,165,250,0.18);
                }
                .lp-input::placeholder { color: rgba(255,255,255,0.28); }

                .lp-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    box-shadow: 0 4px 18px rgba(59,130,246,0.38);
                    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
                    letter-spacing: 0.01em;
                }
                .lp-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59,130,246,0.5);
                }
                .lp-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }
                .lp-back:hover { color: #93c5fd !important; }
                .lp-forgot:hover { color: #93c5fd !important; }
            `}</style>

            {/* ── Navbar ─────────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(10,17,40,0.92)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid rgba(99,179,237,0.1)',
                padding: '0 1.5rem',
                height: '58px',
                display: 'flex', alignItems: 'center',
            }}>
                <div style={{
                    width: '100%', maxWidth: '1200px', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '6px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '900', color: 'white',
                        }}>E</div>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                            Abhyaas ERP
                        </span>
                    </Link>

                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        {['Home', 'About', 'Contact'].map(link => (
                            <Link key={link} to="/" style={{
                                color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
                                fontSize: '0.82rem', fontWeight: '500', transition: 'color 0.2s',
                            }}
                                onMouseEnter={e => e.target.style.color = 'white'}
                                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
                            >{link}</Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── Main ───────────────────────────────────────────── */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 1rem 2rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Background orbs */}
                <div style={{
                    position: 'absolute', top: '18%', left: '12%',
                    width: '340px', height: '340px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%)',
                    animation: 'pulse-orb 5s ease-in-out infinite', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '12%', right: '10%',
                    width: '260px', height: '260px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)',
                    animation: 'pulse-orb 6s 1.5s ease-in-out infinite', pointerEvents: 'none',
                }} />

                {/* Card container */}
                <div style={{
                    width: '100%', maxWidth: '420px',
                    animation: 'fadeInUp 0.55s ease both',
                }}>
                    <Link to="/" className="lp-back" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                        fontSize: '0.8rem', fontWeight: '500',
                        marginBottom: '1rem', transition: 'color 0.2s',
                    }}>
                        ← Back to Home
                    </Link>

                    {/* Login Card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(22px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '18px',
                        padding: '1.6rem',
                        boxShadow: '0 24px 56px rgba(0,0,0,0.5)',
                        width: '100%',
                    }}>
                        {/* Header */}
                        <h1 style={{
                            fontSize: '1.6rem', fontWeight: '800', color: 'white',
                            marginBottom: '0.3rem', letterSpacing: '-0.4px',
                        }}>
                            {modeTitle[mode]}
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem',
                            marginBottom: mode === 'login' ? '1.4rem' : '1rem', lineHeight: '1.5',
                        }}>
                            {modeSubtitle[mode]}
                        </p>

                        {/* Step progress (forgot/verify/reset) */}
                        {mode !== 'login' && (
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '1.2rem' }}>
                                {steps.map((s, i) => (
                                    <div key={s} style={{ flex: 1 }}>
                                        <div style={{
                                            height: '3px', borderRadius: '3px',
                                            background: i <= stepIndex[mode]
                                                ? 'linear-gradient(90deg,#3b82f6,#8b5cf6)'
                                                : 'rgba(255,255,255,0.1)',
                                            transition: 'background 0.3s',
                                        }} />
                                        <p style={{
                                            fontSize: '0.65rem', marginTop: '4px', textAlign: 'center',
                                            color: i <= stepIndex[mode] ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                                        }}>{s}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error */}
                        {localError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.28)',
                                borderRadius: '9px', padding: '9px 12px',
                                color: '#fca5a5', fontSize: '0.82rem',
                                marginBottom: '1rem', fontWeight: '500',
                                display: 'flex', alignItems: 'center', gap: '7px',
                            }}>
                                <span>⚠️</span> {localError}
                            </div>
                        )}

                        {/* Success */}
                        {successMsg && (
                            <div style={{
                                background: 'rgba(34,197,94,0.12)',
                                border: '1px solid rgba(34,197,94,0.28)',
                                borderRadius: '9px', padding: '9px 12px',
                                color: '#86efac', fontSize: '0.82rem',
                                marginBottom: '1rem', fontWeight: '500',
                                display: 'flex', alignItems: 'center', gap: '7px',
                            }}>
                                <span>✅</span> {successMsg}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            {/* Login ID field — shown in login & forgot modes */}
                            {(mode === 'login' || mode === 'forgot') && (
                                <div style={{ marginBottom: '0.9rem' }}>
                                    <label style={{
                                        display: 'block', color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.7rem', fontWeight: '700',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                    }}>Login ID / Username</label>
                                    <input
                                        id="loginId"
                                        name="loginId"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        placeholder="e.g. AB-STD-1001"
                                        value={formData.loginId}
                                        onChange={handleChange}
                                        className="lp-input"
                                    />
                                </div>
                            )}

                            {/* Password field — login mode only */}
                            {mode === 'login' && (
                                <div style={{ marginBottom: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.7rem', fontWeight: '700',
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                        }}>Password</label>
                                        <span
                                            className="lp-forgot"
                                            onClick={() => { setMode('forgot'); setLocalError(''); }}
                                            style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="lp-input"
                                    />
                                </div>
                            )}

                            {/* OTP field — verify mode */}
                            {mode === 'verify' && (
                                <div style={{ marginBottom: '0.9rem' }}>
                                    <label style={{
                                        display: 'block', color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.7rem', fontWeight: '700',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                    }}>6-Digit OTP</label>
                                    <input
                                        name="otp"
                                        type="text"
                                        required
                                        maxLength="6"
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        className="lp-input"
                                        style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.1rem' }}
                                    />
                                </div>
                            )}

                            {/* New password + confirm — reset mode */}
                            {mode === 'reset' && (
                                <>
                                    <div style={{ marginBottom: '0.9rem' }}>
                                        <label style={{
                                            display: 'block', color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.7rem', fontWeight: '700',
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            marginBottom: '6px',
                                        }}>New Password</label>
                                        <input
                                            name="newPassword"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="lp-input"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '0.9rem' }}>
                                        <label style={{
                                            display: 'block', color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.7rem', fontWeight: '700',
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            marginBottom: '6px',
                                        }}>Confirm Password</label>
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="lp-input"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Submit button */}
                            <button type="submit" disabled={isLoading} className="lp-btn" style={{ marginTop: '0.4rem' }}>
                                {btnLabel[mode]}
                            </button>

                            {/* Cancel link for non-login modes */}
                            {mode !== 'login' && (
                                <div
                                    onClick={() => { setMode('login'); setLocalError(''); setSuccessMsg(''); }}
                                    style={{
                                        textAlign: 'center', marginTop: '0.9rem',
                                        color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem',
                                        cursor: 'pointer', transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
                                >
                                    ← Cancel and go back to login
                                </div>
                            )}
                        </form>

                        {/* Footer note */}
                        <div style={{
                            marginTop: '1.2rem', paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.07)',
                            textAlign: 'center',
                        }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
                                For assistance, contact school administration.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                textAlign: 'center', padding: '1rem',
                color: 'rgba(255,255,255,0.18)', fontSize: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
                © 2025 Abhyaas ERP. All rights reserved.
            </div>
        </div>
    );
};

export default LoginPage;