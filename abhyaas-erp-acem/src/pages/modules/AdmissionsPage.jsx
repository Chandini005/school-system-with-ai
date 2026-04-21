import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/apiConfig';

export function AdmissionsPage() {
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAdmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAdmissions(data.data);
            } else {
                setError(data.message || 'Failed to fetch admissions');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admissions/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setAdmissions(adm => adm.map(a => a._id === id ? data.data : a));
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return { bg: 'var(--color-warning-dim, #fffbeb)', color: 'var(--color-warning, #b45309)' };
            case 'Contacted': return { bg: 'var(--color-accent-dim, #eff6ff)', color: 'var(--color-accent, #1d4ed8)' };
            case 'Accepted': return { bg: 'var(--color-success-dim, #f0fdf4)', color: 'var(--color-success, #15803d)' };
            case 'Rejected': return { bg: 'var(--color-danger-dim, #fef2f2)', color: 'var(--color-danger, #b91c1c)' };
            default: return { bg: 'var(--color-surface-alt, #f3f4f6)', color: 'var(--color-text-muted, #374151)' };
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>Loading admissions...</div>;
    }

    if (error) {
        return <div style={{ color: 'var(--color-danger)', textAlign: 'center', marginTop: 20 }}>Error: {error}</div>;
    }

    return (
        <div style={{ animation: 'fadeUp 0.35s ease', color: 'var(--color-text)' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.025em' }}>
                        Admission Enquiries
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, margin: 0 }}>
                        Manage all admission requests from the website
                    </p>
                </div>
                <div style={{ padding: '6px 16px', background: 'var(--color-accent-dim)', color: 'var(--color-accent)', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid var(--color-accent)' }}>
                    Total: {admissions.length}
                </div>
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--color-surface-alt)' }}>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent Name</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 20px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admissions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-faint)' }}>
                                        <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 12 }}>Inbox</div>
                                        <div style={{ fontSize: 14 }}>No admission enquiries found</div>
                                    </td>
                                </tr>
                            ) : (
                                admissions.map(a => {
                                    const stColor = getStatusColor(a.status);
                                    return (
                                        <tr key={a._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{a.parentName}</div>
                                                {a.message && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, maxWidth: 200, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{a.message}</div>}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                {a.mobile}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text)', fontWeight: 600 }}>
                                                {a.studentName || '-'}
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {a.className}
                                            </td>
                                            <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center',
                                                    padding: '4px 10px', 
                                                    borderRadius: 20, 
                                                    background: stColor.bg, 
                                                    color: stColor.color, 
                                                    fontSize: 11, 
                                                    fontWeight: 700,
                                                    border: `1px solid ${stColor.color}40`
                                                }}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                <select 
                                                    value={a.status} 
                                                    onChange={(e) => updateStatus(a._id, e.target.value)}
                                                    style={{ 
                                                        padding: '6px 10px', 
                                                        borderRadius: 8, 
                                                        border: '1px solid var(--color-border)', 
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: 'var(--color-text-muted)',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        background: 'var(--color-surface-alt)',
                                                        fontFamily: "'Inter', sans-serif"
                                                    }}
                                                >
                                                    <option value="Pending">Mark Pending</option>
                                                    <option value="Contacted">Mark Contacted</option>
                                                    <option value="Accepted">Mark Accepted</option>
                                                    <option value="Rejected">Mark Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
