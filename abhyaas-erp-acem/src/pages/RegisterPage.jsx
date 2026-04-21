import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentSchoolId } from '../store/authSlice';

const RegisterPage = () => {
    const { schoolCode } = useParams();
    // Using global school_id or falling back to param
    const school_id = useSelector(selectCurrentSchoolId) || schoolCode;

    const [formData, setFormData] = useState({
        role: 'Student', // Default
        name: '', email: '', password: '', profilePhotoUrl: '',

        // Student specifics
        rollNo: '', fatherName: '', motherName: '', dob: '', gender: '',
        className: '', section: '', admissionDate: '', mobile: '', address: '',

        // Teacher specifics
        teacherId: '', qualification: '', department: '', experience: '',
        joiningDate: '', salary: '', username: '',

        // Admin specifics
        adminId: '', position: '', accessLevel: '',

        // Principal specifics
        principalId: '', officeContact: '', officeAddress: ''
    });

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        let { name, value } = e.target;
        let newErrors = { ...errors };

        if (e.target.type === 'tel' || name === 'mobile' || name === 'officeContact') {
            value = value.replace(/\D/g, '').slice(0, 10);
            if (value && value.length !== 10) newErrors[name] = 'Phone number must be exactly 10 digits';
            else delete newErrors[name];
        }

        if (name === 'password') {
            const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (value && !pwdRegex.test(value)) newErrors.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, & 1 special char required';
            else delete newErrors.password;
        }

        setErrors(newErrors);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = (() => {
        if (Object.keys(errors).length > 0) return false;
        if (!formData.name || !formData.email || !formData.password || !formData.role) return false;

        if (formData.role === 'Student') {
            if (!formData.rollNo || !formData.fatherName || !formData.motherName || !formData.dob || !formData.gender || !formData.className || !formData.section || !formData.admissionDate || !formData.mobile || !formData.address) return false;
        } else if (formData.role === 'Teacher') {
            if (!formData.teacherId || !formData.qualification || !formData.department || !formData.experience || !formData.joiningDate || !formData.mobile || !formData.address || !formData.username) return false;
        } else if (formData.role === 'Admin') {
            if (!formData.adminId || !formData.position || !formData.mobile || !formData.username || !formData.accessLevel) return false;
        } else if (formData.role === 'Principal') {
            if (!formData.principalId || !formData.qualification || !formData.experience || !formData.joiningDate || !formData.officeContact || !formData.username || !formData.officeAddress) return false;
        }
        return true;
    })();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profilePhotoUrl: `https://fakeupload.com/photos/${file.name}` });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        // Core payload shared across all roles
        const payload = {
            school_id,
            role: formData.role,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            profilePhotoUrl: formData.profilePhotoUrl,
        };

        // Attach specific fields based on the selected role
        if (formData.role === 'Student') {
            Object.assign(payload, {
                rollNo: formData.rollNo, fatherName: formData.fatherName, motherName: formData.motherName,
                dob: formData.dob, gender: formData.gender, standard: formData.className, // Mapping className to standard
                section: formData.section, admissionDate: formData.admissionDate, mobile: formData.mobile, address: formData.address
            });
        } else if (formData.role === 'Teacher') {
            Object.assign(payload, {
                teacherId: formData.teacherId, qualification: formData.qualification, designation: formData.department, // Mapping dept to designation
                experience: formData.experience, joiningDate: formData.joiningDate, mobile: formData.mobile, address: formData.address,
                salary: Number(formData.salary) || undefined, username: formData.username
            });
        } else if (formData.role === 'Admin') {
            Object.assign(payload, {
                adminId: formData.adminId, designation: formData.position, mobile: formData.mobile,
                username: formData.username, accessLevel: formData.accessLevel
            });
        } else if (formData.role === 'Principal') {
            Object.assign(payload, {
                principalId: formData.principalId, qualification: formData.qualification, experience: formData.experience,
                joiningDate: formData.joiningDate, officeContact: formData.officeContact, username: formData.username, officeAddress: formData.officeAddress
            });
        }

        try {
            const response = await fetch('/api/public/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success || response.ok) {
                setSuccessMsg('Registration submitted successfully. Awaiting Admin approval.');
                // Scroll to top to see success message
                window.scrollTo(0, 0);
            } else {
                setErrorMsg(data.message || 'Registration failed');
            }
        } catch (err) {
            setErrorMsg('Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to render the common input style
    const renderInput = (name, placeholder, type = "text", required = false, pattern) => {
        let maxLen = undefined;
        if (['name', 'fatherName', 'motherName', 'username'].includes(name)) maxLen = 50;
        else if (name === 'email') maxLen = 100;
        else if (name === 'address' || name === 'officeAddress') maxLen = 200;

        return (
            <div className="form-group">
                <label className="block font-semibold mb-2 text-sm text-slate-700" htmlFor={name}>{placeholder} {required && <span className="text-red-500">*</span>}</label>
                <input
                    type={type} name={name} value={formData[name] || ''} onChange={handleChange} required={required}
                    pattern={pattern}
                    maxLength={maxLen || (type === 'tel' ? 10 : undefined)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-sm"
                    placeholder={`Enter ${placeholder}`}
                />
                {errors[name] && <div className="text-red-500 text-xs mt-1">{errors[name]}</div>}
            </div>
        );
    };

    // Render Role-Specific Fields
    const renderDynamicFields = () => {
        switch (formData.role) {
            case 'Student':
                return (
                    <>
                        {renderInput('rollNo', 'Student ID / Roll No', 'text', true)}
                        {renderInput('fatherName', 'Father Name', 'text', true)}
                        {renderInput('motherName', 'Mother Name', 'text', true)}
                        {renderInput('dob', 'Date of Birth', 'date', true)}
                        <div className="form-group">
                            <label className="block font-semibold mb-2 text-sm text-slate-700">Gender <span className="text-red-500">*</span></label>
                            <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-sm">
                                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </div>
                        {renderInput('className', 'Class', 'text', true)}
                        {renderInput('section', 'Section', 'text', true)}
                        {renderInput('admissionDate', 'Admission Date', 'date', true)}
                        {renderInput('mobile', 'Mobile Number', 'tel', true, '[0-9]{10}')}
                        {renderInput('address', 'Address', 'text', true)}
                    </>
                );
            case 'Teacher':
                return (
                    <>
                        {renderInput('teacherId', 'Teacher ID', 'text', true)}
                        {renderInput('qualification', 'Qualification', 'text', true)}
                        {renderInput('department', 'Subject / Department', 'text', true)}
                        {renderInput('experience', 'Experience (Years)', 'number', true)}
                        {renderInput('joiningDate', 'Date of Joining', 'date', true)}
                        {renderInput('mobile', 'Mobile Number', 'tel', true, '[0-9]{10}')}
                        {renderInput('address', 'Address', 'text', true)}
                        {renderInput('salary', 'Salary (Optional)', 'number')}
                        {renderInput('username', 'Username', 'text', true)}
                    </>
                );
            case 'Admin':
                return (
                    <>
                        {renderInput('adminId', 'Admin ID', 'text', true)}
                        {renderInput('position', 'Role / Position', 'text', true)}
                        {renderInput('mobile', 'Mobile No.', 'tel', true, '[0-9]{10}')}
                        {renderInput('username', 'Username', 'text', true)}
                        <div className="md:col-span-2 form-group">
                            <label className="block font-semibold mb-2 text-sm text-slate-700">Access Level <span className="text-red-500">*</span></label>
                            <select name="accessLevel" value={formData.accessLevel} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-sm">
                                <option value="">Select Access Level</option><option value="Super Admin">Super Admin</option><option value="Staff Admin">Staff Admin</option>
                            </select>
                        </div>
                    </>
                );
            case 'Principal':
                return (
                    <>
                        {renderInput('principalId', 'Principal ID', 'text', true)}
                        {renderInput('qualification', 'Qualification', 'text', true)}
                        {renderInput('experience', 'Experience (Years)', 'number', true)}
                        {renderInput('joiningDate', 'Date of Joining', 'date', true)}
                        {renderInput('officeContact', 'Office Contact No.', 'tel', true, '[0-9]{10}')}
                        {renderInput('username', 'Username', 'text', true)}
                        <div className="sm:col-span-2">{renderInput('officeAddress', 'Office Address', 'text', true)}</div>
                    </>
                );
            default:
                return null;
        }
    };

    if (successMsg) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center p-4 bg-sky-50">
                <div className="w-full max-w-md text-center space-y-6 bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Success!</h2>
                    <p className="text-slate-600">{successMsg}</p>
                    <div className="pt-4">
                        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-300 ease-in-out bg-sky-500 text-white shadow-md hover:bg-sky-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-200/50">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-sky-50 text-slate-800">
            <div className="w-full max-w-3xl space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight">Create an Account</h2>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        {/* For portal: <span className="font-semibold text-primary uppercase">{schoolCode}</span> */}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errorMsg && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    {/* CORE FIELDS */}
                    <div className="border-b border-gray-100 pb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-sky-50">Basic Information</h3>
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
                            <div className="md:col-span-2 form-group">
                                <label className="block font-semibold mb-2 text-sm text-slate-700" htmlFor="role">Sign Up As <span className="text-red-500">*</span></label>
                                <select name="role" required value={formData.role} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-sm">
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Principal">Principal</option>
                                </select>
                            </div>

                            {renderInput('name', 'Full Name', 'text', true)}
                            {renderInput('email', 'Email Address', 'email', true)}
                            {renderInput('password', 'Password', 'password', true)}

                            <div className="md:col-span-2 form-group">
                                <label className="block font-semibold mb-2 text-sm text-slate-700" htmlFor="profilePhoto">Profile Photo</label>
                                <input type="file" name="profilePhoto" onChange={handleFileChange} accept="image/*"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-sky-50 file:text-sky-600 hover:file:bg-sky-100 transition-colors cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC ROLE FIELDS */}
                    <div className="pt-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-sky-50">{formData.role} Details</h3>
                        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
                            {renderDynamicFields()}
                        </div>
                    </div>

                    <div className="pt-8 mt-4">
                        <button type="submit" disabled={loading || !isFormValid} className={`w-full inline-flex items-center justify-center px-6 py-4 font-bold text-base rounded-xl transition-all duration-300 ease-in-out bg-sky-500 text-white shadow-md hover:bg-sky-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-200/60 ${loading || !isFormValid ? 'opacity-50 cursor-not-allowed transform-none hover:translate-y-0 hover:shadow-md' : ''}`}>
                            {loading ? 'Submitting...' : `Register as ${formData.role}`}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/" className="text-sky-600 font-bold hover:text-sky-700 hover:underline transition-colors">
                            Return to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;