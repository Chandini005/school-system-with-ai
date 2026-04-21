import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import { Link } from 'react-router-dom';

const UserProfile = () => {
    const user = useSelector(selectCurrentUser);

    if (!user) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 font-sans">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-textMain">User Profile</h1>
                <Link to={`/dashboard/${user.role.toLowerCase()}`} className="btn btn-primary-outline !py-1.5 !px-3">
                    &larr; Back to Dashboard
                </Link>
            </div>

            <div className="card !p-0 overflow-hidden">
                {/* Cover Photo / Header Banner */}
                <div className="h-32 bg-gradient-primary"></div>

                <div className="px-8 pb-8">
                    {/* Profile Photo Avatar */}
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="h-32 w-32 rounded-full border-4 border-white bg-primary/10 shadow-md flex items-center justify-center overflow-hidden">
                            {user.profilePhotoUrl ? (
                                <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-primary font-bold">{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="mb-2 space-x-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-textMain leading-tight">{user.name}</h2>
                                <p className="text-sm text-textMuted flex items-center mt-1">
                                    <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {user.email}
                                </p>
                            </div>

                            {/* Role-Specific Details Section */}
                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-md font-semibold text-textMain mb-4 uppercase tracking-wider text-xs">Role Specific Information</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">

                                    {user.role === 'Student' && (
                                        <>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Roll Number</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.rollNo || 'N/A'}</dd>
                                            </div>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Class/Standard</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.standard || 'N/A'}</dd>
                                            </div>
                                        </>
                                    )}

                                    {(user.role === 'Teacher' || user.role === 'Admin' || user.role === 'Principal') && (
                                        <>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Staff ID</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.teacherId || 'N/A'}</dd>
                                            </div>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Designation</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.designation || 'N/A'}</dd>
                                            </div>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Salary</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                                    {user.salary ? `$${user.salary.toLocaleString()}` : 'N/A'}
                                                </dd>
                                            </div>
                                            <div className="sm:col-span-1 border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                                                <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                                    {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                                                </dd>
                                            </div>
                                        </>
                                    )}

                                </dl>
                            </div>
                        </div>

                        {/* Account Settings / Quick Actions */}
                        <div className="pt-6 md:pt-0 md:pl-8 md:border-l md:border-gray-100 flex flex-col justify-center">
                            <div className="bg-primary/5 rounded-sms p-6 border border-primary/20 text-center">
                                <h3 className="text-sm font-semibold text-primary mb-2">Account Status</h3>
                                <p className="text-xs text-textMuted mb-4">You are securely logged into the portal.</p>
                                <button className="btn btn-primary-outline w-full">
                                    Edit Profile Info
                                </button>
                                <p className="text-xs text-textMuted mt-3 italic">Changes require admin validation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
