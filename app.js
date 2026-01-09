const { useState, useEffect, useCallback, createContext, useContext } = React;

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ==================== LOGIN PAGE COMPONENT ====================
function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        
        try {
            const services = window.FirebaseServices;
            if (!services || !services.authService) {
                throw new Error('Authentication service not available');
            }

            const result = await services.authService.signIn(email, password);
            
            if (result.success) {
                // Get user profile
                const userResult = await services.userService.getUserProfile(result.user.uid);
                
                if (userResult.success && userResult.data) {
                    if (!userResult.data.isActive) {
                        setError('Your account has been deactivated. Please contact administrator.');
                        await services.authService.signOut();
                        return;
                    }
                    onLoginSuccess(result.user, userResult.data);
                } else {
                    // First time login or profile doesn't exist - check if first user
                    const initResult = await services.userService.initializeAdminUser(result.user.uid, result.user.email);
                    if (initResult.isFirstUser) {
                        const newUserResult = await services.userService.getUserProfile(result.user.uid);
                        onLoginSuccess(result.user, newUserResult.data);
                    } else {
                        // Not first user but no profile - create with default role
                        await services.userService.createUserProfile(result.user.uid, {
                            email: result.user.email,
                            displayName: result.user.email.split('@')[0],
                            role: 'receptionist'
                        });
                        const newUserResult = await services.userService.getUserProfile(result.user.uid);
                        onLoginSuccess(result.user, newUserResult.data);
                    }
                }
            } else {
                // Parse Firebase error messages
                let errorMessage = result.error;
                if (result.error.includes('user-not-found')) {
                    errorMessage = 'No account found with this email address';
                } else if (result.error.includes('wrong-password')) {
                    errorMessage = 'Incorrect password';
                } else if (result.error.includes('invalid-email')) {
                    errorMessage = 'Invalid email address format';
                } else if (result.error.includes('too-many-requests')) {
                    errorMessage = 'Too many failed attempts. Please try again later';
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e3a5f',
            padding: '20px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '60px',
                maxWidth: '900px',
                width: '100%'
            }}>
                {/* Left Side - Logo */}
                <div style={{
                    flex: '1',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 16H9m10 0h3l-3.5-7a2 2 0 0 0-1.9-1.3H7.4a2 2 0 0 0-1.9 1.3L2 16h3m0 0a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/>
                        </svg>
                    </div>
                    
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        letterSpacing: '-0.5px'
                    }}>
                        EcoSpark
                    </h1>
                    <p style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '0'
                    }}>
                        Car Wash & Auto Service
                    </p>
                    <p style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.7)'
                    }}>
                        Management System
                    </p>
                </div>

                {/* Right Side - Login Form */}
                <div style={{
                    flex: '1',
                    maxWidth: '380px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '36px 32px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            Sign In
                        </h2>

                        {error && (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '12px',
                                marginBottom: '20px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                textAlign: 'left'
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '6px'
                                }}>
                                    Email
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#9ca3af'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        style={{
                                            width: '100%',
                                            padding: '12px 12px 12px 42px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            backgroundColor: '#f8fafc'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '6px'
                                }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#9ca3af'
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        style={{
                                            width: '100%',
                                            padding: '12px 42px 12px 42px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            backgroundColor: '#f8fafc'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#9ca3af',
                                            padding: '0'
                                        }}
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
                                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
                            >
                                {loading ? (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p style={{
                            marginTop: '20px',
                            fontSize: '12px',
                            color: '#64748b',
                            textAlign: 'center'
                        }}>
                            Need help? Contact your administrator
                        </p>
                    </div>

                    <p style={{
                        marginTop: '20px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        textAlign: 'center'
                    }}>
                        © 2026 EcoSpark. All rights reserved.
                    </p>
                </div>
            </div>

            {/* CSS Animation for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ==================== PERMISSION HELPER ====================
const PermissionContext = createContext(null);

const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        return {
            hasModuleAccess: () => true,
            hasPermission: () => true,
            userRole: 'admin'
        };
    }
    return context;
};

// Icon Components
const Icons = {
    dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    car: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3l-3.5-7a2 2 0 0 0-1.9-1.3H7.4a2 2 0 0 0-1.9 1.3L2 16h3m0 0a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/></svg>,
    package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    play: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    pause: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    x: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    refresh: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
    star: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    arrowRight: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    edit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    eye: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    fileText: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    scan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
    droplet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    tool: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    truck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>,
    briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    creditCard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    clipboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
    trendingUp: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    megaphone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.2 4.2l4.2 4.2m5.6 5.6l4.2 4.2M1 12h6m6 0h6M4.2 19.8l4.2-4.2m5.6-5.6l4.2-4.2"/></svg>,
    printer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
};

// Menu items configuration with categories
const menuGroups = [
    {
        label: 'Main',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard }
        ]
    },
    {
        label: 'Vehicle Management',
        items: [
            { id: 'vehicle-intake', label: 'Vehicle Intake', icon: Icons.car },
            { id: 'service-packages', label: 'Service Packages', icon: Icons.package }
        ]
    },
    {
        label: 'Operations',
        items: [
            { id: 'garage-management', label: 'Garage Management', icon: Icons.building },
            { id: 'wash-bays', label: 'Wash Bays', icon: Icons.droplet },
            { id: 'equipment', label: 'Equipment Management', icon: Icons.tool }
        ]
    },
    {
        label: 'Customer Relations',
        items: [
            { id: 'customers', label: 'Customer Management', icon: Icons.users },
            { id: 'fleet', label: 'Fleet Accounts', icon: Icons.truck }
        ]
    },
    {
        label: 'Staff & Scheduling',
        items: [
            { id: 'staff', label: 'Staff Management', icon: Icons.briefcase },
            { id: 'scheduling', label: 'Shift Scheduling', icon: Icons.calendar }
        ]
    },
    {
        label: 'Financial',
        items: [
            { id: 'billing', label: 'Billing Payments', icon: Icons.creditCard },
            { id: 'inventory', label: 'Inventory Management', icon: Icons.clipboard }
        ]
    },
    {
        label: 'Analytics & Marketing',
        items: [
            { id: 'reports', label: 'Reports Analytics', icon: Icons.trendingUp },
            { id: 'marketing', label: 'Marketing CRM', icon: Icons.megaphone }
        ]
    }
];

const settingsItem = { id: 'settings', label: 'System Settings', icon: Icons.settings };
const activitiesItem = { id: 'activities', label: 'Activities', icon: Icons.clipboard };

// Flatten menu items for easy lookup
const menuItems = [
    ...menuGroups.flatMap(group => group.items),
    settingsItem,
    activitiesItem
];

// Sidebar Component
function Sidebar({ isCollapsed, activeModule, onModuleClick, userProfile, hasModuleAccess }) {
    // Filter menu groups based on user permissions
    const filteredMenuGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => hasModuleAccess ? hasModuleAccess(item.id) : true)
    })).filter(group => group.items.length > 0);

    const canAccessSettings = hasModuleAccess ? hasModuleAccess('settings') : true;

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">🚗</div>
                <div className="sidebar-logo-text">Ecospark</div>
            </div>
            <div className="sidebar-menu">
                {filteredMenuGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="sidebar-menu-group">
                        {!isCollapsed && <div className="sidebar-menu-header">{group.label}</div>}
                        {group.items.map((item) => (
                            <div
                                key={item.id}
                                className={`sidebar-menu-item ${activeModule === item.id ? 'active' : ''}`}
                                onClick={() => onModuleClick(item.id)}
                            >
                                <span className="sidebar-menu-item-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                ))}
                
                <div className="sidebar-spacer"></div>
                
                {canAccessSettings && (
                    <div className="sidebar-menu-group sidebar-menu-group-settings">
                        <div className="sidebar-separator"></div>
                        <div
                            className={`sidebar-menu-item ${activeModule === settingsItem.id ? 'active' : ''}`}
                            onClick={() => onModuleClick(settingsItem.id)}
                        >
                            <span className="sidebar-menu-item-icon">{settingsItem.icon}</span>
                            <span>{settingsItem.label}</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* User info at bottom of sidebar */}
            {userProfile && !isCollapsed && (
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        {(userProfile.displayName || userProfile.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '500', 
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {userProfile.displayName || userProfile.email?.split('@')[0] || 'User'}
                        </div>
                        <div style={{ 
                            fontSize: '11px', 
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'capitalize'
                        }}>
                            {userProfile.role || 'User'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Notification Dropdown Component
function NotificationDropdown({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <>
            <div className="dropdown-overlay" onClick={onClose}></div>
            <div className="dropdown notification-dropdown">
                <div className="dropdown-header">
                    <h3>Notifications</h3>
                </div>
                <div className="dropdown-content">
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <p>No notifications</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// Profile Dropdown Component
function ProfileDropdown({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <>
            <div className="dropdown-overlay" onClick={onClose}></div>
            <div className="dropdown profile-dropdown">
                <div className="dropdown-content">
                    <a href="#" className="dropdown-menu-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>My Profile</span>
                    </a>
                    <a href="#" className="dropdown-menu-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6M4.2 4.2l4.2 4.2m5.6 5.6l4.2 4.2M1 12h6m6 0h6M4.2 19.8l4.2-4.2m5.6-5.6l4.2-4.2"/>
                        </svg>
                        <span>Settings</span>
                    </a>
                    <a href="#" className="dropdown-menu-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                        <span>Help & Support</span>
                    </a>
                    <div className="dropdown-divider"></div>
                    <a href="#" className="dropdown-menu-item logout">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </>
    );
}

// Top Bar Component
function TopBar({ onToggleSidebar, onToggleTheme, isDarkMode, userProfile, onLogout }) {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleNotificationClick = () => {
        setNotificationOpen(!notificationOpen);
        setProfileOpen(false);
    };

    const handleProfileClick = () => {
        setProfileOpen(!profileOpen);
        setNotificationOpen(false);
    };

    const handleLogoutClick = () => {
        setProfileOpen(false);
        if (onLogout) onLogout();
    };

    return (
        <div className="topbar">
            <div className="topbar-left">
                <button className="topbar-button" onClick={onToggleSidebar} title="Toggle Sidebar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
            </div>
            <div className="topbar-right">
                <div className="dropdown-container">
                    <button className="topbar-button" onClick={handleNotificationClick} title="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span className="notification-badge"></span>
                    </button>
                    <NotificationDropdown isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
                </div>
                <button className="topbar-button" onClick={onToggleTheme} title="Toggle Theme">
                    {isDarkMode ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/>
                            <line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    )}
                </button>
                {/* Divider */}
                <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0', margin: '0 8px' }}></div>
                
                {/* Profile Section */}
                <div className="dropdown-container">
                    <button 
                        onClick={handleProfileClick} 
                        title="Profile"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '4px 8px 4px 4px',
                            background: profileOpen ? '#f1f5f9' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = profileOpen ? '#f1f5f9' : 'transparent'}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                        }}>
                            {(userProfile?.displayName || userProfile?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'User'}
                            </div>
                            <div style={{ 
                                fontSize: '11px', 
                                color: '#64748b', 
                                textTransform: 'capitalize',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#22c55e',
                                    display: 'inline-block'
                                }}></span>
                                {userProfile?.role || 'User'}
                            </div>
                        </div>
                        <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#94a3b8" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{
                                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    
                    {profileOpen && (
                        <>
                            <div className="dropdown-overlay" onClick={() => setProfileOpen(false)}></div>
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: '0',
                                width: '280px',
                                backgroundColor: 'white',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                border: '1px solid #e2e8f0',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                {/* Profile Header */}
                                <div style={{ 
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            border: '2px solid rgba(255,255,255,0.3)'
                                        }}>
                                            {(userProfile?.displayName || userProfile?.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                                fontWeight: '600', 
                                                fontSize: '15px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'User'}
                                            </div>
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: 'rgba(255,255,255,0.7)',
                                                marginTop: '2px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {userProfile?.email || ''}
                                            </div>
                                            <div style={{ 
                                                marginTop: '6px',
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                fontSize: '10px',
                                                fontWeight: '500',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {userProfile?.role || 'User'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Menu Items */}
                                <div style={{ padding: '8px 0' }}>
                                    <a 
                                        href="#" 
                                        onClick={(e) => e.preventDefault()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 16px',
                                            color: '#475569',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        <span>My Profile</span>
                                    </a>
                                    <a 
                                        href="#" 
                                        onClick={(e) => e.preventDefault()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 16px',
                                            color: '#475569',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                        </svg>
                                        <span>Account Settings</span>
                                    </a>
                                    <a 
                                        href="#" 
                                        onClick={(e) => e.preventDefault()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 16px',
                                            color: '#475569',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        <span>Help & Support</span>
                                    </a>
                                </div>
                                
                                {/* Sign Out */}
                                <div style={{ borderTop: '1px solid #e2e8f0', padding: '8px 0' }}>
                                    <a 
                                        href="#" 
                                        onClick={(e) => { e.preventDefault(); handleLogoutClick(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 16px',
                                            color: '#dc2626',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                            <polyline points="16 17 21 12 16 7"/>
                                            <line x1="21" y1="12" x2="9" y2="12"/>
                                        </svg>
                                        <span>Sign Out</span>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Format time elapsed
const formatTimeElapsed = (dateString) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ${diff % 60}m`;
    return `${Math.floor(hours / 24)}d ago`;
};

// Format time for display
const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Service types
const SERVICE_TYPES = [
    { id: 'basic', name: 'Basic Wash', price: 500 },
    { id: 'standard', name: 'Standard Wash', price: 800 },
    { id: 'premium', name: 'Premium Wash', price: 1200 },
    { id: 'full-detail', name: 'Full Detail', price: 2500 },
    { id: 'interior-only', name: 'Interior Only', price: 600 },
    { id: 'exterior-only', name: 'Exterior Only', price: 400 }
];

// Vehicle types
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus'];

// Default bays (fallback if Firebase not initialized)
const DEFAULT_BAYS = [
    { id: 'bay-1', name: 'Bay 1', status: 'available', currentVehicle: null },
    { id: 'bay-2', name: 'Bay 2', status: 'available', currentVehicle: null },
    { id: 'bay-3', name: 'Bay 3', status: 'available', currentVehicle: null },
    { id: 'bay-4', name: 'Bay 4', status: 'available', currentVehicle: null }
];

// Vehicle Intake Module Component - Firebase Integrated
function VehicleIntake() {
    // State management
    const [queue, setQueue] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [bays, setBays] = useState(DEFAULT_BAYS);
    const [servicePackages, setServicePackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [formData, setFormData] = useState({
        plateNumber: '',
        vehicleType: 'Sedan',
        service: '', // Will be set when packages load
        priority: 'normal',
        customerName: '',
        customerPhone: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('all');

    // Set default service when packages load
    useEffect(() => {
        if (servicePackages.length > 0 && !formData.service) {
            setFormData(prev => ({ ...prev, service: servicePackages[0].id }));
        }
    }, [servicePackages]);

    // Filter vehicles based on search and date
    const getFilteredVehicles = () => {
        let filtered = vehicles;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(v => 
                v.plateNumber?.toLowerCase().includes(query) ||
                v.customerName?.toLowerCase().includes(query) ||
                v.customerPhone?.includes(query) ||
                v.service?.name?.toLowerCase().includes(query) ||
                v.vehicleType?.toLowerCase().includes(query)
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);
            const monthStart = new Date(today);
            monthStart.setDate(monthStart.getDate() - 30);

            filtered = filtered.filter(v => {
                const vehicleDate = new Date(v.timeIn);
                switch (dateFilter) {
                    case 'today':
                        return vehicleDate >= today;
                    case 'yesterday':
                        return vehicleDate >= yesterday && vehicleDate < today;
                    case 'week':
                        return vehicleDate >= weekStart;
                    case 'month':
                        return vehicleDate >= monthStart;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const filteredVehicles = getFilteredVehicles();

    // Initialize Firebase subscriptions - using refs for proper cleanup
    const subscriptionsRef = React.useRef({
        queue: null,
        records: null,
        bays: null,
        packages: null,
        mounted: true
    });

    useEffect(() => {
        console.log('🔄 VehicleIntake: Initializing Firebase subscriptions...');
        subscriptionsRef.current.mounted = true;
        
        // Function to get services safely
        const getServices = () => window.FirebaseServices;

        const initializeData = async () => {
            // Check if still mounted
            if (!subscriptionsRef.current.mounted) return;
            
            let services = getServices();

            // Wait for services if not ready - use fast polling
            if (!services) {
                let attempts = 0;
                while (!services && attempts < 20 && subscriptionsRef.current.mounted) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    services = getServices();
                    attempts++;
                }
                
                if (!services) {
                    console.error('❌ FirebaseServices not available');
                    if (subscriptionsRef.current.mounted) {
                        setError('Connecting...');
                        setTimeout(initializeData, 100);
                    }
                    return;
                }
            }
            
            // Check if still mounted before proceeding
            if (!subscriptionsRef.current.mounted) return;
            
            // Clear loading error if we got services
            setError(null);

            const { intakeQueueService, intakeRecordsService, intakeBaysService, packagesService } = services;
            
            if (!intakeQueueService || !intakeRecordsService || !intakeBaysService) {
                console.error('❌ Required intake services not available');
                setError('Required services incomplete.');
                return;
            }

            try {
                // Initialize bays if needed
                await intakeBaysService.initializeBays();
                
                // Check if still mounted
                if (!subscriptionsRef.current.mounted) return;
                
                // Subscribe to queue (Realtime Database) - PERSISTED DATA
                console.log('📡 Subscribing to queue...');
                subscriptionsRef.current.queue = intakeQueueService.subscribeToQueue(
                    (queueData) => {
                        if (subscriptionsRef.current.mounted) {
                            console.log('📥 Queue updated:', queueData.length, 'items');
                            setQueue(queueData);
                        }
                    },
                    (err) => {
                        console.error('Queue subscription error:', err);
                        if (subscriptionsRef.current.mounted) {
                            setError('Failed to load queue data');
                        }
                    }
                );

                // Subscribe to vehicle records (Firestore)
                subscriptionsRef.current.records = intakeRecordsService.subscribeToRecords(
                    (recordsData) => {
                        if (subscriptionsRef.current.mounted) {
                            console.log('📥 Records updated:', recordsData.length, 'items');
                            setVehicles(recordsData);
                        }
                    },
                    (err) => {
                        console.error('Records subscription error:', err);
                        if (subscriptionsRef.current.mounted) {
                            setError('Failed to load vehicle records');
                        }
                    }
                );

                // Subscribe to bays (Realtime Database)
                subscriptionsRef.current.bays = intakeBaysService.subscribeToBays(
                    (baysData) => {
                        if (subscriptionsRef.current.mounted) {
                            console.log('📥 Bays updated:', baysData.length, 'bays');
                            setBays(baysData.length > 0 ? baysData : DEFAULT_BAYS);
                        }
                    },
                    (err) => {
                        console.error('Bays subscription error:', err);
                    }
                );

                // Subscribe to service packages (Firestore)
                if (packagesService) {
                    await packagesService.initializeDefaultPackages();
                    if (!subscriptionsRef.current.mounted) return;
                    
                    subscriptionsRef.current.packages = packagesService.subscribeToPackages(
                        (packagesData) => {
                            if (subscriptionsRef.current.mounted) {
                                console.log('📥 Packages updated:', packagesData.length, 'packages');
                                // Only include active packages
                                setServicePackages(packagesData.filter(p => p.isActive !== false));
                            }
                        },
                        (err) => {
                            console.error('Packages subscription error:', err);
                        }
                    );
                }

                if (subscriptionsRef.current.mounted) {
                    setLoading(false);
                    console.log('✅ VehicleIntake: Subscriptions active');
                }
                
            } catch (err) {
                console.error('❌ Failed to initialize:', err);
                if (subscriptionsRef.current.mounted) {
                    setError('Failed to initialize data. Please refresh.');
                    setLoading(false);
                }
            }
        };

        initializeData();

        // Cleanup subscriptions on unmount
        return () => {
            console.log('🧹 VehicleIntake: Cleaning up subscriptions');
            subscriptionsRef.current.mounted = false;
            if (subscriptionsRef.current.queue) subscriptionsRef.current.queue();
            if (subscriptionsRef.current.records) subscriptionsRef.current.records();
            if (subscriptionsRef.current.bays) subscriptionsRef.current.bays();
            if (subscriptionsRef.current.packages) subscriptionsRef.current.packages();
        };
    }, []);

    // Calculate stats from live data
    const stats = {
        waiting: queue.filter(v => v.status === 'waiting').length,
        inProgress: vehicles.filter(v => v.status === 'in-progress').length,
        availableBays: bays.filter(b => b.status === 'available').length,
        avgWaitTime: queue.length > 0 
            ? Math.round(queue.reduce((acc, v) => {
                const timeIn = new Date(v.timeIn);
                return acc + (new Date() - timeIn) / 1000 / 60;
            }, 0) / queue.length) 
            : 0
    };

    // Add vehicle to queue (saves to Realtime Database)
    const handleAddVehicle = async () => {
        if (!formData.plateNumber.trim()) return;
        
        const services = window.FirebaseServices;
        if (!services || !services.intakeQueueService) {
            setError('Firebase not ready. Please wait and try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            // Find package from dynamic packages list
            const serviceInfo = servicePackages.find(s => s.id === formData.service) || servicePackages[0];
            const vehicleData = {
                plateNumber: formData.plateNumber.toUpperCase(),
                vehicleType: formData.vehicleType,
                service: serviceInfo ? { id: serviceInfo.id, name: serviceInfo.name, price: serviceInfo.price } : null,
                priority: formData.priority,
                customerName: formData.customerName || null,
                customerPhone: formData.customerPhone || null
            };

            const result = await services.intakeQueueService.addToQueue(vehicleData);
            
            if (result.success) {
                console.log('✅ Vehicle added to queue:', result.id);
                setFormData({
                    plateNumber: '',
                    vehicleType: 'Sedan',
                    service: servicePackages.length > 0 ? servicePackages[0].id : '',
                    priority: 'normal',
                    customerName: '',
                    customerPhone: ''
                });
                setShowAddModal(false);
            } else {
                setError('Failed to add vehicle: ' + result.error);
            }
        } catch (err) {
            console.error('Error adding vehicle:', err);
            setError('Failed to add vehicle. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Assign bay to vehicle from queue
    const handleAssignBay = async (bayId) => {
        if (!selectedVehicle) return;
        
        const services = window.FirebaseServices;
        if (!services) {
            setError('Firebase not ready. Please wait and try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            const bay = bays.find(b => b.id === bayId);
            // Remove the queue ID before saving to Firestore
            const { id: queueId, ...vehicleData } = selectedVehicle;
            const vehicleRecord = {
                ...vehicleData,
                queueId: queueId, // Store original queue ID for reference
                status: 'in-progress',
                assignedBay: bay.name,
                assignedBayId: bayId,
                assignedTime: new Date().toISOString(),
                timeIn: new Date().toISOString()
            };

            // 1. Add to Firestore records
            const recordResult = await services.intakeRecordsService.addRecord(vehicleRecord);
            
            if (!recordResult.success) {
                throw new Error('Failed to create vehicle record');
            }

            // 2. Update bay status in Realtime DB
            await services.intakeBaysService.updateBay(bayId, 'occupied', {
                plateNumber: selectedVehicle.plateNumber,
                recordId: recordResult.id
            });

            // 3. Remove from queue in Realtime DB
            await services.intakeQueueService.removeFromQueue(selectedVehicle.id);

            console.log('✅ Vehicle assigned to bay:', bay.name);
            setShowAssignModal(false);
            setSelectedVehicle(null);
            
        } catch (err) {
            console.error('Error assigning bay:', err);
            setError('Failed to assign bay. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Send to garage
    const handleSendToGarage = async (vehicle) => {
        const services = window.FirebaseServices;
        if (!services || !services.intakeRecordsService) {
            setError('Firebase not ready. Please wait and try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            // Remove the queue ID before saving to Firestore
            const { id: queueId, ...vehicleData } = vehicle;
            const vehicleRecord = {
                ...vehicleData,
                queueId: queueId,
                status: 'garage',
                assignedBay: 'Garage',
                assignedTime: new Date().toISOString(),
                timeIn: new Date().toISOString()
            };

            // Add to Firestore records
            const result = await services.intakeRecordsService.addRecord(vehicleRecord);
            
            if (result.success) {
                // Remove from queue
                await services.intakeQueueService.removeFromQueue(vehicle.id);
                console.log('✅ Vehicle sent to garage');
            } else {
                throw new Error('Failed to create garage record');
            }
        } catch (err) {
            console.error('Error sending to garage:', err);
            setError('Failed to send to garage. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Mark vehicle as complete - REBUILT
    const handleComplete = async (vehicle) => {
        console.log('=== COMPLETE ACTION ===');
        console.log('Vehicle:', vehicle.plateNumber, 'ID:', vehicle.id);
        
        // Get fresh services reference
        const svc = window.FirebaseServices;
        console.log('Services available:', !!svc);
        console.log('intakeRecordsService:', !!svc?.intakeRecordsService);
        
        if (!svc?.intakeRecordsService) {
            alert('Firebase not ready. Please refresh the page.');
            return;
        }
        
        setActionLoading(true);
        setError(null);
        
        try {
            const updatePayload = {
                status: 'completed',
                timeOut: new Date().toISOString()
            };
            console.log('Update payload:', updatePayload);
            
            const result = await svc.intakeRecordsService.updateRecord(vehicle.id, updatePayload);
            console.log('Update result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Update failed');
            }

            // Free up the bay if assigned
            if (vehicle.assignedBayId && svc.intakeBaysService) {
                console.log('Freeing bay:', vehicle.assignedBayId);
                await svc.intakeBaysService.updateBay(vehicle.assignedBayId, 'available', null);
            }

            console.log('SUCCESS: Vehicle completed');
        } catch (err) {
            console.error('FAILED:', err);
            setError('Complete failed: ' + err.message);
            alert('Failed to complete: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Update vehicle status - REBUILT  
    const handleStatusChange = async (vehicle, newStatus) => {
        console.log('=== STATUS CHANGE ===');
        console.log('Vehicle:', vehicle.plateNumber, 'New Status:', newStatus);
        
        const svc = window.FirebaseServices;
        if (!svc?.intakeRecordsService) {
            alert('Firebase not ready. Please refresh the page.');
            return;
        }
        
        setActionLoading(true);
        setError(null);
        
        try {
            const updatePayload = { status: newStatus };
            
            // If completing, add timeOut
            if (newStatus === 'completed') {
                updatePayload.timeOut = new Date().toISOString();
            }
            
            const result = await svc.intakeRecordsService.updateRecord(vehicle.id, updatePayload);
            
            if (!result.success) {
                throw new Error(result.error || 'Update failed');
            }

            // Free bay if completing
            if (newStatus === 'completed' && vehicle.assignedBayId && svc.intakeBaysService) {
                await svc.intakeBaysService.updateBay(vehicle.assignedBayId, 'available', null);
            }

            console.log('SUCCESS: Status changed to', newStatus);
        } catch (err) {
            console.error('FAILED:', err);
            setError('Status change failed: ' + err.message);
            alert('Failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Remove from queue
    const handleRemoveFromQueue = async (vehicleId) => {
        const services = window.FirebaseServices;
        if (!services) {
            setError('Firebase not ready. Please try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            await services.intakeQueueService.removeFromQueue(vehicleId);
            console.log('✅ Vehicle removed from queue');
        } catch (err) {
            console.error('Error removing from queue:', err);
            setError('Failed to remove vehicle. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Open assign modal
    const openAssignModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowAssignModal(true);
    };

    // Open view modal
    const openViewModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowViewModal(true);
    };

    // Open edit modal
    const openEditModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setEditFormData({
            plateNumber: vehicle.plateNumber || '',
            vehicleType: vehicle.vehicleType || 'Sedan',
            service: vehicle.service?.id || 'basic',
            priority: vehicle.priority || 'normal',
            customerName: vehicle.customerName || '',
            customerPhone: vehicle.customerPhone || '',
            status: vehicle.status || 'in-progress'
        });
        setShowEditModal(true);
    };

    // Handle edit vehicle
    const handleEditVehicle = async () => {
        if (!selectedVehicle) return;
        
        const services = window.FirebaseServices;
        if (!services || !services.intakeRecordsService) {
            console.error('❌ Firebase services not available');
            setError('Firebase not ready. Please wait and try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            const serviceInfo = servicePackages.find(s => s.id === editFormData.service) || servicePackages[0];
            const updateData = {
                plateNumber: editFormData.plateNumber.toUpperCase(),
                vehicleType: editFormData.vehicleType,
                service: serviceInfo ? { id: serviceInfo.id, name: serviceInfo.name, price: serviceInfo.price } : null,
                priority: editFormData.priority,
                customerName: editFormData.customerName || null,
                customerPhone: editFormData.customerPhone || null,
                status: editFormData.status
            };
            
            // If status changed to completed, set timeOut
            if (editFormData.status === 'completed' && selectedVehicle.status !== 'completed') {
                updateData.timeOut = new Date().toISOString();
                // Free the bay if assigned
                if (selectedVehicle.assignedBayId) {
                    await services.intakeBaysService.updateBay(selectedVehicle.assignedBayId, 'available', null);
                }
            }

            console.log('📤 Updating vehicle:', selectedVehicle.id, updateData);
            const result = await services.intakeRecordsService.updateRecord(selectedVehicle.id, updateData);
            console.log('📤 Update result:', result);
            
            setShowEditModal(false);
            setSelectedVehicle(null);
        } catch (err) {
            console.error('❌ Error updating vehicle:', err);
            setError('Failed to update vehicle: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Open invoice modal
    const openInvoiceModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowInvoiceModal(true);
    };

    // Print Receipt - Clean thermal receipt style
    const printReceipt = (vehicle) => {
        const total = vehicle.service?.price || 0;
        const receiptNumber = `ECO-${Date.now().toString().slice(-8)}`;
        const printDate = new Date().toLocaleString();
        
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${vehicle.plateNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Courier New', monospace; 
                        width: 280px; 
                        margin: 0 auto; 
                        padding: 20px 10px;
                        background: #fff;
                    }
                    .receipt { text-align: center; }
                    .header { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
                    .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                    .tagline { font-size: 10px; color: #666; }
                    .receipt-no { font-size: 11px; margin-top: 10px; }
                    .section { margin: 15px 0; text-align: left; }
                    .section-title { font-weight: bold; font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
                    .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
                    .row-label { color: #666; }
                    .plate { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
                    .divider { border-top: 1px dashed #000; margin: 15px 0; }
                    .total-section { margin: 15px 0; padding: 10px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; }
                    .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
                    .footer { margin-top: 20px; font-size: 10px; color: #666; text-align: center; }
                    .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 36px; margin: 10px 0; }
                    @media print {
                        body { width: 80mm; padding: 5mm; }
                        @page { margin: 0; size: 80mm auto; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="logo">🚗 ECOSPARK</div>
                        <div class="tagline">Premium Car Wash Services</div>
                        <div class="receipt-no">Receipt #${receiptNumber}</div>
                    </div>
                    
                    <div class="plate">${vehicle.plateNumber}</div>
                    
                    <div class="section">
                        <div class="section-title">VEHICLE INFO</div>
                        <div class="row">
                            <span class="row-label">Type:</span>
                            <span>${vehicle.vehicleType}</span>
                        </div>
                        <div class="row">
                            <span class="row-label">Bay:</span>
                            <span>${vehicle.assignedBay || 'N/A'}</span>
                        </div>
                        <div class="row">
                            <span class="row-label">Status:</span>
                            <span>${(vehicle.status || 'pending').toUpperCase()}</span>
                        </div>
                    </div>
                    
                    ${vehicle.customerName ? `
                    <div class="section">
                        <div class="section-title">CUSTOMER</div>
                        <div class="row">
                            <span class="row-label">Name:</span>
                            <span>${vehicle.customerName}</span>
                        </div>
                        ${vehicle.customerPhone ? `<div class="row">
                            <span class="row-label">Phone:</span>
                            <span>${vehicle.customerPhone}</span>
                        </div>` : ''}
                    </div>
                    ` : ''}
                    
                    <div class="section">
                        <div class="section-title">SERVICE</div>
                        <div class="row">
                            <span>${vehicle.service?.name || 'Car Wash'}</span>
                            <span>KSH ${total}</span>
                        </div>
                    </div>
                    
                    <div class="total-section">
                        <div class="total">
                            <span>TOTAL</span>
                            <span>KSH ${total}</span>
                        </div>
                    </div>
                    
                    <div class="section" style="text-align: center;">
                        <div class="row" style="justify-content: center;">
                            <span class="row-label">Time In: ${vehicle.timeIn ? new Date(vehicle.timeIn).toLocaleString() : '-'}</span>
                        </div>
                        ${vehicle.timeOut ? `
                        <div class="row" style="justify-content: center;">
                            <span class="row-label">Time Out: ${new Date(vehicle.timeOut).toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="footer">
                        <p>Thank you for choosing Ecospark!</p>
                        <p style="margin-top: 5px;">Quality service, every time.</p>
                        <p style="margin-top: 10px; font-size: 9px;">Printed: ${printDate}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }
                </script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=320,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    };

    // Delete vehicle record
    const handleDeleteRecord = async (vehicle) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        
        const services = window.FirebaseServices;
        if (!services) {
            setError('Firebase not ready. Please try again.');
            return;
        }
        
        setActionLoading(true);
        try {
            await services.intakeRecordsService.deleteRecord(vehicle.id);
            console.log('✅ Vehicle record deleted:', vehicle.id);
            setShowViewModal(false);
            setSelectedVehicle(null);
        } catch (err) {
            console.error('Error deleting record:', err);
            setError('Failed to delete record. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Clear error message
    const clearError = () => setError(null);

    // Priority badge color
    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'vip': return '#f59e0b';
            case 'fleet': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    // Status badge color
    const getStatusColor = (status) => {
        switch(status) {
            case 'waiting': return '#f59e0b';
            case 'in-progress': return '#3b82f6';
            case 'completed': return '#10b981';
            case 'garage': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="vehicle-intake" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <p style={{ color: '#64748b' }}>Loading Vehicle Intake...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="vehicle-intake">
            {/* Error Notification */}
            {error && (
                <div className="intake-error-banner" style={{ 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '8px', 
                    padding: '12px 16px', 
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#dc2626' }}>{error}</span>
                    <button 
                        onClick={clearError}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#dc2626', 
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        {Icons.x}
                    </button>
                </div>
            )}

            {/* Action Loading Overlay */}
            {actionLoading && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(255,255,255,0.7)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 9999 
                }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '3px solid #e2e8f0', 
                        borderTopColor: '#3b82f6', 
                        borderRadius: '50%', 
                        animation: 'spin 0.8s linear infinite' 
                    }}></div>
                </div>
            )}

            {/* Action Bar */}
            <div className="intake-action-bar">
                <div className="action-bar-primary">
                    <button className="action-btn action-btn-primary" onClick={() => setShowAddModal(true)}>
                        {Icons.plus}
                        <span>Add Vehicle</span>
                    </button>
                    <button className="action-btn action-btn-secondary" disabled={queue.length === 0}>
                        {Icons.package}
                        <span>Assign Service</span>
                    </button>
                    <button className="action-btn action-btn-secondary" disabled={queue.length === 0}>
                        {Icons.arrowRight}
                        <span>Send to Queue</span>
                    </button>
                    <button className="action-btn action-btn-danger" disabled={queue.length === 0}>
                        {Icons.pause}
                        <span>Hold</span>
                    </button>
                </div>
                <div className="action-bar-secondary">
                    <button className="action-btn action-btn-ghost">
                        {Icons.scan}
                        <span>Scan Plate</span>
                    </button>
                    <button className="action-btn action-btn-ghost">
                        {Icons.star}
                        <span>Priority Tag</span>
                    </button>
                    <button className="action-btn action-btn-ghost" onClick={() => window.location.reload()}>
                        {Icons.refresh}
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards - Compact One-Line */}
            <div className="intake-stats">
                <div className="intake-stat-card">
                    <span className="intake-stat-label">Waiting</span>
                    <span className="intake-stat-value">{stats.waiting}</span>
                </div>
                <div className="intake-stat-card">
                    <span className="intake-stat-label">In Progress</span>
                    <span className="intake-stat-value">{stats.inProgress}</span>
                </div>
                <div className="intake-stat-card">
                    <span className="intake-stat-label">Available Bays</span>
                    <span className="intake-stat-value">{stats.availableBays}</span>
                </div>
                <div className="intake-stat-card">
                    <span className="intake-stat-label">Avg Wait</span>
                    <span className="intake-stat-value">{stats.avgWaitTime}m</span>
                </div>
            </div>

            {/* Queue Section */}
            <div className="intake-section">
                <div className="intake-section-header">
                    <h3>Queue</h3>
                    <span className="intake-section-count">{queue.length} vehicles</span>
                </div>
                <div className="intake-queue">
                    {queue.length === 0 ? (
                        <div className="intake-empty">
                            <p>No vehicles in queue</p>
                            <button className="action-btn action-btn-primary" onClick={() => setShowAddModal(true)}>
                                {Icons.plus} Add First Vehicle
                            </button>
                        </div>
                    ) : (
                        queue.map((vehicle, index) => (
                            <div key={vehicle.id} className="queue-card">
                                <div className="queue-card-header">
                                    <span className="queue-card-plate">{vehicle.plateNumber}</span>
                                    <span 
                                        className="queue-card-priority" 
                                        style={{ backgroundColor: getPriorityColor(vehicle.priority) }}
                                    >
                                        {vehicle.priority.toUpperCase()}
                                    </span>
                                </div>
                                <div className="queue-card-body">
                                    <div className="queue-card-info">
                                        <span className="queue-card-service">{vehicle.service.name}</span>
                                        <span className="queue-card-time">{Icons.clock} {formatTimeElapsed(vehicle.timeIn)}</span>
                                    </div>
                                    <span className="queue-card-type">{vehicle.vehicleType}</span>
                                </div>
                                <div className="queue-card-actions">
                                    <button 
                                        className="queue-action-btn queue-action-primary"
                                        onClick={() => openAssignModal(vehicle)}
                                    >
                                        Assign Bay
                                    </button>
                                    <button 
                                        className="queue-action-btn"
                                        onClick={() => handleSendToGarage(vehicle)}
                                    >
                                        Garage
                                    </button>
                                    <button 
                                        className="queue-action-btn queue-action-danger"
                                        onClick={() => handleRemoveFromQueue(vehicle.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Vehicle Management Table */}
            <div className="intake-section">
                <div className="intake-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ margin: 0 }}>Vehicle Records</h3>
                        <span className="intake-section-count">{filteredVehicles.length} of {vehicles.length}</span>
                    </div>
                    
                    {/* Search and Filter Bar */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 32px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            />
                            <svg 
                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                            </svg>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                                >
                                    {Icons.x}
                                </button>
                            )}
                        </div>
                        
                        {/* Date Filter Buttons */}
                        <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '3px' }}>
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'today', label: 'Today' },
                                { id: 'yesterday', label: 'Yesterday' },
                                { id: 'week', label: 'Week' },
                                { id: 'month', label: 'Month' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setDateFilter(filter.id)}
                                    style={{
                                        padding: '5px 10px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        backgroundColor: dateFilter === filter.id ? '#fff' : 'transparent',
                                        color: dateFilter === filter.id ? '#1e293b' : '#64748b',
                                        boxShadow: dateFilter === filter.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="intake-table-container">
                    <table className="intake-table">
                        <thead>
                            <tr>
                                <th>Plate Number</th>
                                <th>Vehicle Type</th>
                                <th>Service</th>
                                <th>Price</th>
                                <th>Assigned</th>
                                <th>Status</th>
                                <th>Time In</th>
                                <th>Time Out</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="intake-table-empty">
                                        {vehicles.length === 0 
                                            ? 'No vehicle records. Assign vehicles from the queue above.'
                                            : 'No records match your search or filter.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map(vehicle => (
                                    <tr key={vehicle.id}>
                                        <td className="intake-table-plate">{vehicle.plateNumber}</td>
                                        <td>{vehicle.vehicleType}</td>
                                        <td>{vehicle.service?.name || '-'}</td>
                                        <td style={{ color: '#10b981', fontWeight: '600' }}>KSH {vehicle.service?.price || 0}</td>
                                        <td>{vehicle.assignedBay || '-'}</td>
                                        <td>
                                            {/* Status Dropdown - Direct Change */}
                                            <select
                                                value={vehicle.status || 'in-progress'}
                                                onChange={(e) => handleStatusChange(vehicle, e.target.value)}
                                                disabled={actionLoading}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    backgroundColor: getStatusColor(vehicle.status),
                                                    color: '#fff',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="in-progress" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>In Progress</option>
                                                <option value="completed" style={{ backgroundColor: '#10b981', color: '#fff' }}>Completed</option>
                                                <option value="garage" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>Garage</option>
                                                <option value="waiting" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>Waiting</option>
                                            </select>
                                        </td>
                                        <td>{formatTime(vehicle.timeIn)}</td>
                                        <td>{formatTime(vehicle.timeOut)}</td>
                                        <td>
                                            <div className="intake-table-actions">
                                                <button 
                                                    className="table-action-btn" 
                                                    title="View Details"
                                                    onClick={() => openViewModal(vehicle)}
                                                >
                                                    {Icons.eye}
                                                </button>
                                                <button 
                                                    className="table-action-btn" 
                                                    title="Edit Vehicle"
                                                    onClick={() => openEditModal(vehicle)}
                                                >
                                                    {Icons.edit}
                                                </button>
                                                <button 
                                                    className="table-action-btn" 
                                                    title="Print Receipt"
                                                    onClick={() => printReceipt(vehicle)}
                                                    style={{ color: '#6366f1' }}
                                                >
                                                    {Icons.printer}
                                                </button>
                                                {vehicle.status !== 'completed' && (
                                                    <button 
                                                        className="table-action-btn table-action-complete" 
                                                        title="Mark Complete"
                                                        onClick={() => handleComplete(vehicle)}
                                                        disabled={actionLoading}
                                                    >
                                                        {Icons.check}
                                                    </button>
                                                )}
                                                {vehicle.status === 'completed' && (
                                                    <button 
                                                        className="table-action-btn" 
                                                        title="View Invoice"
                                                        onClick={() => openInvoiceModal(vehicle)}
                                                    >
                                                        {Icons.fileText}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Vehicle</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                {Icons.x}
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Plate Number *</label>
                                <input 
                                    type="text" 
                                    value={formData.plateNumber}
                                    onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                                    placeholder="e.g., KAA 123A"
                                    autoFocus
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vehicle Type</label>
                                    <select 
                                        value={formData.vehicleType}
                                        onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                                    >
                                        {VEHICLE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Service</label>
                                    <select 
                                        value={formData.service}
                                        onChange={e => setFormData({...formData, service: e.target.value})}
                                    >
                                        {servicePackages.length > 0 ? servicePackages.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - KES {service.price?.toLocaleString()}
                                            </option>
                                        )) : (
                                            <option value="">Loading packages...</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <div className="priority-options">
                                    {['normal', 'vip', 'fleet'].map(p => (
                                        <button 
                                            key={p}
                                            className={`priority-option ${formData.priority === p ? 'active' : ''}`}
                                            onClick={() => setFormData({...formData, priority: p})}
                                            type="button"
                                        >
                                            {p.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.customerName}
                                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input 
                                        type="text" 
                                        value={formData.customerPhone}
                                        onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="modal-btn modal-btn-primary" 
                                onClick={handleAddVehicle}
                                disabled={!formData.plateNumber.trim()}
                            >
                                Add to Queue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Bay Modal */}
            {showAssignModal && selectedVehicle && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal modal-small" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Bay</h2>
                            <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                                {Icons.x}
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="assign-vehicle-info">
                                <strong>{selectedVehicle.plateNumber}</strong> - {selectedVehicle.service?.name || 'No Service'}
                            </p>
                            <div className="bay-grid">
                                {bays.map(bay => (
                                    <button 
                                        key={bay.id}
                                        className={`bay-option ${bay.status !== 'available' ? 'bay-occupied' : ''}`}
                                        onClick={() => bay.status === 'available' && handleAssignBay(bay.id)}
                                        disabled={bay.status !== 'available'}
                                    >
                                        <span className="bay-name">{bay.name}</span>
                                        <span className="bay-status">{bay.status}</span>
                                        {bay.currentVehicle && (
                                            <span className="bay-vehicle">{bay.currentVehicle.plateNumber}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Vehicle Modal */}
            {showViewModal && selectedVehicle && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Vehicle Details</h2>
                            <button className="modal-close" onClick={() => setShowViewModal(false)}>
                                {Icons.x}
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="vehicle-details">
                                <div className="detail-row">
                                    <span className="detail-label">Plate Number</span>
                                    <span className="detail-value" style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{selectedVehicle.plateNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Vehicle Type</span>
                                    <span className="detail-value">{selectedVehicle.vehicleType}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Service</span>
                                    <span className="detail-value">{selectedVehicle.service?.name || '-'} (KSH {selectedVehicle.service?.price || 0})</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Priority</span>
                                    <span className="detail-value" style={{ textTransform: 'uppercase', color: getPriorityColor(selectedVehicle.priority) }}>{selectedVehicle.priority}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status</span>
                                    <span className="intake-status-badge" style={{ backgroundColor: getStatusColor(selectedVehicle.status) }}>
                                        {selectedVehicle.status?.replace('-', ' ')}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Assigned Bay</span>
                                    <span className="detail-value">{selectedVehicle.assignedBay || 'Not assigned'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Customer Name</span>
                                    <span className="detail-value">{selectedVehicle.customerName || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Customer Phone</span>
                                    <span className="detail-value">{selectedVehicle.customerPhone || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Time In</span>
                                    <span className="detail-value">{selectedVehicle.timeIn ? new Date(selectedVehicle.timeIn).toLocaleString() : '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Time Out</span>
                                    <span className="detail-value">{selectedVehicle.timeOut ? new Date(selectedVehicle.timeOut).toLocaleString() : '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn modal-btn-danger" 
                                onClick={() => handleDeleteRecord(selectedVehicle)}
                            >
                                Delete Record
                            </button>
                            <button 
                                className="modal-btn modal-btn-secondary" 
                                onClick={() => {
                                    setShowViewModal(false);
                                    openEditModal(selectedVehicle);
                                }}
                            >
                                Edit
                            </button>
                            <button className="modal-btn modal-btn-primary" onClick={() => setShowViewModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Vehicle Modal */}
            {showEditModal && selectedVehicle && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Vehicle</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                {Icons.x}
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Plate Number *</label>
                                <input 
                                    type="text" 
                                    value={editFormData.plateNumber}
                                    onChange={e => setEditFormData({...editFormData, plateNumber: e.target.value})}
                                    placeholder="e.g., KAA 123A"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vehicle Type</label>
                                    <select 
                                        value={editFormData.vehicleType}
                                        onChange={e => setEditFormData({...editFormData, vehicleType: e.target.value})}
                                    >
                                        {VEHICLE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Service</label>
                                    <select 
                                        value={editFormData.service}
                                        onChange={e => setEditFormData({...editFormData, service: e.target.value})}
                                    >
                                        {servicePackages.length > 0 ? servicePackages.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - KES {service.price?.toLocaleString()}
                                            </option>
                                        )) : (
                                            <option value="">Loading packages...</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <div className="priority-options">
                                        {['normal', 'vip', 'fleet'].map(p => (
                                            <button 
                                                key={p}
                                                className={`priority-option ${editFormData.priority === p ? 'active' : ''}`}
                                                onClick={() => setEditFormData({...editFormData, priority: p})}
                                                type="button"
                                            >
                                                {p.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select 
                                        value={editFormData.status}
                                        onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                                    >
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="garage">Garage</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.customerName}
                                        onChange={e => setEditFormData({...editFormData, customerName: e.target.value})}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input 
                                        type="text" 
                                        value={editFormData.customerPhone}
                                        onChange={e => setEditFormData({...editFormData, customerPhone: e.target.value})}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="modal-btn modal-btn-primary" 
                                onClick={handleEditVehicle}
                                disabled={!editFormData.plateNumber?.trim()}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && selectedVehicle && (
                <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Invoice</h2>
                            <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>
                                {Icons.x}
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="invoice-content" style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b' }}>Ecospark Car Wash</h3>
                                    <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>Service Invoice</p>
                                </div>
                                
                                <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '16px 0', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Invoice #</span>
                                        <span style={{ fontWeight: '500' }}>INV-{selectedVehicle.id?.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Date</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Vehicle</span>
                                        <span style={{ fontWeight: '500' }}>{selectedVehicle.plateNumber}</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Customer</span>
                                        <span>{selectedVehicle.customerName || 'Walk-in'}</span>
                                    </div>
                                    {selectedVehicle.customerPhone && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Phone</span>
                                            <span>{selectedVehicle.customerPhone}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Service</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>{selectedVehicle.service?.name || 'Service'}</span>
                                        <span>KSH {selectedVehicle.service?.price || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Vehicle Type</span>
                                        <span>{selectedVehicle.vehicleType}</span>
                                    </div>
                                </div>

                                <div style={{ borderTop: '2px solid #1e293b', marginTop: '16px', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold' }}>
                                        <span>Total</span>
                                        <span style={{ color: '#10b981' }}>KSH {selectedVehicle.service?.price || 0}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                                    <p style={{ margin: 0 }}>Thank you for choosing Ecospark!</p>
                                    <p style={{ margin: '4px 0 0 0' }}>Time In: {selectedVehicle.timeIn ? new Date(selectedVehicle.timeIn).toLocaleString() : '-'}</p>
                                    <p style={{ margin: '4px 0 0 0' }}>Time Out: {selectedVehicle.timeOut ? new Date(selectedVehicle.timeOut).toLocaleString() : '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-secondary" onClick={() => setShowInvoiceModal(false)}>
                                Close
                            </button>
                            <button 
                                className="modal-btn modal-btn-primary" 
                                onClick={() => window.print()}
                            >
                                Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Service Packages Module Component - Firebase Integrated
function ServicePackages() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        features: '',
        category: 'standard'
    });
    const [notification, setNotification] = useState(null);

    // Show notification helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Subscribe to packages on mount
    useEffect(() => {
        const services = window.FirebaseServices;
        if (!services?.packagesService) {
            console.error('PackagesService not available');
            setLoading(false);
            return;
        }

        // Initialize default packages if none exist
        services.packagesService.initializeDefaultPackages();

        // Subscribe to real-time updates
        const unsubscribe = services.packagesService.subscribeToPackages(
            (packagesData) => {
                setPackages(packagesData);
                setLoading(false);
            },
            (error) => {
                console.error('Error subscribing to packages:', error);
                showNotification('Error loading packages', 'error');
                setLoading(false);
            }
        );

        return () => unsubscribe && unsubscribe();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Open modal for new package
    const handleAddNew = () => {
        setEditingPackage(null);
        setFormData({
            name: '',
            price: '',
            description: '',
            features: '',
            category: 'standard'
        });
        setShowModal(true);
    };

    // Open modal for editing
    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            description: pkg.description || '',
            features: Array.isArray(pkg.features) ? pkg.features.join(', ') : '',
            category: pkg.category || 'standard'
        });
        setShowModal(true);
    };

    // Save package (add or update)
    const handleSave = async () => {
        const services = window.FirebaseServices;
        if (!services?.packagesService) return;

        if (!formData.name.trim() || !formData.price) {
            showNotification('Name and price are required', 'error');
            return;
        }

        const packageData = {
            name: formData.name.trim(),
            price: parseFloat(formData.price),
            description: formData.description.trim(),
            features: formData.features.split(',').map(f => f.trim()).filter(f => f),
            category: formData.category
        };

        try {
            if (editingPackage) {
                await services.packagesService.updatePackage(editingPackage.id, packageData);
                showNotification('Package updated successfully');
            } else {
                await services.packagesService.addPackage(packageData);
                showNotification('Package added successfully');
            }
            setShowModal(false);
        } catch (error) {
            showNotification('Error saving package', 'error');
        }
    };

    // Delete package - show confirmation modal
    const handleDelete = (pkgId) => {
        setDeleteTargetId(pkgId);
        setShowConfirmModal(true);
    };

    // Confirm delete package
    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        
        const services = window.FirebaseServices;
        if (!services?.packagesService) return;

        try {
            await services.packagesService.deletePackage(deleteTargetId);
            showNotification('Package deleted successfully');
        } catch (error) {
            showNotification('Error deleting package', 'error');
        } finally {
            setShowConfirmModal(false);
            setDeleteTargetId(null);
        }
    };

    // Toggle package active status
    const handleToggleActive = async (pkg) => {
        const services = window.FirebaseServices;
        if (!services?.packagesService) return;

        try {
            await services.packagesService.updatePackage(pkg.id, { isActive: !pkg.isActive });
            showNotification(`Package ${pkg.isActive ? 'deactivated' : 'activated'}`);
        } catch (error) {
            showNotification('Error updating package status', 'error');
        }
    };

    // Get category color
    const getCategoryColor = (category) => {
        switch (category) {
            case 'premium': return '#f59e0b';
            case 'special': return '#8b5cf6';
            default: return '#3b82f6';
        }
    };

    return (
        <div className="module-content">
            {/* Notification */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header with Add Button */}
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <h2 className="section-title">Service Packages</h2>
                <button className="add-package-btn" onClick={handleAddNew}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Package
                </button>
            </div>

            {/* Packages Grid */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading packages...</p>
                </div>
            ) : packages.length === 0 ? (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/>
                        <path d="M9 21V9"/>
                    </svg>
                    <h3>No Packages Yet</h3>
                    <p>Create your first service package to get started</p>
                    <button className="primary-button" onClick={handleAddNew}>Create Package</button>
                </div>
            ) : (
                <div className="packages-grid">
                    {packages.map(pkg => (
                        <div key={pkg.id} className={`package-card ${!pkg.isActive ? 'inactive' : ''}`}>
                            <div className="package-header">
                                <span 
                                    className="package-category" 
                                    style={{ backgroundColor: getCategoryColor(pkg.category) }}
                                >
                                    {pkg.category || 'standard'}
                                </span>
                                <div className="package-actions">
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => handleToggleActive(pkg)}
                                        title={pkg.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {pkg.isActive ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                                <polyline points="22 4 12 14.01 9 11.01"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"/>
                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                            </svg>
                                        )}
                                    </button>
                                    <button className="icon-btn" onClick={() => handleEdit(pkg)} title="Edit">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(pkg.id)} title="Delete">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="package-body">
                                <h3 className="package-name">{pkg.name}</h3>
                                <div className="package-price">KES {pkg.price?.toLocaleString()}</div>
                                {pkg.description && <p className="package-description">{pkg.description}</p>}
                            </div>
                            {pkg.features && pkg.features.length > 0 && (
                                <div className="package-features">
                                    <h4>Includes:</h4>
                                    <ul>
                                        {pkg.features.map((feature, idx) => (
                                            <li key={idx}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPackage ? 'Edit Package' : 'Add New Package'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Package Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Premium Wash"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price (KES) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 1200"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                        <option value="special">Special</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of this package"
                                    className="form-textarea"
                                    rows="2"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Features (comma separated)</label>
                                <textarea
                                    name="features"
                                    value={formData.features}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Exterior Wash, Interior Vacuum, Hand Dry"
                                    className="form-textarea"
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="modal-btn-save" onClick={handleSave}>
                                {editingPackage ? 'Update Package' : 'Add Package'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="confirm-modal-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <h3 className="confirm-modal-title">Delete Package</h3>
                        <p className="confirm-modal-text">Are you sure you want to delete this package? This action cannot be undone.</p>
                        <div className="confirm-modal-actions">
                            <button className="modal-btn-cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="modal-btn-delete" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Equipment Management Module Component
function EquipmentManagement() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, due, overdue
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Theme colors
    const theme = {
        bg: isDark ? '#1e293b' : 'white',
        bgSecondary: isDark ? '#0f172a' : '#f8fafc',
        bgTertiary: isDark ? '#334155' : '#f1f5f9',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        textMuted: isDark ? '#64748b' : '#94a3b8',
        border: isDark ? '#334155' : '#e2e8f0',
        borderLight: isDark ? '#475569' : '#d1d5db',
        cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        modalOverlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        loadingOverlay: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.7)',
        inputBg: isDark ? '#1e293b' : 'white',
        rowHoverBg: isDark ? '#334155' : '#f8fafc',
        rowOverdueBg: isDark ? '#450a0a' : '#fef2f2',
        rowDueBg: isDark ? '#451a03' : '#fffbeb',
        // Button colors for dark mode
        btnTransferBg: isDark ? '#4c1d95' : '#f3e8ff',
        btnTransferText: isDark ? '#c4b5fd' : '#7c3aed',
        btnTransferBorder: isDark ? '#6d28d9' : '#ddd6fe',
        btnMaintainBg: isDark ? '#064e3b' : '#d1fae5',
        btnMaintainText: isDark ? '#6ee7b7' : '#059669',
        btnMaintainBorder: isDark ? '#059669' : '#a7f3d0',
        btnHistoryBg: isDark ? '#334155' : '#f1f5f9',
        btnHistoryText: isDark ? '#cbd5e1' : '#475569',
        btnHistoryBorder: isDark ? '#475569' : '#e2e8f0',
        btnEditBg: isDark ? '#1e3a8a' : '#dbeafe',
        btnEditText: isDark ? '#93c5fd' : '#2563eb',
        btnEditBorder: isDark ? '#3b82f6' : '#bfdbfe',
        btnDeleteBg: isDark ? '#7f1d1d' : '#fee2e2',
        btnDeleteText: isDark ? '#fca5a5' : '#dc2626',
        btnDeleteBorder: isDark ? '#dc2626' : '#fecaca',
    };

    const [formData, setFormData] = useState({
        name: '',
        type: 'pressure_washer',
        location: '',
        serialNumber: '',
        purchaseDate: '',
        lastMaintenance: '',
        nextMaintenance: '',
        status: 'operational',
        notes: ''
    });
    const [transferData, setTransferData] = useState({ toLocation: '', notes: '' });
    const [maintenanceData, setMaintenanceData] = useState({ type: 'routine', description: '', cost: '', performedBy: '', nextMaintenanceDate: '' });

    const EQUIPMENT_TYPES = [
        { id: 'pressure_washer', name: 'Pressure Washer' },
        { id: 'vacuum', name: 'Vacuum Cleaner' },
        { id: 'foam_cannon', name: 'Foam Cannon' },
        { id: 'air_compressor', name: 'Air Compressor' },
        { id: 'water_pump', name: 'Water Pump' },
        { id: 'polisher', name: 'Polisher/Buffer' },
        { id: 'generator', name: 'Generator' },
        { id: 'lift', name: 'Vehicle Lift' },
        { id: 'other', name: 'Other' }
    ];

    const STATUS_OPTIONS = [
        { id: 'operational', name: 'Operational', color: '#10b981' },
        { id: 'maintenance', name: 'Under Maintenance', color: '#f59e0b' },
        { id: 'repair', name: 'Needs Repair', color: '#ef4444' },
        { id: 'retired', name: 'Retired', color: '#6b7280' }
    ];

    const LOCATIONS = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Garage', 'Storage', 'Workshop', 'Office'];

    const MAINTENANCE_TYPES = [
        { id: 'routine', name: 'Routine Service' },
        { id: 'repair', name: 'Repair' },
        { id: 'inspection', name: 'Inspection' },
        { id: 'replacement', name: 'Part Replacement' },
        { id: 'calibration', name: 'Calibration' }
    ];

    // Get equipment due for maintenance
    const getMaintenanceDue = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        return equipment.filter(e => {
            if (!e.nextMaintenance) return false;
            const maintenanceDate = new Date(e.nextMaintenance);
            return maintenanceDate <= weekFromNow && maintenanceDate >= today;
        });
    };

    // Get overdue maintenance
    const getMaintenanceOverdue = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return equipment.filter(e => {
            if (!e.nextMaintenance) return false;
            const maintenanceDate = new Date(e.nextMaintenance);
            return maintenanceDate < today;
        });
    };

    // Get filtered equipment based on active tab
    const getFilteredEquipment = () => {
        switch(activeTab) {
            case 'due': return getMaintenanceDue();
            case 'overdue': return getMaintenanceOverdue();
            default: return equipment;
        }
    };

    // Subscribe to equipment data
    useEffect(() => {
        const services = window.FirebaseServices;
        if (!services) {
            setLoading(false);
            return;
        }

        const unsubscribe = services.equipmentService.subscribeToEquipment(
            (data) => {
                setEquipment(data);
                setLoading(false);
            },
            (err) => {
                console.error('Equipment subscription error:', err);
                setError('Failed to load equipment');
                setLoading(false);
            }
        );

        return () => unsubscribe && unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'pressure_washer',
            location: '',
            serialNumber: '',
            purchaseDate: '',
            lastMaintenance: '',
            nextMaintenance: '',
            status: 'operational',
            notes: ''
        });
    };

    const handleAddEquipment = async (e) => {
        e.preventDefault();
        const services = window.FirebaseServices;
        if (!services) {
            setError('Firebase not ready');
            return;
        }

        if (!formData.name.trim()) {
            setError('Equipment name is required');
            return;
        }

        setActionLoading(true);
        try {
            const result = await services.equipmentService.addEquipment(formData);
            if (result.success) {
                setShowAddModal(false);
                resetForm();
            } else {
                setError(result.error || 'Failed to add equipment');
            }
        } catch (err) {
            setError('Failed to add equipment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditEquipment = async (e) => {
        e.preventDefault();
        const services = window.FirebaseServices;
        if (!services || !selectedEquipment) return;

        setActionLoading(true);
        try {
            const result = await services.equipmentService.updateEquipment(selectedEquipment.id, formData);
            if (result.success) {
                setShowEditModal(false);
                setSelectedEquipment(null);
                resetForm();
            } else {
                setError(result.error || 'Failed to update equipment');
            }
        } catch (err) {
            setError('Failed to update equipment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEquipment = async (equipmentItem) => {
        if (!confirm(`Are you sure you want to delete "${equipmentItem.name}"?`)) return;
        
        const services = window.FirebaseServices;
        if (!services) return;

        setActionLoading(true);
        try {
            await services.equipmentService.deleteEquipment(equipmentItem.id);
        } catch (err) {
            setError('Failed to delete equipment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        const services = window.FirebaseServices;
        if (!services || !selectedEquipment) return;

        if (!transferData.toLocation) {
            setError('Please select a destination location');
            return;
        }

        setActionLoading(true);
        try {
            const result = await services.equipmentService.transferEquipment(
                selectedEquipment.id,
                selectedEquipment.location || 'Unknown',
                transferData.toLocation,
                transferData.notes
            );
            if (result.success) {
                setShowTransferModal(false);
                setSelectedEquipment(null);
                setTransferData({ toLocation: '', notes: '' });
            } else {
                setError(result.error || 'Failed to transfer equipment');
            }
        } catch (err) {
            setError('Failed to transfer equipment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogMaintenance = async (e) => {
        e.preventDefault();
        const services = window.FirebaseServices;
        if (!services || !selectedEquipment) return;

        setActionLoading(true);
        try {
            const result = await services.equipmentService.logMaintenance(selectedEquipment.id, maintenanceData);
            if (result.success) {
                // Update next maintenance date if provided
                if (maintenanceData.nextMaintenanceDate) {
                    await services.equipmentService.updateEquipment(selectedEquipment.id, {
                        nextMaintenance: maintenanceData.nextMaintenanceDate
                    });
                }
                setShowMaintenanceModal(false);
                setSelectedEquipment(null);
                setMaintenanceData({ type: 'routine', description: '', cost: '', performedBy: '', nextMaintenanceDate: '' });
            } else {
                setError(result.error || 'Failed to log maintenance');
            }
        } catch (err) {
            setError('Failed to log maintenance');
        } finally {
            setActionLoading(false);
        }
    };

    const openTransferModal = (equipmentItem) => {
        setSelectedEquipment(equipmentItem);
        setTransferData({ toLocation: '', notes: '' });
        setShowTransferModal(true);
    };

    const openMaintenanceModal = (equipmentItem) => {
        setSelectedEquipment(equipmentItem);
        setMaintenanceData({ type: 'routine', description: '', cost: '', performedBy: '', nextMaintenanceDate: '' });
        setShowMaintenanceModal(true);
    };

    const openHistoryModal = (equipmentItem) => {
        setSelectedEquipment(equipmentItem);
        setShowHistoryModal(true);
    };

    const openEditModal = (equipmentItem) => {
        setSelectedEquipment(equipmentItem);
        setFormData({
            name: equipmentItem.name || '',
            type: equipmentItem.type || 'pressure_washer',
            location: equipmentItem.location || '',
            serialNumber: equipmentItem.serialNumber || '',
            purchaseDate: equipmentItem.purchaseDate || '',
            lastMaintenance: equipmentItem.lastMaintenance || '',
            nextMaintenance: equipmentItem.nextMaintenance || '',
            status: equipmentItem.status || 'operational',
            notes: equipmentItem.notes || ''
        });
        setShowEditModal(true);
    };

    const getStatusColor = (status) => {
        const statusOption = STATUS_OPTIONS.find(s => s.id === status);
        return statusOption?.color || '#6b7280';
    };

    const getStatusLabel = (status) => {
        const statusOption = STATUS_OPTIONS.find(s => s.id === status);
        return statusOption?.name || status;
    };

    const getTypeLabel = (type) => {
        const typeOption = EQUIPMENT_TYPES.find(t => t.id === type);
        return typeOption?.name || type;
    };

    if (loading) {
        return (
            <div className="equipment-management" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px', backgroundColor: theme.bg }}>
                <div style={{ width: '40px', height: '40px', border: `3px solid ${theme.border}`, borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <p style={{ color: theme.textSecondary }}>Loading Equipment...</p>
            </div>
        );
    }

    const overdueCount = getMaintenanceOverdue().length;
    const dueCount = getMaintenanceDue().length;
    const filteredEquipment = getFilteredEquipment();

    return (
        <div className="equipment-management" style={{ backgroundColor: theme.bgSecondary, minHeight: '100%' }}>
            {/* Error Banner */}
            {error && (
                <div style={{ backgroundColor: isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: isDark ? '#fca5a5' : '#dc2626', cursor: 'pointer' }}>{Icons.x}</button>
                </div>
            )}

            {/* Action Loading Overlay */}
            {actionLoading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.loadingOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ width: '40px', height: '40px', border: `3px solid ${theme.border}`, borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                </div>
            )}

            {/* Maintenance Alert Banner */}
            {overdueCount > 0 && (
                <div style={{ backgroundColor: isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, borderLeft: '4px solid #ef4444', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <div>
                        <strong style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>{overdueCount} equipment overdue for maintenance!</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textSecondary }}>Click "Overdue" tab to view and schedule maintenance.</p>
                    </div>
                </div>
            )}

            {/* Header with Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <p style={{ color: theme.textSecondary, margin: 0 }}>Manage your garage and wash bay equipment</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '10px 20px', 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    {Icons.plus}
                    <span>Add Equipment</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: theme.bg, padding: '16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>{equipment.length}</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Total Equipment</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{equipment.filter(e => e.status === 'operational').length}</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Operational</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{dueCount}</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Due Soon</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{overdueCount}</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Overdue</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: `2px solid ${theme.border}` }}>
                <button 
                    onClick={() => setActiveTab('all')}
                    style={{ 
                        padding: '12px 20px', 
                        backgroundColor: activeTab === 'all' ? '#3b82f6' : theme.bg, 
                        color: activeTab === 'all' ? 'white' : theme.textSecondary, 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontWeight: '500', 
                        fontSize: '14px' 
                    }}
                >
                    All Equipment ({equipment.length})
                </button>
                <button 
                    onClick={() => setActiveTab('due')}
                    style={{ 
                        padding: '12px 20px', 
                        backgroundColor: activeTab === 'due' ? '#f59e0b' : theme.bg, 
                        color: activeTab === 'due' ? 'white' : theme.textSecondary, 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontWeight: '500', 
                        fontSize: '14px' 
                    }}
                >
                    Due for Maintenance ({dueCount})
                </button>
                <button 
                    onClick={() => setActiveTab('overdue')}
                    style={{ 
                        padding: '12px 20px', 
                        backgroundColor: activeTab === 'overdue' ? '#ef4444' : theme.bg, 
                        color: activeTab === 'overdue' ? 'white' : theme.textSecondary, 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontWeight: '500', 
                        fontSize: '14px' 
                    }}
                >
                    Overdue ({overdueCount})
                </button>
            </div>

            {/* Equipment List */}
            {filteredEquipment.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: theme.bg, boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{activeTab === 'all' ? '🔧' : '✅'}</div>
                    <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>{activeTab === 'all' ? 'No Equipment Yet' : 'No Equipment in This Category'}</h3>
                    <p style={{ color: theme.textSecondary, marginBottom: '20px' }}>{activeTab === 'all' ? 'Add your first equipment to get started' : activeTab === 'due' ? 'No equipment due for maintenance in the next 7 days' : 'All equipment maintenance is up to date!'}</p>
                    {activeTab === 'all' && (
                        <button 
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                        >
                            Add Equipment
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: theme.bg, boxShadow: theme.cardShadow, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme.bgSecondary, borderBottom: `1px solid ${theme.border}` }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Equipment</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Location</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Next Maintenance</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.map((item) => {
                                const isOverdue = item.nextMaintenance && new Date(item.nextMaintenance) < new Date();
                                const isDueSoon = item.nextMaintenance && !isOverdue && new Date(item.nextMaintenance) <= new Date(Date.now() + 7*24*60*60*1000);
                                return (
                                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: isOverdue ? theme.rowOverdueBg : isDueSoon ? theme.rowDueBg : theme.bg }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '500', color: theme.text }}>{item.name}</div>
                                            {item.serialNumber && <div style={{ fontSize: '12px', color: theme.textMuted }}>SN: {item.serialNumber}</div>}
                                        </td>
                                        <td style={{ padding: '16px', color: theme.textSecondary }}>{getTypeLabel(item.type)}</td>
                                        <td style={{ padding: '16px', color: theme.textSecondary }}>{item.location || '-'}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ 
                                                display: 'inline-block',
                                                padding: '4px 10px', 
                                                fontSize: '12px', 
                                                fontWeight: '500',
                                                backgroundColor: `${getStatusColor(item.status)}20`,
                                                color: getStatusColor(item.status)
                                            }}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {item.nextMaintenance ? (
                                                <span style={{ color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : theme.textSecondary, fontWeight: isOverdue || isDueSoon ? '500' : '400' }}>
                                                    {item.nextMaintenance}
                                                    {isOverdue && ' ⚠️'}
                                                    {isDueSoon && !isOverdue && ' ⏰'}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                <button 
                                                    onClick={() => openTransferModal(item)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        padding: '6px 10px', 
                                                        backgroundColor: theme.btnTransferBg, 
                                                        color: theme.btnTransferText, 
                                                        border: `1px solid ${theme.btnTransferBorder}`,
                                                        cursor: 'pointer', 
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Transfer Location"
                                                >
                                                    <span style={{ fontSize: '12px' }}>↔</span> Transfer
                                                </button>
                                                <button 
                                                    onClick={() => openMaintenanceModal(item)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        padding: '6px 10px', 
                                                        backgroundColor: theme.btnMaintainBg, 
                                                        color: theme.btnMaintainText, 
                                                        border: `1px solid ${theme.btnMaintainBorder}`,
                                                        cursor: 'pointer', 
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Log Maintenance"
                                                >
                                                    <span style={{ fontSize: '12px' }}>🔧</span> Maintain
                                                </button>
                                                <button 
                                                    onClick={() => openHistoryModal(item)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        padding: '6px 10px', 
                                                        backgroundColor: theme.btnHistoryBg, 
                                                        color: theme.btnHistoryText, 
                                                        border: `1px solid ${theme.btnHistoryBorder}`,
                                                        cursor: 'pointer', 
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="View History"
                                                >
                                                    <span style={{ fontSize: '12px' }}>📋</span> History
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        padding: '6px 10px', 
                                                        backgroundColor: theme.btnEditBg, 
                                                        color: theme.btnEditText, 
                                                        border: `1px solid ${theme.btnEditBorder}`,
                                                        cursor: 'pointer', 
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Edit"
                                                >
                                                    {Icons.edit}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteEquipment(item)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        padding: '6px 10px', 
                                                        backgroundColor: theme.btnDeleteBg, 
                                                        color: theme.btnDeleteText, 
                                                        border: `1px solid ${theme.btnDeleteBorder}`,
                                                        cursor: 'pointer', 
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                    title="Delete"
                                                >
                                                    {Icons.x}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Equipment Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Add Equipment</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>{Icons.x}</button>
                        </div>
                        <form onSubmit={handleAddEquipment}>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Equipment Name *</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g., Karcher HD 6/15 C"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Type</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        >
                                            {EQUIPMENT_TYPES.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Status</label>
                                        <select 
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        >
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status.id} value={status.id}>{status.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Location</label>
                                        <input 
                                            type="text" 
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            placeholder="e.g., Bay 1"
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Serial Number</label>
                                        <input 
                                            type="text" 
                                            value={formData.serialNumber}
                                            onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                                            placeholder="e.g., KHD-2024-001"
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Purchase Date</label>
                                        <input 
                                            type="date" 
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Next Maintenance</label>
                                        <input 
                                            type="date" 
                                            value={formData.nextMaintenance}
                                            onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Notes</label>
                                    <textarea 
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Additional notes..."
                                        rows="3"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.borderLight}`, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Add Equipment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Equipment Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowEditModal(false)}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Edit Equipment</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>{Icons.x}</button>
                        </div>
                        <form onSubmit={handleEditEquipment}>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Equipment Name *</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Type</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        >
                                            {EQUIPMENT_TYPES.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Status</label>
                                        <select 
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        >
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status.id} value={status.id}>{status.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Location</label>
                                        <input 
                                            type="text" 
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Serial Number</label>
                                        <input 
                                            type="text" 
                                            value={formData.serialNumber}
                                            onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Purchase Date</label>
                                        <input 
                                            type="date" 
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Next Maintenance</label>
                                        <input 
                                            type="date" 
                                            value={formData.nextMaintenance}
                                            onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Notes</label>
                                    <textarea 
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        rows="3"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.borderLight}`, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Equipment Modal */}
            {showTransferModal && selectedEquipment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowTransferModal(false)}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Transfer Equipment</h2>
                            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>{Icons.x}</button>
                        </div>
                        <form onSubmit={handleTransfer}>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ padding: '12px', backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}` }}>
                                    <div style={{ fontWeight: '500', color: theme.text }}>{selectedEquipment.name}</div>
                                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Current Location: <strong>{selectedEquipment.location || 'Not Set'}</strong></div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Transfer To *</label>
                                    <select 
                                        value={transferData.toLocation}
                                        onChange={(e) => setTransferData({...transferData, toLocation: e.target.value})}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                    >
                                        <option value="">Select Location</option>
                                        {LOCATIONS.filter(loc => loc !== selectedEquipment.location).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Transfer Notes</label>
                                    <textarea 
                                        value={transferData.notes}
                                        onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                                        placeholder="Reason for transfer..."
                                        rows="2"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                                <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.borderLight}`, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Maintenance Modal */}
            {showMaintenanceModal && selectedEquipment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowMaintenanceModal(false)}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Log Maintenance</h2>
                            <button onClick={() => setShowMaintenanceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>{Icons.x}</button>
                        </div>
                        <form onSubmit={handleLogMaintenance}>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ padding: '12px', backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}` }}>
                                    <div style={{ fontWeight: '500', color: theme.text }}>{selectedEquipment.name}</div>
                                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Last Maintenance: <strong>{selectedEquipment.lastMaintenance || 'Never'}</strong></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Maintenance Type *</label>
                                        <select 
                                            value={maintenanceData.type}
                                            onChange={(e) => setMaintenanceData({...maintenanceData, type: e.target.value})}
                                            required
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        >
                                            {MAINTENANCE_TYPES.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Cost (R)</label>
                                        <input 
                                            type="number" 
                                            value={maintenanceData.cost}
                                            onChange={(e) => setMaintenanceData({...maintenanceData, cost: e.target.value})}
                                            placeholder="0.00"
                                            step="0.01"
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Description *</label>
                                    <textarea 
                                        value={maintenanceData.description}
                                        onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}
                                        placeholder="Describe the maintenance performed..."
                                        rows="3"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Performed By</label>
                                        <input 
                                            type="text" 
                                            value={maintenanceData.performedBy}
                                            onChange={(e) => setMaintenanceData({...maintenanceData, performedBy: e.target.value})}
                                            placeholder="Technician name"
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: theme.text }}>Next Maintenance Date</label>
                                        <input 
                                            type="date" 
                                            value={maintenanceData.nextMaintenanceDate}
                                            onChange={(e) => setMaintenanceData({...maintenanceData, nextMaintenanceDate: e.target.value})}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.borderLight}`, fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: theme.inputBg, color: theme.text }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                                <button type="button" onClick={() => setShowMaintenanceModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.borderLight}`, cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Log Maintenance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Equipment History Modal */}
            {showHistoryModal && selectedEquipment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowHistoryModal(false)}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Equipment History</h2>
                            <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '4px' }}>{Icons.x}</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ padding: '12px', backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
                                <div style={{ fontWeight: '500', color: theme.text }}>{selectedEquipment.name}</div>
                                <div style={{ fontSize: '13px', color: theme.textSecondary }}>Current Location: {selectedEquipment.location || 'Not Set'} | Status: {getStatusLabel(selectedEquipment.status)}</div>
                            </div>

                            {/* Transfer History */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>↔️</span> Transfer History
                                </h3>
                                {(!selectedEquipment.transferHistory || selectedEquipment.transferHistory.length === 0) ? (
                                    <div style={{ padding: '16px', backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: '13px', textAlign: 'center' }}>
                                        No transfer history available
                                    </div>
                                ) : (
                                    <div style={{ border: `1px solid ${theme.border}` }}>
                                        {selectedEquipment.transferHistory.slice().reverse().map((transfer, idx) => (
                                            <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < selectedEquipment.transferHistory.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: idx % 2 === 0 ? theme.bg : theme.bgSecondary }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '500', color: theme.text }}>{transfer.fromLocation} → {transfer.toLocation}</span>
                                                    <span style={{ fontSize: '12px', color: theme.textMuted }}>{transfer.date}</span>
                                                </div>
                                                {transfer.notes && <div style={{ fontSize: '13px', color: theme.textSecondary }}>{transfer.notes}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Maintenance History */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🔧</span> Maintenance History
                                </h3>
                                {(!selectedEquipment.maintenanceHistory || selectedEquipment.maintenanceHistory.length === 0) ? (
                                    <div style={{ padding: '16px', backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: '13px', textAlign: 'center' }}>
                                        No maintenance history available
                                    </div>
                                ) : (
                                    <div style={{ border: `1px solid ${theme.border}` }}>
                                        {selectedEquipment.maintenanceHistory.slice().reverse().map((maintenance, idx) => (
                                            <div key={idx} style={{ padding: '12px 16px', borderBottom: idx < selectedEquipment.maintenanceHistory.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: idx % 2 === 0 ? theme.bg : theme.bgSecondary }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '500', color: theme.text, textTransform: 'capitalize' }}>{maintenance.type}</span>
                                                    <span style={{ fontSize: '12px', color: theme.textMuted }}>{maintenance.date}</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '4px' }}>{maintenance.description}</div>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: theme.textMuted }}>
                                                    {maintenance.performedBy && <span>By: {maintenance.performedBy}</span>}
                                                    {maintenance.cost && <span>Cost: KSh {parseFloat(maintenance.cost).toFixed(2)}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary }}>
                            <button onClick={() => setShowHistoryModal(false)} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Customer Management Component
function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [showLoyaltySettingsModal, setShowLoyaltySettingsModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'reminders'
    const [loyaltySettings, setLoyaltySettings] = useState({
        pointsPerVisit: 1,
        pointsPerRand: 0.1,
        redeemRate: 0.1,
        welcomeBonus: 10,
        birthdayBonus: 50,
        enabled: true
    });
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Theme colors
    const theme = {
        bg: isDark ? '#1e293b' : 'white',
        bgSecondary: isDark ? '#0f172a' : '#f8fafc',
        bgTertiary: isDark ? '#334155' : '#f1f5f9',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        textMuted: isDark ? '#64748b' : '#94a3b8',
        border: isDark ? '#334155' : '#e2e8f0',
        borderLight: isDark ? '#475569' : '#d1d5db',
        cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        modalOverlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        loadingOverlay: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.7)',
        inputBg: isDark ? '#1e293b' : 'white',
        rowHoverBg: isDark ? '#334155' : '#f8fafc',
        btnViewBg: isDark ? '#1e3a8a' : '#dbeafe',
        btnViewText: isDark ? '#93c5fd' : '#2563eb',
        btnViewBorder: isDark ? '#3b82f6' : '#bfdbfe',
        btnEditBg: isDark ? '#064e3b' : '#d1fae5',
        btnEditText: isDark ? '#6ee7b7' : '#059669',
        btnEditBorder: isDark ? '#059669' : '#a7f3d0',
        btnDeleteBg: isDark ? '#7f1d1d' : '#fee2e2',
        btnDeleteText: isDark ? '#fca5a5' : '#dc2626',
        btnDeleteBorder: isDark ? '#dc2626' : '#fecaca',
        btnAddVehicleBg: isDark ? '#4c1d95' : '#f3e8ff',
        btnAddVehicleText: isDark ? '#c4b5fd' : '#7c3aed',
        btnAddVehicleBorder: isDark ? '#6d28d9' : '#ddd6fe',
        btnLoyaltyBg: isDark ? '#713f12' : '#fef3c7',
        btnLoyaltyText: isDark ? '#fcd34d' : '#d97706',
        btnLoyaltyBorder: isDark ? '#d97706' : '#fde68a',
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    const [vehicleFormData, setVehicleFormData] = useState({
        plateNumber: '',
        make: '',
        model: '',
        color: '',
        year: '',
        nextServiceDate: ''
    });

    const [settingsFormData, setSettingsFormData] = useState({
        pointsPerVisit: 1,
        pointsPerRand: 0.1,
        redeemRate: 0.1,
        welcomeBonus: 10,
        birthdayBonus: 50,
        enabled: true
    });

    // Subscribe to customers data
    useEffect(() => {
        const services = window.FirebaseServices;
        if (!services?.customerService) return;
        const unsubscribe = services.customerService.subscribeToCustomers(
            (data) => {
                setCustomers(data);
                setLoading(false);
            },
            (err) => {
                setError('Failed to load customers');
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Subscribe to loyalty settings
    useEffect(() => {
        const services = window.FirebaseServices;
        if (!services?.loyaltySettingsService) return;
        const unsubscribe = services.loyaltySettingsService.subscribeToSettings(
            (settings) => {
                if (settings) {
                    setLoyaltySettings(settings);
                    setSettingsFormData(settings);
                }
            },
            (err) => {
                console.error('Failed to load loyalty settings', err);
            }
        );
        return () => unsubscribe();
    }, []);

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer => {
        const query = searchQuery.toLowerCase();
        const nameMatch = customer.name?.toLowerCase().includes(query);
        const phoneMatch = customer.phone?.toLowerCase().includes(query);
        const emailMatch = customer.email?.toLowerCase().includes(query);
        const plateMatch = customer.vehicles?.some(v => v.plateNumber?.toLowerCase().includes(query));
        return nameMatch || phoneMatch || emailMatch || plateMatch;
    });

    // Reset form data
    const resetFormData = () => {
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    };

    const resetVehicleFormData = () => {
        setVehicleFormData({ plateNumber: '', make: '', model: '', color: '', year: '', nextServiceDate: '' });
    };

    // Get vehicles due for service (within 7 days or overdue)
    const getServiceReminders = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        const reminders = [];
        customers.forEach(customer => {
            customer.vehicles?.forEach(vehicle => {
                if (vehicle.nextServiceDate) {
                    const serviceDate = new Date(vehicle.nextServiceDate);
                    if (serviceDate <= weekFromNow) {
                        reminders.push({
                            customer,
                            vehicle,
                            dueDate: serviceDate,
                            isOverdue: serviceDate < today,
                            daysUntil: Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24))
                        });
                    }
                }
            });
        });
        return reminders.sort((a, b) => a.dueDate - b.dueDate);
    };

    // Generate receipt for a service
    const generateReceipt = (customer, vehicle, service) => {
        const receiptNumber = 'RCP-' + Date.now().toString(36).toUpperCase();
        const receipt = {
            receiptNumber,
            date: new Date().toISOString(),
            customer: {
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            },
            vehicle: {
                plateNumber: vehicle?.plateNumber || 'N/A',
                make: vehicle?.make || '',
                model: vehicle?.model || '',
                color: vehicle?.color || ''
            },
            service: service || { name: 'Car Wash Service', price: 0 },
            pointsEarned: loyaltySettings.enabled ? loyaltySettings.pointsPerVisit : 0,
            totalPoints: (customer.loyaltyPoints || 0) + (loyaltySettings.enabled ? loyaltySettings.pointsPerVisit : 0)
        };
        setReceiptData(receipt);
        setShowReceiptModal(true);
    };

    // Print receipt
    const handlePrintReceipt = () => {
        const printContent = document.getElementById('receipt-content');
        const printWindow = window.open('', '', 'width=400,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - ${receiptData?.receiptNumber}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
                    .company { font-size: 20px; font-weight: bold; }
                    .tagline { font-size: 11px; color: #666; }
                    .section { margin: 15px 0; }
                    .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                    .label { color: #666; }
                    .value { font-weight: 500; text-align: right; }
                    .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
                    .total-row { font-size: 16px; font-weight: bold; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 2px dashed #000; padding-top: 10px; }
                    .points { background: #f5f5f5; padding: 10px; text-align: center; margin-top: 15px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Handle add customer
    const handleAddCustomer = async () => {
        if (!formData.name || !formData.phone) {
            setError('Name and phone are required');
            return;
        }
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.customerService.addCustomer({
                ...formData,
                vehicles: [],
                loyaltyPoints: loyaltySettings.enabled ? loyaltySettings.welcomeBonus : 0,
                totalVisits: 0,
                totalSpent: 0
            });
            setShowAddModal(false);
            resetFormData();
        } catch (err) {
            setError('Failed to add customer');
        }
        setActionLoading(false);
    };

    // Handle edit customer
    const handleEditCustomer = async () => {
        if (!formData.name || !formData.phone) {
            setError('Name and phone are required');
            return;
        }
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.customerService.updateCustomer(selectedCustomer.id, formData);
            setShowEditModal(false);
            setSelectedCustomer(null);
            resetFormData();
        } catch (err) {
            setError('Failed to update customer');
        }
        setActionLoading(false);
    };

    // Handle delete customer
    const handleDeleteCustomer = async (customerId) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.customerService.deleteCustomer(customerId);
        } catch (err) {
            setError('Failed to delete customer');
        }
        setActionLoading(false);
    };

    // Handle add vehicle to customer
    const handleAddVehicle = async () => {
        if (!vehicleFormData.plateNumber) {
            setError('Plate number is required');
            return;
        }
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.customerService.addVehicleToCustomer(selectedCustomer.id, vehicleFormData);
            setShowAddVehicleModal(false);
            resetVehicleFormData();
            // Refresh selected customer
            const updated = customers.find(c => c.id === selectedCustomer.id);
            if (updated) setSelectedCustomer(updated);
        } catch (err) {
            setError('Failed to add vehicle');
        }
        setActionLoading(false);
    };

    // Handle remove vehicle from customer
    const handleRemoveVehicle = async (plateNumber) => {
        if (!confirm('Are you sure you want to remove this vehicle?')) return;
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.customerService.removeVehicleFromCustomer(selectedCustomer.id, plateNumber);
            // Refresh selected customer
            const updated = customers.find(c => c.id === selectedCustomer.id);
            if (updated) setSelectedCustomer(updated);
        } catch (err) {
            setError('Failed to remove vehicle');
        }
        setActionLoading(false);
    };

    // Handle save loyalty settings
    const handleSaveLoyaltySettings = async () => {
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.loyaltySettingsService.updateSettings(settingsFormData);
            setShowLoyaltySettingsModal(false);
        } catch (err) {
            setError('Failed to save settings');
        }
        setActionLoading(false);
    };

    // Open edit modal
    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            notes: customer.notes || ''
        });
        setShowEditModal(true);
    };

    // Open view modal
    const openViewModal = (customer) => {
        setSelectedCustomer(customer);
        setShowViewModal(true);
    };

    // Open add vehicle modal
    const openAddVehicleModal = (customer) => {
        setSelectedCustomer(customer);
        resetVehicleFormData();
        setShowAddVehicleModal(true);
    };

    // Input style
    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: `1px solid ${theme.border}`,
        fontSize: '14px',
        backgroundColor: theme.inputBg,
        color: theme.text,
        outline: 'none'
    };

    // Label style
    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontSize: '13px',
        fontWeight: '500',
        color: theme.textSecondary
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>
                <div style={{ fontSize: '18px' }}>Loading customers...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: theme.bgSecondary, minHeight: '100%' }}>
            {/* Error message */}
            {error && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: `2px solid ${theme.border}` }}>
                <button
                    onClick={() => setActiveTab('customers')}
                    style={{ padding: '12px 24px', backgroundColor: 'transparent', color: activeTab === 'customers' ? '#3b82f6' : theme.textSecondary, border: 'none', borderBottom: activeTab === 'customers' ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: '-2px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                    👥 Customers
                </button>
                <button
                    onClick={() => setActiveTab('reminders')}
                    style={{ padding: '12px 24px', backgroundColor: 'transparent', color: activeTab === 'reminders' ? '#3b82f6' : theme.textSecondary, border: 'none', borderBottom: activeTab === 'reminders' ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: '-2px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    🔔 Service Reminders
                    {getServiceReminders().length > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>{getServiceReminders().length}</span>
                    )}
                </button>
            </div>

            {/* Header with search and actions */}
            {activeTab === 'customers' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <input
                            type="text"
                            placeholder="Search by name, phone, or plate number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: '40px' }}
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>🔍</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowLoyaltySettingsModal(true)}
                        style={{ padding: '10px 16px', backgroundColor: theme.btnLoyaltyBg, color: theme.btnLoyaltyText, border: `1px solid ${theme.btnLoyaltyBorder}`, cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        ⚙️ Loyalty Settings
                    </button>
                    <button
                        onClick={() => { resetFormData(); setShowAddModal(true); }}
                        style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        + Add Customer
                    </button>
                </div>
            </div>
            )}

            {/* Stats Cards */}
            {activeTab === 'customers' && (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: theme.bg, padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Total Customers</div>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: theme.text }}>{customers.length}</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Total Vehicles</div>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: theme.text }}>{customers.reduce((sum, c) => sum + (c.vehicles?.length || 0), 0)}</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Total Visits</div>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: theme.text }}>{customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0)}</div>
                </div>
                <div style={{ backgroundColor: theme.bg, padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>Total Points Issued</div>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: '#f59e0b' }}>{customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)}</div>
                </div>
            </div>

            {/* Customers Table */}
            <div style={{ backgroundColor: theme.bg, boxShadow: theme.cardShadow, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme.bgTertiary }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Customer</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Phone</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Vehicles</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Visits</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Points</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                                        {searchQuery ? 'No customers found matching your search' : 'No customers yet. Add your first customer!'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: '500', color: theme.text }}>{customer.name}</div>
                                            {customer.email && <div style={{ fontSize: '12px', color: theme.textMuted }}>{customer.email}</div>}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: theme.text }}>{customer.phone}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {customer.vehicles?.length > 0 ? (
                                                    customer.vehicles.map((v, idx) => (
                                                        <span key={idx} style={{ padding: '4px 8px', backgroundColor: theme.bgTertiary, fontSize: '12px', fontWeight: '500', color: theme.text, border: `1px solid ${theme.border}` }}>
                                                            {v.plateNumber}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: theme.textMuted, fontSize: '13px' }}>No vehicles</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: theme.text }}>{customer.totalVisits || 0}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '4px 10px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '13px', fontWeight: '600' }}>
                                                {customer.loyaltyPoints || 0} pts
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <button onClick={() => openViewModal(customer)} style={{ padding: '6px 12px', backgroundColor: theme.btnViewBg, color: theme.btnViewText, border: `1px solid ${theme.btnViewBorder}`, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>View</button>
                                                <button onClick={() => openEditModal(customer)} style={{ padding: '6px 12px', backgroundColor: theme.btnEditBg, color: theme.btnEditText, border: `1px solid ${theme.btnEditBorder}`, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Edit</button>
                                                <button onClick={() => openAddVehicleModal(customer)} style={{ padding: '6px 12px', backgroundColor: theme.btnAddVehicleBg, color: theme.btnAddVehicleText, border: `1px solid ${theme.btnAddVehicleBorder}`, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>+ Car</button>
                                                <button onClick={() => generateReceipt(customer, customer.vehicles?.[0], { name: 'Service', price: 0 })} style={{ padding: '6px 12px', backgroundColor: theme.btnLoyaltyBg, color: theme.btnLoyaltyText, border: `1px solid ${theme.btnLoyaltyBorder}`, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>🧾</button>
                                                <button onClick={() => handleDeleteCustomer(customer.id)} style={{ padding: '6px 12px', backgroundColor: theme.btnDeleteBg, color: theme.btnDeleteText, border: `1px solid ${theme.btnDeleteBorder}`, cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}

            {/* Service Reminders Tab */}
            {activeTab === 'reminders' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>Upcoming Service Reminders</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted }}>Vehicles due for service within the next 7 days</p>
                    </div>
                    
                    {getServiceReminders().length === 0 ? (
                        <div style={{ backgroundColor: theme.bg, padding: '60px 20px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                            <div style={{ fontSize: '16px', fontWeight: '500', color: theme.text, marginBottom: '8px' }}>No Upcoming Reminders</div>
                            <div style={{ fontSize: '13px', color: theme.textMuted }}>All vehicles are up to date with their service schedules</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {getServiceReminders().map((reminder, idx) => (
                                <div key={idx} style={{ backgroundColor: theme.bg, padding: '20px', border: `1px solid ${reminder.isOverdue ? '#fecaca' : theme.border}`, borderLeft: `4px solid ${reminder.isOverdue ? '#ef4444' : '#f59e0b'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <span style={{ padding: '4px 10px', backgroundColor: reminder.isOverdue ? '#fee2e2' : '#fef3c7', color: reminder.isOverdue ? '#dc2626' : '#d97706', fontSize: '12px', fontWeight: '600' }}>
                                                    {reminder.isOverdue ? 'OVERDUE' : `Due in ${reminder.daysUntil} day${reminder.daysUntil !== 1 ? 's' : ''}`}
                                                </span>
                                                <span style={{ fontSize: '13px', color: theme.textMuted }}>{new Date(reminder.dueDate).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontWeight: '600', fontSize: '16px', color: theme.text, marginBottom: '4px' }}>{reminder.vehicle.plateNumber}</div>
                                            <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px' }}>
                                                {[reminder.vehicle.make, reminder.vehicle.model, reminder.vehicle.year].filter(Boolean).join(' ') || 'Vehicle'}
                                            </div>
                                            <div style={{ fontSize: '13px', color: theme.textMuted }}>
                                                Owner: <span style={{ color: theme.text, fontWeight: '500' }}>{reminder.customer.name}</span> • {reminder.customer.phone}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { window.location.href = `tel:${reminder.customer.phone}`; }} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>📞 Call</button>
                                            <button onClick={() => openViewModal(reminder.customer)} style={{ padding: '8px 16px', backgroundColor: theme.btnViewBg, color: theme.btnViewText, border: `1px solid ${theme.btnViewBorder}`, cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>View Customer</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Add New Customer</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} placeholder="Customer name" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Phone *</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} placeholder="Phone number" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="Email address" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={inputStyle} placeholder="Address" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleAddCustomer} disabled={actionLoading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: actionLoading ? 0.7 : 1 }}>
                                {actionLoading ? 'Adding...' : 'Add Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && selectedCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Edit Customer</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} placeholder="Customer name" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Phone *</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={inputStyle} placeholder="Phone number" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} placeholder="Email address" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={inputStyle} placeholder="Address" />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleEditCustomer} disabled={actionLoading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: actionLoading ? 0.7 : 1 }}>
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Customer Modal */}
            {showViewModal && selectedCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Customer Details</h2>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            {/* Customer Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Name</div>
                                        <div style={{ fontSize: '14px', color: theme.text, fontWeight: '500' }}>{selectedCustomer.name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Phone</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedCustomer.phone}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Email</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedCustomer.email || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Address</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedCustomer.address || '-'}</div>
                                    </div>
                                </div>
                                {selectedCustomer.notes && (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Notes</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedCustomer.notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Loyalty Stats */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loyalty & Visits</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>{selectedCustomer.loyaltyPoints || 0}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Loyalty Points</div>
                                    </div>
                                    <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: theme.text }}>{selectedCustomer.totalVisits || 0}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Total Visits</div>
                                    </div>
                                    <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>KSh {(selectedCustomer.totalSpent || 0).toFixed(2)}</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>Total Spent</div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicles */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicles ({selectedCustomer.vehicles?.length || 0})</h3>
                                    <button onClick={() => { setShowViewModal(false); openAddVehicleModal(selectedCustomer); }} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>+ Add Vehicle</button>
                                </div>
                                {selectedCustomer.vehicles?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {selectedCustomer.vehicles.map((vehicle, idx) => {
                                            const isServiceDue = vehicle.nextServiceDate && new Date(vehicle.nextServiceDate) <= new Date();
                                            return (
                                            <div key={idx} style={{ backgroundColor: theme.bgTertiary, padding: '14px', border: `1px solid ${isServiceDue ? '#fecaca' : theme.border}`, borderLeft: isServiceDue ? '4px solid #ef4444' : `1px solid ${theme.border}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', fontSize: '15px', color: theme.text, marginBottom: '4px' }}>{vehicle.plateNumber}</div>
                                                        <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>
                                                            {[vehicle.make, vehicle.model, vehicle.year, vehicle.color].filter(Boolean).join(' • ') || 'No details'}
                                                        </div>
                                                        {vehicle.nextServiceDate && (
                                                            <div style={{ fontSize: '12px', color: isServiceDue ? '#dc2626' : theme.textMuted }}>
                                                                🔧 Next service: {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                                                                {isServiceDue && <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: '600' }}>DUE</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => generateReceipt(selectedCustomer, vehicle, { name: 'Car Wash', price: 0 })} style={{ padding: '6px 10px', backgroundColor: theme.btnLoyaltyBg, color: theme.btnLoyaltyText, border: `1px solid ${theme.btnLoyaltyBorder}`, cursor: 'pointer', fontSize: '12px' }}>🧾</button>
                                                        <button onClick={() => handleRemoveVehicle(vehicle.plateNumber)} style={{ padding: '6px 10px', backgroundColor: theme.btnDeleteBg, color: theme.btnDeleteText, border: `1px solid ${theme.btnDeleteBorder}`, cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <div style={{ padding: '30px', textAlign: 'center', color: theme.textMuted, backgroundColor: theme.bgTertiary }}>No vehicles registered</div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowViewModal(false)} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && selectedCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Add Vehicle</h2>
                                <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>For: {selectedCustomer.name}</div>
                            </div>
                            <button onClick={() => setShowAddVehicleModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Plate Number *</label>
                                <input type="text" value={vehicleFormData.plateNumber} onChange={(e) => setVehicleFormData({...vehicleFormData, plateNumber: e.target.value.toUpperCase()})} style={inputStyle} placeholder="e.g., CA 123-456" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Make</label>
                                    <input type="text" value={vehicleFormData.make} onChange={(e) => setVehicleFormData({...vehicleFormData, make: e.target.value})} style={inputStyle} placeholder="e.g., Toyota" />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Model</label>
                                    <input type="text" value={vehicleFormData.model} onChange={(e) => setVehicleFormData({...vehicleFormData, model: e.target.value})} style={inputStyle} placeholder="e.g., Corolla" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Year</label>
                                    <input type="text" value={vehicleFormData.year} onChange={(e) => setVehicleFormData({...vehicleFormData, year: e.target.value})} style={inputStyle} placeholder="e.g., 2022" />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Color</label>
                                    <input type="text" value={vehicleFormData.color} onChange={(e) => setVehicleFormData({...vehicleFormData, color: e.target.value})} style={inputStyle} placeholder="e.g., White" />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Next Service Date</label>
                                <input type="date" value={vehicleFormData.nextServiceDate} onChange={(e) => setVehicleFormData({...vehicleFormData, nextServiceDate: e.target.value})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Set a reminder for the next service</div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowAddVehicleModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleAddVehicle} disabled={actionLoading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: actionLoading ? 0.7 : 1 }}>
                                {actionLoading ? 'Adding...' : 'Add Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loyalty Settings Modal */}
            {showLoyaltySettingsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>⚙️ Loyalty Settings</h2>
                            <button onClick={() => setShowLoyaltySettingsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px', padding: '14px', backgroundColor: theme.bgTertiary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '500', color: theme.text }}>Enable Loyalty Program</div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted }}>Turn the loyalty system on or off</div>
                                </div>
                                <button
                                    onClick={() => setSettingsFormData({...settingsFormData, enabled: !settingsFormData.enabled})}
                                    style={{ width: '50px', height: '26px', backgroundColor: settingsFormData.enabled ? '#10b981' : theme.border, border: 'none', cursor: 'pointer', position: 'relative' }}
                                >
                                    <span style={{ position: 'absolute', width: '20px', height: '20px', backgroundColor: 'white', top: '3px', left: settingsFormData.enabled ? '27px' : '3px', transition: 'left 0.2s' }}></span>
                                </button>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Points Per Visit</label>
                                <input type="number" min="0" step="1" value={settingsFormData.pointsPerVisit} onChange={(e) => setSettingsFormData({...settingsFormData, pointsPerVisit: Number(e.target.value)})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Points awarded for each visit</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Points Per KSh Spent</label>
                                <input type="number" min="0" step="0.01" value={settingsFormData.pointsPerRand} onChange={(e) => setSettingsFormData({...settingsFormData, pointsPerRand: Number(e.target.value)})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Additional points earned per KSh 1 spent</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Redeem Rate (KSh per Point)</label>
                                <input type="number" min="0" step="0.01" value={settingsFormData.redeemRate} onChange={(e) => setSettingsFormData({...settingsFormData, redeemRate: Number(e.target.value)})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Value of each point when redeemed (e.g., 0.1 = KSh 0.10 per point)</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Welcome Bonus Points</label>
                                <input type="number" min="0" step="1" value={settingsFormData.welcomeBonus} onChange={(e) => setSettingsFormData({...settingsFormData, welcomeBonus: Number(e.target.value)})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Points given to new customers</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Birthday Bonus Points</label>
                                <input type="number" min="0" step="1" value={settingsFormData.birthdayBonus} onChange={(e) => setSettingsFormData({...settingsFormData, birthdayBonus: Number(e.target.value)})} style={inputStyle} />
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Bonus points on customer's birthday</div>
                            </div>
                        </div>
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowLoyaltySettingsModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                            <button onClick={handleSaveLoyaltySettings} disabled={actionLoading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: actionLoading ? 0.7 : 1 }}>
                                {actionLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && receiptData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>🧾 Receipt</h2>
                            <button onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
                        </div>
                        
                        {/* Receipt Content */}
                        <div id="receipt-content" style={{ padding: '20px' }}>
                            <div className="header" style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '15px', marginBottom: '15px' }}>
                                <div className="company" style={{ fontSize: '22px', fontWeight: 'bold', color: theme.text }}>ECOSPARK</div>
                                <div className="tagline" style={{ fontSize: '12px', color: theme.textMuted }}>Car Wash & Auto Services</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '8px' }}>Receipt #{receiptData.receiptNumber}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(receiptData.date).toLocaleString()}</div>
                            </div>
                            
                            <div className="section" style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Details</div>
                                <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{receiptData.customer.name}</div>
                                <div style={{ fontSize: '13px', color: theme.textSecondary }}>{receiptData.customer.phone}</div>
                                {receiptData.customer.email && <div style={{ fontSize: '13px', color: theme.textSecondary }}>{receiptData.customer.email}</div>}
                            </div>
                            
                            <div className="section" style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' }}>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>{receiptData.vehicle.plateNumber}</div>
                                <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                                    {[receiptData.vehicle.make, receiptData.vehicle.model, receiptData.vehicle.color].filter(Boolean).join(' • ') || 'N/A'}
                                </div>
                            </div>
                            
                            <div className="section" style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' }}>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Service</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', color: theme.text }}>{receiptData.service.name}</span>
                                    <span style={{ fontSize: '16px', fontWeight: '600', color: theme.text }}>KSh {(receiptData.service.price || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="divider" style={{ borderTop: '2px solid #333', margin: '15px 0' }}></div>
                            
                            <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                <span style={{ color: theme.text }}>TOTAL</span>
                                <span style={{ color: theme.text }}>KSh {(receiptData.service.price || 0).toFixed(2)}</span>
                            </div>
                            
                            {receiptData.pointsEarned > 0 && (
                                <div className="points" style={{ backgroundColor: theme.bgTertiary, padding: '12px', textAlign: 'center', marginTop: '15px' }}>
                                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>Points Earned This Visit</div>
                                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>+{receiptData.pointsEarned}</div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>Total Points: {receiptData.totalPoints}</div>
                                </div>
                            )}
                            
                            <div className="footer" style={{ textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #ccc', fontSize: '11px', color: theme.textMuted }}>
                                <div>Thank you for choosing Ecospark!</div>
                                <div style={{ marginTop: '4px' }}>We appreciate your business</div>
                            </div>
                        </div>
                        
                        <div style={{ padding: '20px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowReceiptModal(false)} style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer', fontSize: '14px' }}>Close</button>
                            <button onClick={handlePrintReceipt} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🖨️ Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== GARAGE MANAGEMENT MODULE ====================
function GarageManagement() {
    // State management
    const [queue, setQueue] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [garageServices, setGarageServices] = useState([]);
    const [intakeVehicles, setIntakeVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('queue'); // queue, jobs, completed
    const [showAddModal, setShowAddModal] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showServicesModal, setShowServicesModal] = useState(false);
    const [showServiceFormModal, setShowServiceFormModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceFormData, setServiceFormData] = useState({
        name: '',
        category: 'maintenance',
        price: '',
        duration: '',
        description: ''
    });
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIntakeVehicle, setSelectedIntakeVehicle] = useState('');
    const [intakeRecords, setIntakeRecords] = useState([]); // Vehicles assigned to bays
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferVehicle, setTransferVehicle] = useState(null);
    const [transferServices, setTransferServices] = useState([]);
    const [transferNotes, setTransferNotes] = useState('');
    const [transferPriority, setTransferPriority] = useState('normal');
    const [technicianNotes, setTechnicianNotes] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    // Form data for adding to queue
    const [formData, setFormData] = useState({
        plateNumber: '',
        vehicleType: 'Sedan',
        customerName: '',
        customerPhone: '',
        services: [],
        notes: '',
        priority: 'normal'
    });

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Theme colors
    const theme = {
        bg: isDark ? '#1e293b' : 'white',
        bgSecondary: isDark ? '#0f172a' : '#f8fafc',
        bgTertiary: isDark ? '#334155' : '#f1f5f9',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        textMuted: isDark ? '#64748b' : '#94a3b8',
        border: isDark ? '#334155' : '#e2e8f0',
        borderLight: isDark ? '#475569' : '#cbd5e1',
        cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        modalOverlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        inputBg: isDark ? '#1e293b' : 'white',
        rowHoverBg: isDark ? '#334155' : '#f8fafc',
    };

    const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus', 'Other'];
    const PRIORITY_OPTIONS = [
        { id: 'low', name: 'Low', color: '#6b7280' },
        { id: 'normal', name: 'Normal', color: '#3b82f6' },
        { id: 'high', name: 'High', color: '#f59e0b' },
        { id: 'urgent', name: 'Urgent', color: '#ef4444' }
    ];

    // Initialize Firebase subscriptions
    useEffect(() => {
        let unsubQueue, unsubJobs, unsubGarageServices, unsubIntakeQueue, unsubIntakeRecords;
        let retryCount = 0;
        const maxRetries = 10;

        const initializeData = async () => {
            // Wait for Firebase services to be available
            let services = window.FirebaseServices;
            while (!services && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                services = window.FirebaseServices;
                retryCount++;
            }

            if (!services) {
                console.error('❌ Firebase services not available after retries');
                setLoading(false);
                setError('Firebase services not available. Please refresh.');
                return;
            }

            console.log('🔧 Garage: Firebase services available, initializing...');

            try {
                // Initialize default garage services
                if (services.garageServicesService) {
                    await services.garageServicesService.initializeDefaultServices();
                }

                // Subscribe to garage queue
                if (services.garageQueueService) {
                    unsubQueue = services.garageQueueService.subscribeToQueue(
                        (data) => {
                            console.log('🔧 Garage queue updated:', data.length, 'items');
                            setQueue(data);
                        },
                        (err) => console.error('Garage queue error:', err)
                    );
                }

                // Subscribe to garage jobs
                if (services.garageJobsService) {
                    unsubJobs = services.garageJobsService.subscribeToJobs(
                        (data) => setJobs(data),
                        (err) => console.error('Garage jobs error:', err)
                    );
                }

                // Subscribe to garage services catalog
                if (services.garageServicesService) {
                    unsubGarageServices = services.garageServicesService.subscribeToServices(
                        (data) => setGarageServices(data.filter(s => s.isActive !== false)),
                        (err) => console.error('Garage services error:', err)
                    );
                }

                // Subscribe to intake queue (to pull waiting vehicles)
                if (services.intakeQueueService) {
                    console.log('🔧 Subscribing to intake queue for garage...');
                    unsubIntakeQueue = services.intakeQueueService.subscribeToQueue(
                        (data) => {
                            console.log('🚗 Intake queue for garage:', data.length, 'waiting');
                            setIntakeVehicles(data);
                        },
                        (err) => console.error('Intake queue error:', err)
                    );
                } else {
                    console.error('❌ intakeQueueService not available');
                }

                // Subscribe to intake records (vehicles assigned to bays/in-progress)
                if (services.intakeRecordsService) {
                    console.log('🔧 Subscribing to intake records for garage...');
                    unsubIntakeRecords = services.intakeRecordsService.subscribeToRecords(
                        (data) => {
                            // Filter to only in-progress vehicles (not completed)
                            const activeRecords = data.filter(r => r.status === 'in-progress');
                            console.log('🚗 Intake records for garage:', activeRecords.length, 'in-progress');
                            setIntakeRecords(activeRecords);
                        },
                        (err) => console.error('Intake records error:', err)
                    );
                }

                setLoading(false);
            } catch (err) {
                console.error('Failed to initialize garage:', err);
                setError('Failed to initialize. Please refresh.');
                setLoading(false);
            }
        };

        initializeData();

        return () => {
            if (unsubQueue) unsubQueue();
            if (unsubJobs) unsubJobs();
            if (unsubGarageServices) unsubGarageServices();
            if (unsubIntakeQueue) unsubIntakeQueue();
            if (unsubIntakeRecords) unsubIntakeRecords();
        };
    }, []);

    // Calculate stats
    const stats = {
        waiting: queue.length,
        inProgress: jobs.filter(j => j.status === 'in-progress').length,
        completedToday: jobs.filter(j => {
            if (j.status !== 'completed' || !j.completedAt) return false;
            const today = new Date();
            const completed = new Date(j.completedAt);
            return completed.toDateString() === today.toDateString();
        }).length,
        totalRevenue: jobs.filter(j => {
            if (j.status !== 'completed' || !j.completedAt) return false;
            const today = new Date();
            const completed = new Date(j.completedAt);
            return completed.toDateString() === today.toDateString();
        }).reduce((sum, j) => sum + (j.totalCost || 0), 0)
    };

    // Filter queue/jobs based on search and status
    const getFilteredData = () => {
        let data = [];
        if (activeTab === 'queue') {
            data = queue;
        } else if (activeTab === 'jobs') {
            data = jobs.filter(j => j.status === 'in-progress');
        } else {
            data = jobs.filter(j => j.status === 'completed');
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.plateNumber?.toLowerCase().includes(query) ||
                item.customerName?.toLowerCase().includes(query) ||
                item.customerPhone?.includes(query) ||
                item.vehicleType?.toLowerCase().includes(query)
            );
        }

        // Status filter for queue
        if (activeTab === 'queue' && statusFilter !== 'all') {
            data = data.filter(item => item.priority === statusFilter);
        }

        return data;
    };

    const filteredData = getFilteredData();

    // Pagination logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset page when tab or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, statusFilter]);

    // Handle adding vehicle from intake to garage queue
    const handleAddFromIntake = async () => {
        if (!selectedIntakeVehicle) return;

        const services = window.FirebaseServices;
        if (!services?.garageQueueService) {
            setError('Services not available');
            return;
        }

        // Parse the selected value to determine source type
        const [sourceType, sourceId] = selectedIntakeVehicle.split(':');
        let vehicle = null;
        let isFromQueue = sourceType === 'queue';

        if (isFromQueue) {
            vehicle = intakeVehicles.find(v => v.id === sourceId);
            if (!vehicle) {
                setError('Vehicle not found in intake queue');
                return;
            }
        } else {
            vehicle = intakeRecords.find(v => v.id === sourceId);
            if (!vehicle) {
                setError('Vehicle not found in intake records');
                return;
            }
        }

        // Open the transfer modal to select services
        setTransferVehicle({
            ...vehicle,
            isFromQueue,
            sourceType
        });
        setTransferServices([]);
        setTransferNotes('');
        setTransferPriority('normal');
        setShowTransferModal(true);
    };

    // Complete the transfer after selecting services
    const handleConfirmTransfer = async () => {
        if (!transferVehicle) return;

        const services = window.FirebaseServices;
        if (!services?.garageQueueService) {
            setError('Services not available');
            return;
        }

        // Calculate total cost from selected services
        const totalCost = transferServices.reduce((sum, sId) => {
            const service = garageServices.find(s => s.id === sId);
            return sum + (service?.price || 0);
        }, 0);

        setActionLoading(true);
        try {
            // Add to garage queue with selected services
            const result = await services.garageQueueService.addToQueue({
                plateNumber: transferVehicle.plateNumber,
                vehicleType: transferVehicle.vehicleType,
                customerName: transferVehicle.customerName || '',
                customerPhone: transferVehicle.customerPhone || '',
                services: transferServices,
                notes: transferNotes || `From Vehicle Intake - ${transferVehicle.service?.name || transferVehicle.assignedBay || 'N/A'}`,
                priority: transferPriority,
                sourceId: transferVehicle.id,
                source: transferVehicle.isFromQueue ? 'intake-queue' : 'intake-bay',
                totalCost: totalCost,
                intakeTimeIn: transferVehicle.timeIn || new Date().toISOString()
            });

            if (result.success) {
                if (transferVehicle.isFromQueue && services.intakeQueueService) {
                    // Remove from intake queue
                    await services.intakeQueueService.removeFromQueue(transferVehicle.id);
                    console.log('✅ Vehicle transferred from queue to garage:', transferVehicle.plateNumber);
                } else if (!transferVehicle.isFromQueue && services.intakeRecordsService) {
                    // Update record status to 'garage'
                    await services.intakeRecordsService.updateRecord(transferVehicle.id, { status: 'garage' });
                    console.log('✅ Vehicle sent from bay to garage:', transferVehicle.plateNumber);
                }
            }
            
            setSelectedIntakeVehicle('');
            setShowTransferModal(false);
            setTransferVehicle(null);
            setTransferServices([]);
            setTransferNotes('');
            setTransferPriority('normal');
        } catch (err) {
            console.error('Transfer error:', err);
            setError('Failed to add vehicle to garage queue: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle service selection for transfer
    const toggleTransferService = (serviceId) => {
        setTransferServices(prev => 
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    // Handle adding new vehicle directly to queue
    const handleAddToQueue = async () => {
        if (!formData.plateNumber.trim()) {
            setError('Plate number is required');
            return;
        }

        const services = window.FirebaseServices;
        if (!services?.garageQueueService) return;

        setActionLoading(true);
        try {
            await services.garageQueueService.addToQueue({
                ...formData,
                totalCost: formData.services.reduce((sum, sId) => {
                    const service = garageServices.find(s => s.id === sId);
                    return sum + (service?.price || 0);
                }, 0)
            });
            setFormData({
                plateNumber: '',
                vehicleType: 'Sedan',
                customerName: '',
                customerPhone: '',
                services: [],
                notes: '',
                priority: 'normal'
            });
            setShowAddModal(false);
        } catch (err) {
            setError('Failed to add vehicle to queue');
        } finally {
            setActionLoading(false);
        }
    };

    // Start job from queue
    const handleStartJob = async (queueItem) => {
        const services = window.FirebaseServices;
        if (!services?.garageJobsService || !services?.garageQueueService) {
            setError('Services not available');
            return;
        }

        setActionLoading(true);
        try {
            // Create job in Firestore (service will handle ID properly)
            const result = await services.garageJobsService.createJob({
                plateNumber: queueItem.plateNumber,
                vehicleType: queueItem.vehicleType,
                customerName: queueItem.customerName || '',
                customerPhone: queueItem.customerPhone || '',
                services: queueItem.services || [],
                notes: queueItem.notes || '',
                priority: queueItem.priority || 'normal',
                totalCost: queueItem.totalCost || 0,
                source: queueItem.source || 'direct'
                // Note: Don't pass queueItem.id - service handles it
            });
            
            if (result.success) {
                console.log('✅ Job created:', result.id);
                // Remove from queue after job is created
                await services.garageQueueService.removeFromQueue(queueItem.id);
                // Switch to jobs tab
                setActiveTab('jobs');
            } else {
                setError('Failed to create job: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Start job error:', err);
            setError('Failed to start job: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Complete job
    const handleCompleteJob = async (job) => {
        const services = window.FirebaseServices;
        if (!services?.garageJobsService) {
            setError('Services not available');
            return;
        }

        if (!job.id) {
            setError('Invalid job - no ID found');
            return;
        }

        setActionLoading(true);
        try {
            // Calculate total cost from services
            let totalCost = 0;
            if (job.services && job.services.length > 0) {
                totalCost = job.services.reduce((sum, sId) => {
                    const service = garageServices.find(s => s.id === sId);
                    return sum + (service?.price || 0);
                }, 0);
            } else {
                totalCost = job.totalCost || 0;
            }

            console.log('Completing job:', job.id, 'with total:', totalCost);

            const result = await services.garageJobsService.completeJob(job.id, {
                totalCost: totalCost
            });
            
            console.log('Complete result:', result);

            if (result.success) {
                // Wait for Firebase to sync, then switch tab
                setTimeout(() => {
                    setActiveTab('completed');
                    setActionLoading(false);
                }, 500);
            } else {
                setError('Failed to complete job: ' + (result.error || 'Unknown error'));
                setActionLoading(false);
            }
        } catch (err) {
            console.error('Complete job error:', err);
            setError('Failed to complete job: ' + err.message);
            setActionLoading(false);
        }
    };

    // View item details
    const handleViewItem = (item) => {
        setSelectedItem(item);
        setShowViewModal(true);
    };

    // Show receipt for item
    const handleShowReceipt = (item) => {
        setSelectedItem(item);
        setShowReceiptModal(true);
    };

    // Show job history
    const handleShowHistory = (item) => {
        setSelectedItem(item);
        setShowHistoryModal(true);
    };

    // Show notes modal for technician
    const handleShowNotes = (item) => {
        setSelectedItem(item);
        setTechnicianNotes(item.technicianNotes || '');
        setShowNotesModal(true);
    };

    // Save technician notes
    const handleSaveNotes = async () => {
        const services = window.FirebaseServices;
        if (!services?.garageJobsService || !selectedItem) return;

        setActionLoading(true);
        try {
            await services.garageJobsService.updateJob(selectedItem.id, {
                technicianNotes: technicianNotes,
                lastUpdated: new Date().toISOString()
            });
            setShowNotesModal(false);
            setSelectedItem(null);
            setTechnicianNotes('');
        } catch (err) {
            setError('Failed to save notes: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Service Categories
    const SERVICE_CATEGORIES = [
        { id: 'maintenance', name: 'Maintenance', color: '#3b82f6' },
        { id: 'repair', name: 'Repair', color: '#ef4444' },
        { id: 'inspection', name: 'Inspection', color: '#10b981' },
        { id: 'electrical', name: 'Electrical', color: '#f59e0b' },
        { id: 'bodywork', name: 'Body Work', color: '#8b5cf6' },
        { id: 'other', name: 'Other', color: '#6b7280' }
    ];

    // Open add service form
    const handleAddService = () => {
        setEditingService(null);
        setServiceFormData({
            name: '',
            category: 'maintenance',
            price: '',
            duration: '',
            description: ''
        });
        setShowServiceFormModal(true);
    };

    // Open edit service form
    const handleEditService = (service) => {
        setEditingService(service);
        setServiceFormData({
            name: service.name || '',
            category: service.category || 'maintenance',
            price: service.price?.toString() || '',
            duration: service.duration?.toString() || '',
            description: service.description || ''
        });
        setShowServiceFormModal(true);
    };

    // Save service (add or update)
    const handleSaveService = async () => {
        const services = window.FirebaseServices;
        if (!services?.garageServicesService) return;

        if (!serviceFormData.name.trim()) {
            setError('Service name is required');
            return;
        }
        if (!serviceFormData.price || isNaN(Number(serviceFormData.price))) {
            setError('Valid price is required');
            return;
        }

        setActionLoading(true);
        try {
            const serviceData = {
                name: serviceFormData.name.trim(),
                category: serviceFormData.category,
                price: Number(serviceFormData.price),
                duration: Number(serviceFormData.duration) || 30,
                description: serviceFormData.description.trim(),
                isActive: true
            };

            if (editingService) {
                await services.garageServicesService.updateService(editingService.id, serviceData);
            } else {
                await services.garageServicesService.addService(serviceData);
            }

            setShowServiceFormModal(false);
            setEditingService(null);
            setServiceFormData({ name: '', category: 'maintenance', price: '', duration: '', description: '' });
        } catch (err) {
            setError('Failed to save service: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Delete service
    const handleDeleteService = async (serviceId) => {
        const services = window.FirebaseServices;
        if (!services?.garageServicesService) return;

        if (!confirm('Delete this service? This cannot be undone.')) return;

        setActionLoading(true);
        try {
            await services.garageServicesService.deleteService(serviceId);
        } catch (err) {
            setError('Failed to delete service: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Print receipt
    const handlePrintReceipt = () => {
        if (!selectedItem) return;
        
        const servicesList = selectedItem.services?.map(sId => {
            const service = garageServices.find(s => s.id === sId);
            return service ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${service.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">KSh ${(service.price || 0).toLocaleString()}</td></tr>` : '';
        }).join('') || '<tr><td colspan="2" style="padding:8px;">No services</td></tr>';

        const totalCost = selectedItem.services?.reduce((sum, sId) => {
            const service = garageServices.find(s => s.id === sId);
            return sum + (service?.price || 0);
        }, 0) || selectedItem.totalCost || 0;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Garage Receipt - ${selectedItem.plateNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .logo { font-size: 24px; font-weight: bold; color: #333; }
                    .subtitle { color: #666; font-size: 12px; }
                    .section { margin: 15px 0; }
                    .label { color: #666; font-size: 12px; }
                    .value { font-weight: 500; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { text-align: left; padding: 8px; background: #f5f5f5; border-bottom: 2px solid #333; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; color: #666; font-size: 11px; }
                    .status { display: inline-block; padding: 4px 12px; background: #d1fae5; color: #059669; font-weight: 500; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🔧 ECOSPARK GARAGE</div>
                    <div class="subtitle">Auto Service Receipt</div>
                </div>
                
                <div class="section">
                    <div class="label">Receipt No.</div>
                    <div class="value">#GRG-${Date.now().toString().slice(-8)}</div>
                </div>
                
                <div class="section">
                    <div class="label">Date</div>
                    <div class="value">${new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                
                <div class="section">
                    <div class="label">Vehicle</div>
                    <div class="value">${selectedItem.plateNumber} - ${selectedItem.vehicleType || 'N/A'}</div>
                </div>
                
                <div class="section">
                    <div class="label">Customer</div>
                    <div class="value">${selectedItem.customerName || 'Walk-in Customer'}</div>
                    ${selectedItem.customerPhone ? `<div class="value">${selectedItem.customerPhone}</div>` : ''}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th style="text-align:right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesList}
                    </tbody>
                </table>
                
                <div class="total">
                    Total: KSh ${totalCost.toLocaleString()}
                </div>
                
                <div class="section" style="text-align:center;margin-top:20px;">
                    <span class="status">✅ ${selectedItem.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}</span>
                </div>
                
                ${selectedItem.notes ? `<div class="section"><div class="label">Notes</div><div class="value">${selectedItem.notes}</div></div>` : ''}
                
                <div class="footer">
                    <p>Thank you for choosing Ecospark!</p>
                    <p>Your vehicle is in safe hands</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Remove from queue
    const handleRemoveFromQueue = async (itemId) => {
        const services = window.FirebaseServices;
        if (!services?.garageQueueService) return;

        if (!confirm('Remove this vehicle from the queue?')) return;

        setActionLoading(true);
        try {
            await services.garageQueueService.removeFromQueue(itemId);
        } catch (err) {
            setError('Failed to remove from queue');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete job
    const handleDeleteJob = async (jobId) => {
        const services = window.FirebaseServices;
        if (!services?.garageJobsService) return;

        if (!confirm('Delete this job record?')) return;

        setActionLoading(true);
        try {
            await services.garageJobsService.deleteJob(jobId);
        } catch (err) {
            setError('Failed to delete job');
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle service selection
    const toggleService = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(serviceId)
                ? prev.services.filter(id => id !== serviceId)
                : [...prev.services, serviceId]
        }));
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        const option = PRIORITY_OPTIONS.find(p => p.id === priority);
        return option?.color || '#6b7280';
    };

    // Format currency
    const formatCurrency = (amount) => `KSh ${(amount || 0).toLocaleString()}`;

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    // Loading state
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: theme.textSecondary }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                    <p>Loading Garage...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', backgroundColor: theme.bgSecondary, minHeight: '100%' }}>
            {/* Error Banner */}
            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0', color: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: theme.bg, borderRadius: '0', padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '24px' }}>🚗</span>
                        </div>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>Waiting in Queue</p>
                            <p style={{ color: theme.text, fontSize: '28px', fontWeight: '700', margin: 0 }}>{stats.waiting}</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: theme.bg, borderRadius: '0', padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '24px' }}>🔧</span>
                        </div>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>In Progress</p>
                            <p style={{ color: theme.text, fontSize: '28px', fontWeight: '700', margin: 0 }}>{stats.inProgress}</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: theme.bg, borderRadius: '0', padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '24px' }}>✅</span>
                        </div>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>Completed Today</p>
                            <p style={{ color: theme.text, fontSize: '28px', fontWeight: '700', margin: 0 }}>{stats.completedToday}</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: theme.bg, borderRadius: '0', padding: '20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '24px' }}>💰</span>
                        </div>
                        <div>
                            <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>Today's Revenue</p>
                            <p style={{ color: theme.text, fontSize: '24px', fontWeight: '700', margin: 0 }}>{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add from Intake Section */}
            <div style={{ background: theme.bg, borderRadius: '0', padding: '20px', marginBottom: '24px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', color: theme.text, fontSize: '16px', fontWeight: '600' }}>Add Vehicle to Garage</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>
                            Select from Vehicle Intake 
                            <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: intakeVehicles.length > 0 ? '#fef3c7' : theme.bgTertiary, color: intakeVehicles.length > 0 ? '#d97706' : theme.textMuted, fontSize: '12px', fontWeight: '600' }}>
                                {intakeVehicles.length} waiting
                            </span>
                            <span style={{ marginLeft: '4px', padding: '2px 8px', backgroundColor: intakeRecords.length > 0 ? '#dbeafe' : theme.bgTertiary, color: intakeRecords.length > 0 ? '#2563eb' : theme.textMuted, fontSize: '12px', fontWeight: '600' }}>
                                {intakeRecords.length} in-progress
                            </span>
                        </label>
                        <select
                            value={selectedIntakeVehicle}
                            onChange={(e) => setSelectedIntakeVehicle(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                        >
                            <option value="">{(intakeVehicles.length + intakeRecords.length) === 0 ? '-- No vehicles in intake --' : '-- Select Vehicle --'}</option>
                            {intakeVehicles.length > 0 && (
                                <optgroup label="⏳ Waiting in Queue">
                                    {intakeVehicles.map(v => (
                                        <option key={`queue-${v.id}`} value={`queue:${v.id}`}>
                                            {v.plateNumber} - {v.vehicleType} • {v.customerName || 'Walk-in'} {v.service?.name ? `(${v.service.name})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {intakeRecords.length > 0 && (
                                <optgroup label="🔧 In Progress (Assigned to Bay)">
                                    {intakeRecords.map(v => (
                                        <option key={`record-${v.id}`} value={`record:${v.id}`}>
                                            {v.plateNumber} - {v.vehicleType} • {v.assignedBay || 'Bay'} • {v.customerName || 'Walk-in'}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    <button
                        onClick={handleAddFromIntake}
                        disabled={!selectedIntakeVehicle || actionLoading}
                        style={{ padding: '10px 20px', backgroundColor: selectedIntakeVehicle ? '#3b82f6' : '#94a3b8', color: 'white', border: 'none', borderRadius: '0', cursor: selectedIntakeVehicle ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {Icons.arrowRight} Send to Garage
                    </button>
                    <div style={{ borderLeft: `1px solid ${theme.border}`, height: '40px', margin: '0 8px' }}></div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {Icons.plus} Add New Vehicle
                    </button>
                    <div style={{ borderLeft: `1px solid ${theme.border}`, height: '40px', margin: '0 8px' }}></div>
                    <button
                        onClick={() => setShowServicesModal(true)}
                        style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        ⚙️ Manage Services
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[
                    { id: 'queue', label: 'Queue', count: stats.waiting },
                    { id: 'jobs', label: 'In Progress', count: stats.inProgress },
                    { id: 'completed', label: 'Completed', count: stats.completedToday }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === tab.id ? '#3b82f6' : theme.bg,
                            color: activeTab === tab.id ? 'white' : theme.text,
                            border: `1px solid ${activeTab === tab.id ? '#3b82f6' : theme.border}`,
                            borderRadius: '0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {tab.label}
                        <span style={{
                            backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : theme.bgTertiary,
                            padding: '2px 8px',
                            borderRadius: '0',
                            fontSize: '12px'
                        }}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Search and Filter Bar */}
            <div style={{ background: theme.bg, borderRadius: '0', padding: '16px', marginBottom: '16px', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by plate, name, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 40px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                    />
                </div>
                {activeTab === 'queue' && (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text, minWidth: '150px' }}
                    >
                        <option value="all">All Priorities</option>
                        {PRIORITY_OPTIONS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Data Table - Responsive */}
            <div style={{ background: theme.bg, borderRadius: '0', boxShadow: theme.cardShadow, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme.bgTertiary }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Vehicle</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Customer</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Services</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>
                                    {activeTab === 'queue' ? 'Priority' : 'Status'}
                                </th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Cost</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Time</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: theme.textSecondary, borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>Actions</th>
                            </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: theme.textSecondary }}>
                                    <div>
                                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>
                                            {activeTab === 'queue' ? '📋' : activeTab === 'jobs' ? '🔧' : '✅'}
                                        </span>
                                        <p style={{ margin: 0 }}>
                                            {activeTab === 'queue' ? 'No vehicles in queue' : activeTab === 'jobs' ? 'No jobs in progress' : 'No completed jobs today'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map(item => (
                                <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ fontWeight: '600', color: theme.text }}>{item.plateNumber}</div>
                                        <div style={{ fontSize: '13px', color: theme.textSecondary }}>{item.vehicleType}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ color: theme.text }}>{item.customerName || '-'}</div>
                                        <div style={{ fontSize: '13px', color: theme.textSecondary }}>{item.customerPhone || '-'}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {item.services?.length > 0 ? (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {item.services.slice(0, 2).map((sId, idx) => {
                                                    const service = garageServices.find(s => s.id === sId);
                                                    return service ? (
                                                        <span key={idx} style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: theme.bgTertiary, borderRadius: '0', color: theme.text }}>
                                                            {service.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {item.services.length > 2 && (
                                                    <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: theme.bgTertiary, borderRadius: '0', color: theme.textSecondary }}>
                                                        +{item.services.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: theme.textMuted, fontSize: '13px' }}>No services</span>
                                        )}
                                        {item.notes && (
                                            <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>{item.notes}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {activeTab === 'queue' ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '0',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                backgroundColor: `${getPriorityColor(item.priority)}20`,
                                                color: getPriorityColor(item.priority)
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '0', backgroundColor: getPriorityColor(item.priority) }}></span>
                                                {PRIORITY_OPTIONS.find(p => p.id === item.priority)?.name || 'Normal'}
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '0',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                backgroundColor: item.status === 'completed' ? '#d1fae520' : '#fef3c720',
                                                color: item.status === 'completed' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {item.status === 'completed' ? '✅ Completed' : '🔧 In Progress'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <span style={{ fontWeight: '600', color: '#10b981', fontSize: '14px' }}>
                                            {formatCurrency(item.services?.reduce((sum, sId) => {
                                                const service = garageServices.find(s => s.id === sId);
                                                return sum + (service?.price || 0);
                                            }, 0) || item.totalCost || 0)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: theme.textSecondary, fontSize: '13px' }}>
                                        {formatTimeAgo(item.addedAt || item.startedAt || item.createdAt)}
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {/* View button for all tabs */}
                                            <button
                                                onClick={() => handleViewItem(item)}
                                                style={{ padding: '6px 12px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                            >
                                                View
                                            </button>
                                            
                                            {activeTab === 'queue' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStartJob(item)}
                                                        disabled={actionLoading}
                                                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        Start Job
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFromQueue(item.id)}
                                                        disabled={actionLoading}
                                                        style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'jobs' && (
                                                <>
                                                    <button
                                                        onClick={() => handleShowNotes(item)}
                                                        style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        📝 Notes
                                                    </button>
                                                    <button
                                                        onClick={() => handleCompleteJob(item)}
                                                        disabled={actionLoading}
                                                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        {actionLoading ? 'Completing...' : 'Complete'}
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => handleShowHistory(item)}
                                                        style={{ padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        📜 History
                                                    </button>
                                                    <button
                                                        onClick={() => handleShowReceipt(item)}
                                                        style={{ padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        Receipt
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteJob(item.id)}
                                                        disabled={actionLoading}
                                                        style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 20px', 
                    backgroundColor: theme.bg, 
                    border: `1px solid ${theme.border}`, 
                    borderTop: 'none',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    {/* Items per page selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: theme.textSecondary }}>Show</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '13px', backgroundColor: theme.inputBg, color: theme.text }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span style={{ fontSize: '13px', color: theme.textSecondary }}>entries</span>
                    </div>

                    {/* Info text */}
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    </div>

                    {/* Page navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            style={{ 
                                padding: '6px 10px', 
                                border: `1px solid ${theme.border}`, 
                                borderRadius: '0', 
                                backgroundColor: currentPage === 1 ? theme.bgTertiary : theme.bg, 
                                color: currentPage === 1 ? theme.textMuted : theme.text, 
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            ⟪
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ 
                                padding: '6px 12px', 
                                border: `1px solid ${theme.border}`, 
                                borderRadius: '0', 
                                backgroundColor: currentPage === 1 ? theme.bgTertiary : theme.bg, 
                                color: currentPage === 1 ? theme.textMuted : theme.text, 
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            ‹ Prev
                        </button>
                        
                        {/* Page numbers */}
                        {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            let end = Math.min(totalPages, start + maxVisible - 1);
                            if (end - start + 1 < maxVisible) {
                                start = Math.max(1, end - maxVisible + 1);
                            }
                            
                            if (start > 1) {
                                pages.push(
                                    <button key={1} onClick={() => setCurrentPage(1)} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', backgroundColor: theme.bg, color: theme.text, cursor: 'pointer', fontSize: '13px' }}>1</button>
                                );
                                if (start > 2) pages.push(<span key="dots1" style={{ padding: '0 4px', color: theme.textSecondary }}>...</span>);
                            }
                            
                            for (let i = start; i <= end; i++) {
                                pages.push(
                                    <button 
                                        key={i} 
                                        onClick={() => setCurrentPage(i)}
                                        style={{ 
                                            padding: '6px 12px', 
                                            border: `1px solid ${currentPage === i ? '#3b82f6' : theme.border}`, 
                                            borderRadius: '0', 
                                            backgroundColor: currentPage === i ? '#3b82f6' : theme.bg, 
                                            color: currentPage === i ? 'white' : theme.text, 
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: currentPage === i ? '600' : '400'
                                        }}
                                    >
                                        {i}
                                    </button>
                                );
                            }
                            
                            if (end < totalPages) {
                                if (end < totalPages - 1) pages.push(<span key="dots2" style={{ padding: '0 4px', color: theme.textSecondary }}>...</span>);
                                pages.push(
                                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: '6px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', backgroundColor: theme.bg, color: theme.text, cursor: 'pointer', fontSize: '13px' }}>{totalPages}</button>
                                );
                            }
                            
                            return pages;
                        })()}
                        
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ 
                                padding: '6px 12px', 
                                border: `1px solid ${theme.border}`, 
                                borderRadius: '0', 
                                backgroundColor: currentPage === totalPages ? theme.bgTertiary : theme.bg, 
                                color: currentPage === totalPages ? theme.textMuted : theme.text, 
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            Next ›
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{ 
                                padding: '6px 10px', 
                                border: `1px solid ${theme.border}`, 
                                borderRadius: '0', 
                                backgroundColor: currentPage === totalPages ? theme.bgTertiary : theme.bg, 
                                color: currentPage === totalPages ? theme.textMuted : theme.text, 
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            ⟫
                        </button>
                    </div>
                </div>
            )}

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Add Vehicle to Garage Queue</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Plate Number *</label>
                                    <input
                                        type="text"
                                        value={formData.plateNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., KAB 123A"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Vehicle Type</label>
                                    <select
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    >
                                        {VEHICLE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Customer Name</label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                        placeholder="Customer name"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        placeholder="0700 000 000"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Priority</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {PRIORITY_OPTIONS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setFormData(prev => ({ ...prev, priority: p.id }))}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '0',
                                                border: formData.priority === p.id ? `2px solid ${p.color}` : `1px solid ${theme.border}`,
                                                backgroundColor: formData.priority === p.id ? `${p.color}15` : theme.bg,
                                                color: formData.priority === p.id ? p.color : theme.text,
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Services Required</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                                    {garageServices.map(service => (
                                        <div
                                            key={service.id}
                                            onClick={() => toggleService(service.id)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '0',
                                                border: formData.services.includes(service.id) ? '2px solid #3b82f6' : `1px solid ${theme.border}`,
                                                backgroundColor: formData.services.includes(service.id) ? '#dbeafe' : theme.bg,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: '500', color: theme.text, fontSize: '14px' }}>{service.name}</div>
                                                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>{service.duration} mins</div>
                                                </div>
                                                <div style={{ fontWeight: '600', color: '#3b82f6', fontSize: '14px' }}>{formatCurrency(service.price)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {formData.services.length > 0 && (
                                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: theme.bgTertiary, borderRadius: '0', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: theme.textSecondary }}>{formData.services.length} service(s) selected</span>
                                        <span style={{ fontWeight: '600', color: theme.text }}>
                                            Total: {formatCurrency(formData.services.reduce((sum, sId) => {
                                                const service = garageServices.find(s => s.id === sId);
                                                return sum + (service?.price || 0);
                                            }, 0))}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text, resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddToQueue}
                                    disabled={actionLoading || !formData.plateNumber.trim()}
                                    style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                                >
                                    {actionLoading ? 'Adding...' : 'Add to Queue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>Vehicle Details</h2>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Vehicle Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Plate Number</div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', color: theme.text }}>{selectedItem.plateNumber}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Vehicle Type</div>
                                    <div style={{ fontSize: '16px', color: theme.text }}>{selectedItem.vehicleType || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}>Customer Information</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>Name</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedItem.customerName || 'Walk-in Customer'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>Phone</div>
                                        <div style={{ fontSize: '14px', color: theme.text }}>{selectedItem.customerPhone || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Status</div>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '6px 14px',
                                    backgroundColor: selectedItem.status === 'completed' ? '#d1fae5' : selectedItem.status === 'in-progress' ? '#fef3c7' : '#dbeafe',
                                    color: selectedItem.status === 'completed' ? '#059669' : selectedItem.status === 'in-progress' ? '#d97706' : '#2563eb',
                                    fontWeight: '500',
                                    fontSize: '13px'
                                }}>
                                    {selectedItem.status === 'completed' ? '✅ Completed' : selectedItem.status === 'in-progress' ? '🔧 In Progress' : '⏳ Waiting'}
                                </span>
                            </div>

                            {/* Services */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}>Services</div>
                                {selectedItem.services?.length > 0 ? (
                                    <div style={{ border: `1px solid ${theme.border}` }}>
                                        {selectedItem.services.map((sId, idx) => {
                                            const service = garageServices.find(s => s.id === sId);
                                            return service ? (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: idx < selectedItem.services.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                                                    <div>
                                                        <div style={{ color: theme.text, fontWeight: '500' }}>{service.name}</div>
                                                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>{service.duration} mins</div>
                                                    </div>
                                                    <div style={{ fontWeight: '600', color: '#3b82f6' }}>{formatCurrency(service.price)}</div>
                                                </div>
                                            ) : null;
                                        })}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: theme.bgTertiary, fontWeight: '600' }}>
                                            <span style={{ color: theme.text }}>Total</span>
                                            <span style={{ color: '#10b981', fontSize: '16px' }}>
                                                {formatCurrency(selectedItem.services.reduce((sum, sId) => {
                                                    const service = garageServices.find(s => s.id === sId);
                                                    return sum + (service?.price || 0);
                                                }, 0))}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '16px', backgroundColor: theme.bgTertiary, color: theme.textSecondary, textAlign: 'center' }}>No services selected</div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedItem.notes && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Notes</div>
                                    <div style={{ padding: '12px', backgroundColor: theme.bgTertiary, color: theme.text, fontSize: '14px' }}>{selectedItem.notes}</div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: theme.textSecondary }}>
                                <div>
                                    <span>Added: </span>
                                    <span style={{ color: theme.text }}>{new Date(selectedItem.addedAt || selectedItem.createdAt).toLocaleString()}</span>
                                </div>
                                {selectedItem.startedAt && (
                                    <div>
                                        <span>Started: </span>
                                        <span style={{ color: theme.text }}>{new Date(selectedItem.startedAt).toLocaleString()}</span>
                                    </div>
                                )}
                                {selectedItem.completedAt && (
                                    <div>
                                        <span>Completed: </span>
                                        <span style={{ color: theme.text }}>{new Date(selectedItem.completedAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setShowViewModal(false); handleShowReceipt(selectedItem); }}
                                style={{ padding: '10px 20px', backgroundColor: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                🧾 View Receipt
                            </button>
                            <button
                                onClick={() => setShowViewModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && selectedItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '0', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        {/* Receipt Header */}
                        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '2px solid #333' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>🔧 ECOSPARK GARAGE</div>
                            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Auto Service Receipt</div>
                        </div>

                        <div style={{ padding: '20px 24px' }}>
                            {/* Receipt Number & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #ddd' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Receipt No.</div>
                                    <div style={{ fontWeight: '600', color: '#333' }}>#GRG-{selectedItem.id?.slice(-8) || Date.now().toString().slice(-8)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Date</div>
                                    <div style={{ fontWeight: '500', color: '#333' }}>{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            {/* Vehicle & Customer */}
                            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #ddd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666', fontSize: '13px' }}>Vehicle:</span>
                                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedItem.plateNumber}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666', fontSize: '13px' }}>Type:</span>
                                    <span style={{ color: '#333' }}>{selectedItem.vehicleType || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666', fontSize: '13px' }}>Customer:</span>
                                    <span style={{ color: '#333' }}>{selectedItem.customerName || 'Walk-in'}</span>
                                </div>
                                {selectedItem.customerPhone && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#666', fontSize: '13px' }}>Phone:</span>
                                        <span style={{ color: '#333' }}>{selectedItem.customerPhone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Services List */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '600', color: '#333', marginBottom: '12px', fontSize: '14px' }}>Services</div>
                                {selectedItem.services?.length > 0 ? (
                                    selectedItem.services.map((sId, idx) => {
                                        const service = garageServices.find(s => s.id === sId);
                                        return service ? (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                                <span style={{ color: '#333' }}>{service.name}</span>
                                                <span style={{ fontWeight: '500', color: '#333' }}>KSh {(service.price || 0).toLocaleString()}</span>
                                            </div>
                                        ) : null;
                                    })
                                ) : (
                                    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', color: '#666', textAlign: 'center' }}>No services</div>
                                )}
                            </div>

                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid #333', marginTop: '8px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>TOTAL</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                                    KSh {(selectedItem.services?.reduce((sum, sId) => {
                                        const service = garageServices.find(s => s.id === sId);
                                        return sum + (service?.price || 0);
                                    }, 0) || selectedItem.totalCost || 0).toLocaleString()}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '8px 20px',
                                    backgroundColor: selectedItem.status === 'completed' ? '#d1fae5' : '#fef3c7',
                                    color: selectedItem.status === 'completed' ? '#059669' : '#d97706',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    {selectedItem.status === 'completed' ? '✅ PAID & COMPLETED' : '🔧 IN PROGRESS'}
                                </span>
                            </div>

                            {/* Notes */}
                            {selectedItem.notes && (
                                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', fontSize: '13px', color: '#666' }}>
                                    <strong>Notes:</strong> {selectedItem.notes}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '16px 24px', borderTop: '1px dashed #ddd', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>Thank you for choosing Ecospark!</p>
                            <p style={{ margin: 0, color: '#999', fontSize: '11px' }}>Your vehicle is in safe hands 🚗</p>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid #eee`, display: 'flex', gap: '12px', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                            <button
                                onClick={handlePrintReceipt}
                                style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                🖨️ Print Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                style={{ padding: '10px 24px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>📜 Job History</h2>
                            <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Vehicle Info Header */}
                            <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', marginBottom: '24px' }}>
                                <div style={{ fontWeight: '600', color: theme.text, fontSize: '16px' }}>{selectedItem.plateNumber}</div>
                                <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{selectedItem.vehicleType} • {selectedItem.customerName || 'Walk-in Customer'}</div>
                            </div>

                            {/* Timeline */}
                            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                                {/* Timeline line */}
                                <div style={{ position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: '2px', backgroundColor: theme.border }}></div>

                                {/* Added to Queue */}
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <div style={{ position: 'absolute', left: '-20px', width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '50%', border: `2px solid ${theme.bg}` }}></div>
                                    <div style={{ paddingLeft: '8px' }}>
                                        <div style={{ fontWeight: '600', color: theme.text, fontSize: '14px' }}>Added to Queue</div>
                                        <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                                            {selectedItem.addedAt ? new Date(selectedItem.addedAt).toLocaleString() : 'N/A'}
                                        </div>
                                        <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '2px' }}>
                                            Source: {selectedItem.source === 'intake' ? 'Vehicle Intake' : 'Direct Entry'}
                                        </div>
                                    </div>
                                </div>

                                {/* Job Started */}
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <div style={{ position: 'absolute', left: '-20px', width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '50%', border: `2px solid ${theme.bg}` }}></div>
                                    <div style={{ paddingLeft: '8px' }}>
                                        <div style={{ fontWeight: '600', color: theme.text, fontSize: '14px' }}>Job Started</div>
                                        <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                                            {selectedItem.startedAt ? new Date(selectedItem.startedAt).toLocaleString() : 'N/A'}
                                        </div>
                                        <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '2px' }}>
                                            Services: {selectedItem.services?.length || 0} selected
                                        </div>
                                    </div>
                                </div>

                                {/* Last Updated (if notes were added) */}
                                {selectedItem.lastUpdated && (
                                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                                        <div style={{ position: 'absolute', left: '-20px', width: '16px', height: '16px', backgroundColor: '#8b5cf6', borderRadius: '50%', border: `2px solid ${theme.bg}` }}></div>
                                        <div style={{ paddingLeft: '8px' }}>
                                            <div style={{ fontWeight: '600', color: theme.text, fontSize: '14px' }}>Notes Updated</div>
                                            <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                                                {new Date(selectedItem.lastUpdated).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Completed */}
                                {selectedItem.completedAt && (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-20px', width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '50%', border: `2px solid ${theme.bg}` }}></div>
                                        <div style={{ paddingLeft: '8px' }}>
                                            <div style={{ fontWeight: '600', color: theme.text, fontSize: '14px' }}>✅ Job Completed</div>
                                            <div style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                                                {new Date(selectedItem.completedAt).toLocaleString()}
                                            </div>
                                            <div style={{ color: '#10b981', fontWeight: '600', fontSize: '14px', marginTop: '4px' }}>
                                                Total: {formatCurrency(selectedItem.totalCost || 0)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Technician Notes Section */}
                            {selectedItem.technicianNotes && (
                                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                                    <div style={{ fontWeight: '600', color: '#92400e', fontSize: '13px', marginBottom: '8px' }}>📝 Technician Notes</div>
                                    <div style={{ color: '#78350f', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedItem.technicianNotes}</div>
                                </div>
                            )}

                            {/* Initial Notes */}
                            {selectedItem.notes && (
                                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: theme.bgTertiary }}>
                                    <div style={{ fontWeight: '600', color: theme.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Initial Notes</div>
                                    <div style={{ color: theme.text, fontSize: '14px' }}>{selectedItem.notes}</div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Technician Notes Modal */}
            {showNotesModal && selectedItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>📝 Technician Notes</h2>
                            <button onClick={() => setShowNotesModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Vehicle Info */}
                            <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', marginBottom: '20px' }}>
                                <div style={{ fontWeight: '600', color: theme.text, fontSize: '16px' }}>{selectedItem.plateNumber}</div>
                                <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{selectedItem.vehicleType} • {selectedItem.customerName || 'Walk-in Customer'}</div>
                            </div>

                            {/* Services Being Worked On */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>Services In Progress</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {selectedItem.services?.map((sId, idx) => {
                                        const service = garageServices.find(s => s.id === sId);
                                        return service ? (
                                            <span key={idx} style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#dbeafe', color: '#2563eb' }}>
                                                {service.name}
                                            </span>
                                        ) : null;
                                    })}
                                    {(!selectedItem.services || selectedItem.services.length === 0) && (
                                        <span style={{ color: theme.textMuted, fontSize: '13px' }}>No services selected</span>
                                    )}
                                </div>
                            </div>

                            {/* Notes Input */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
                                    Add your notes below:
                                </label>
                                <textarea
                                    value={technicianNotes}
                                    onChange={(e) => setTechnicianNotes(e.target.value)}
                                    placeholder="Describe what was done, parts replaced, issues found, recommendations for customer, etc."
                                    rows={6}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        border: `1px solid ${theme.border}`, 
                                        borderRadius: '0', 
                                        fontSize: '14px', 
                                        backgroundColor: theme.inputBg, 
                                        color: theme.text, 
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <div style={{ marginTop: '8px', fontSize: '12px', color: theme.textSecondary }}>
                                    💡 Tip: Include details like parts replaced, labor performed, and any recommendations for future service.
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowNotesModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNotes}
                                disabled={actionLoading}
                                style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                {actionLoading ? 'Saving...' : '💾 Save Notes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Services Management Modal */}
            {showServicesModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: theme.bg, zIndex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>⚙️ Manage Garage Services</h2>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={handleAddService}
                                    style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {Icons.plus} Add Service
                                </button>
                                <button onClick={() => setShowServicesModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {garageServices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px', color: theme.textSecondary }}>
                                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔧</span>
                                    <p>No services yet. Click "Add Service" to create one.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                                    {garageServices.map(service => (
                                        <div key={service.id} style={{ 
                                            border: `1px solid ${theme.border}`, 
                                            padding: '16px',
                                            backgroundColor: theme.bgSecondary
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: theme.text, fontSize: '15px' }}>{service.name}</div>
                                                    <span style={{ 
                                                        display: 'inline-block',
                                                        fontSize: '11px', 
                                                        padding: '2px 8px', 
                                                        backgroundColor: (SERVICE_CATEGORIES.find(c => c.id === service.category)?.color || '#6b7280') + '20',
                                                        color: SERVICE_CATEGORIES.find(c => c.id === service.category)?.color || '#6b7280',
                                                        marginTop: '4px'
                                                    }}>
                                                        {SERVICE_CATEGORIES.find(c => c.id === service.category)?.name || 'Other'}
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: '700', color: '#10b981', fontSize: '16px' }}>
                                                    KSh {(service.price || 0).toLocaleString()}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '12px' }}>
                                                <span>⏱️ {service.duration || 30} mins</span>
                                                {service.description && (
                                                    <div style={{ marginTop: '6px' }}>{service.description}</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleEditService(service)}
                                                    style={{ padding: '6px 12px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    disabled={actionLoading}
                                                    style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: theme.textSecondary }}>{garageServices.length} service(s) available</span>
                            <button
                                onClick={() => setShowServicesModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Add/Edit Form Modal */}
            {showServiceFormModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>
                                {editingService ? '✏️ Edit Service' : '➕ Add New Service'}
                            </h2>
                            <button onClick={() => setShowServiceFormModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '6px' }}>Service Name *</label>
                                <input
                                    type="text"
                                    value={serviceFormData.name}
                                    onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Oil Change, Brake Inspection"
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '6px' }}>Price (KSh) *</label>
                                    <input
                                        type="number"
                                        value={serviceFormData.price}
                                        onChange={(e) => setServiceFormData(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '6px' }}>Duration (mins)</label>
                                    <input
                                        type="number"
                                        value={serviceFormData.duration}
                                        onChange={(e) => setServiceFormData(prev => ({ ...prev, duration: e.target.value }))}
                                        placeholder="30"
                                        min="1"
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '6px' }}>Category</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {SERVICE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setServiceFormData(prev => ({ ...prev, category: cat.id }))}
                                            style={{
                                                padding: '8px 14px',
                                                border: serviceFormData.category === cat.id ? `2px solid ${cat.color}` : `1px solid ${theme.border}`,
                                                borderRadius: '0',
                                                backgroundColor: serviceFormData.category === cat.id ? `${cat.color}15` : theme.bg,
                                                color: serviceFormData.category === cat.id ? cat.color : theme.text,
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.text, marginBottom: '6px' }}>Description</label>
                                <textarea
                                    value={serviceFormData.description}
                                    onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of what this service includes..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text, resize: 'vertical' }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowServiceFormModal(false)}
                                style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveService}
                                disabled={actionLoading || !serviceFormData.name.trim() || !serviceFormData.price}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: (!serviceFormData.name.trim() || !serviceFormData.price) ? '#94a3b8' : '#3b82f6', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '0', 
                                    cursor: (!serviceFormData.name.trim() || !serviceFormData.price) ? 'not-allowed' : 'pointer', 
                                    fontSize: '14px', 
                                    fontWeight: '500' 
                                }}
                            >
                                {actionLoading ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer to Garage Modal - Select Services */}
            {showTransferModal && transferVehicle && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bg, borderRadius: '0', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: theme.bg, zIndex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.text }}>🔧 Send to Garage - Select Services</h2>
                            <button onClick={() => { setShowTransferModal(false); setTransferVehicle(null); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textSecondary }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Vehicle Info */}
                            <div style={{ backgroundColor: theme.bgTertiary, padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: '700', color: theme.text, fontSize: '18px' }}>{transferVehicle.plateNumber}</div>
                                        <div style={{ color: theme.textSecondary, fontSize: '14px', marginTop: '4px' }}>{transferVehicle.vehicleType}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: theme.text, fontSize: '14px' }}>{transferVehicle.customerName || 'Walk-in Customer'}</div>
                                        {transferVehicle.customerPhone && (
                                            <div style={{ color: theme.textSecondary, fontSize: '13px' }}>{transferVehicle.customerPhone}</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
                                    <span style={{ 
                                        fontSize: '12px', 
                                        padding: '4px 10px', 
                                        backgroundColor: transferVehicle.isFromQueue ? '#fef3c7' : '#dbeafe',
                                        color: transferVehicle.isFromQueue ? '#d97706' : '#2563eb'
                                    }}>
                                        {transferVehicle.isFromQueue ? '⏳ From Queue' : `🔧 From ${transferVehicle.assignedBay || 'Bay'}`}
                                    </span>
                                </div>
                            </div>

                            {/* Priority Selection */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>Priority</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {PRIORITY_OPTIONS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setTransferPriority(p.id)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '0',
                                                border: transferPriority === p.id ? `2px solid ${p.color}` : `1px solid ${theme.border}`,
                                                backgroundColor: transferPriority === p.id ? `${p.color}15` : theme.bg,
                                                color: transferPriority === p.id ? p.color : theme.text,
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Services Selection */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
                                    Select Garage Services *
                                </label>
                                {garageServices.length === 0 ? (
                                    <div style={{ padding: '20px', backgroundColor: theme.bgTertiary, textAlign: 'center', color: theme.textSecondary }}>
                                        <p style={{ margin: '0 0 12px 0' }}>No services available.</p>
                                        <button
                                            onClick={() => { setShowTransferModal(false); setShowServicesModal(true); }}
                                            style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            ⚙️ Add Services
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                                        {garageServices.map(service => (
                                            <div
                                                key={service.id}
                                                onClick={() => toggleTransferService(service.id)}
                                                style={{
                                                    padding: '14px',
                                                    border: transferServices.includes(service.id) ? '2px solid #3b82f6' : `1px solid ${theme.border}`,
                                                    backgroundColor: transferServices.includes(service.id) ? '#dbeafe' : theme.bg,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500', color: theme.text, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {transferServices.includes(service.id) && <span style={{ color: '#3b82f6' }}>✓</span>}
                                                            {service.name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
                                                            ⏱️ {service.duration || 30} mins
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                                                        KSh {(service.price || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Selected Summary */}
                                {transferServices.length > 0 && (
                                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#166534', fontSize: '14px' }}>
                                            {transferServices.length} service(s) selected
                                        </span>
                                        <span style={{ fontWeight: '700', color: '#166534', fontSize: '16px' }}>
                                            Total: KSh {transferServices.reduce((sum, sId) => {
                                                const service = garageServices.find(s => s.id === sId);
                                                return sum + (service?.price || 0);
                                            }, 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>Notes (Optional)</label>
                                <textarea
                                    value={transferNotes}
                                    onChange={(e) => setTransferNotes(e.target.value)}
                                    placeholder="Any special instructions or notes for the garage..."
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '0', fontSize: '14px', backgroundColor: theme.inputBg, color: theme.text, resize: 'vertical' }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: theme.textSecondary }}>
                                {transferServices.length === 0 ? '⚠️ Please select at least one service' : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => { setShowTransferModal(false); setTransferVehicle(null); }}
                                    style={{ padding: '10px 20px', backgroundColor: theme.bgTertiary, color: theme.text, border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmTransfer}
                                    disabled={actionLoading || transferServices.length === 0}
                                    style={{ 
                                        padding: '10px 24px', 
                                        backgroundColor: transferServices.length === 0 ? '#94a3b8' : '#10b981', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '0', 
                                        cursor: transferServices.length === 0 ? 'not-allowed' : 'pointer', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {actionLoading ? 'Sending...' : '🔧 Send to Garage Queue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== WASH BAYS MODULE ====================
function WashBays() {
    const [bays, setBays] = useState([]);
    const [history, setHistory] = useState([]);
    const [intakeQueue, setIntakeQueue] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [maintenanceNote, setMaintenanceNote] = useState('');
    const [selectedBay, setSelectedBay] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('bays');
    const [todayStats, setTodayStats] = useState({ completed: 0, avgTime: 0 });
    const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
    const [assignMode, setAssignMode] = useState('select'); // 'select' or 'new'
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    // Form states
    const [bayForm, setBayForm] = useState({ name: '', type: 'standard' });
    const [assignForm, setAssignForm] = useState({ 
        plateNumber: '', 
        customerName: '', 
        vehicleType: 'sedan', 
        service: 'Basic Wash',
        assignedTo: ''
    });

    // Auto-hide success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Theme detection
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const theme = {
        bg: isDark ? '#1e293b' : 'white',
        bgSecondary: isDark ? '#0f172a' : '#f8fafc',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        border: isDark ? '#334155' : '#e2e8f0',
        cardShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
        inputBg: isDark ? '#1e293b' : 'white',
    };

    const BAY_TYPES = [
        { id: 'standard', name: 'Standard', color: '#3b82f6' },
        { id: 'premium', name: 'Premium', color: '#8b5cf6' },
        { id: 'express', name: 'Express', color: '#10b981' }
    ];

    const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus'];
    const SERVICES = ['Basic Wash', 'Full Service', 'Premium Detail', 'Express Wash', 'Interior Only', 'Exterior Only'];

    const STATUS_CONFIG = {
        available: { label: 'Available', color: '#10b981', bg: '#d1fae5' },
        occupied: { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe' },
        maintenance: { label: 'Maintenance', color: '#f59e0b', bg: '#fef3c7' }
    };

    // Subscribe to real-time data
    useEffect(() => {
        const services = window.FirebaseServices;
        if (!services?.washBayService) {
            setLoading(false);
            return;
        }

        // Initialize bays if needed
        services.washBayService.initializeBays();

        // Subscribe to bays
        const unsubBays = services.washBayService.subscribeToBays((data) => {
            setBays(data);
            setLoading(false);
        });

        // Subscribe to history
        const unsubHistory = services.washBayService.subscribeToHistory((data) => {
            setHistory(data);
        });

        // Subscribe to intake queue (vehicles waiting)
        let unsubQueue = null;
        if (services.intakeQueueService) {
            unsubQueue = services.intakeQueueService.subscribeToQueue((data) => {
                // Filter only waiting vehicles
                setIntakeQueue(data.filter(v => v.status === 'waiting'));
            });
        }

        // Subscribe to staff list
        let unsubStaff = null;
        if (services.staffService) {
            // Initialize staff if needed
            services.staffService.initializeStaff();
            unsubStaff = services.staffService.subscribeToStaff((data) => {
                setStaffList(data);
            });
        }

        // Get today's stats
        services.washBayService.getTodayStats().then(result => {
            if (result.success) setTodayStats(result.data);
        });

        return () => {
            if (unsubBays) unsubBays();
            if (unsubHistory) unsubHistory();
            if (unsubQueue) unsubQueue();
            if (unsubStaff) unsubStaff();
        };
    }, []);

    // Calculate elapsed time for occupied bays
    const getElapsedTime = (startTime) => {
        if (!startTime) return '0:00';
        const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-update elapsed times
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAddBay = async (e) => {
        e.preventDefault();
        if (!bayForm.name.trim()) {
            setError('Bay name is required');
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            const services = window.FirebaseServices;
            const result = await services.washBayService.addBay(bayForm);
            if (result.success) {
                setShowAddModal(false);
                setBayForm({ name: '', type: 'standard' });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to add bay');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignVehicle = async (e) => {
        e.preventDefault();
        
        // Validate staff selection
        if (!assignForm.assignedTo) {
            setError('Please select a staff member');
            return;
        }
        
        setActionLoading(true);
        setError(null);

        try {
            const services = window.FirebaseServices;
            let vehicleData;
            let queueVehicle = null;

            if (assignMode === 'select' && selectedVehicleId) {
                // Use selected vehicle from queue
                queueVehicle = intakeQueue.find(v => v.id === selectedVehicleId);
                if (!queueVehicle) {
                    setError('Selected vehicle not found');
                    setActionLoading(false);
                    return;
                }
                vehicleData = {
                    plateNumber: queueVehicle.plateNumber,
                    customerName: queueVehicle.customerName || queueVehicle.ownerName || '',
                    vehicleType: queueVehicle.vehicleType || 'sedan',
                    service: assignForm.service,
                    assignedBy: assignForm.assignedTo,
                    queueId: queueVehicle.id
                };
            } else {
                // Create new vehicle entry
                if (!assignForm.plateNumber.trim()) {
                    setError('Plate number is required');
                    setActionLoading(false);
                    return;
                }
                vehicleData = {
                    plateNumber: assignForm.plateNumber.toUpperCase(),
                    customerName: assignForm.customerName,
                    vehicleType: assignForm.vehicleType,
                    service: assignForm.service,
                    assignedBy: assignForm.assignedTo
                };
            }

            // 1. Create record in Vehicle Intake Records (Firestore) for tracking
            let recordId = null;
            if (services.intakeRecordsService) {
                const recordData = {
                    plateNumber: vehicleData.plateNumber,
                    customerName: vehicleData.customerName,
                    vehicleType: vehicleData.vehicleType,
                    service: { name: vehicleData.service },
                    status: 'in-progress',
                    assignedBay: selectedBay.name,
                    assignedBayId: selectedBay.id,
                    assignedTime: new Date().toISOString(),
                    timeIn: new Date().toISOString(),
                    source: assignMode === 'select' ? 'queue' : 'wash-bay-direct',
                    queueId: vehicleData.queueId || null
                };
                const recordResult = await services.intakeRecordsService.addRecord(recordData);
                if (recordResult.success) {
                    recordId = recordResult.id;
                    vehicleData.recordId = recordId;
                }
            }

            // 2. If from queue, update queue status to in-progress (or remove it)
            if (assignMode === 'select' && queueVehicle && services.intakeQueueService) {
                // Remove from queue since it's now in records
                await services.intakeQueueService.removeFromQueue(queueVehicle.id);
            } else if (assignMode === 'new' && services.intakeQueueService) {
                // For new vehicles, add to queue with in-progress status for tracking
                const queueResult = await services.intakeQueueService.addToQueue({
                    plateNumber: vehicleData.plateNumber,
                    customerName: vehicleData.customerName,
                    vehicleType: vehicleData.vehicleType,
                    selectedServices: [vehicleData.service],
                    status: 'in-progress',
                    assignedBay: selectedBay.name,
                    assignedBayId: selectedBay.id,
                    washStartTime: new Date().toISOString(),
                    recordId: recordId,
                    source: 'wash-bay-direct'
                });
                if (queueResult.success) {
                    vehicleData.queueId = queueResult.id;
                }
            }

            // 3. Assign to wash bay (Realtime DB)
            const result = await services.washBayService.assignVehicle(selectedBay.id, vehicleData);
            if (result.success) {
                setShowAssignModal(false);
                setSelectedBay(null);
                setSelectedVehicleId('');
                setAssignMode('select');
                setAssignForm({ plateNumber: '', customerName: '', vehicleType: 'sedan', service: 'Basic Wash', assignedTo: '' });
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error assigning vehicle:', err);
            setError('Failed to assign vehicle');
        } finally {
            setActionLoading(false);
        }
    };

    const openAssignModal = (bay) => {
        setSelectedBay(bay);
        setShowAssignModal(true);
        setError(null);
        setAssignMode(intakeQueue.length > 0 ? 'select' : 'new');
        setSelectedVehicleId('');
        setAssignForm({ plateNumber: '', customerName: '', vehicleType: 'sedan', service: 'Basic Wash', assignedTo: '' });
    };

    const handleCompleteWash = async (bay) => {
        setSelectedBay(bay);
        setConfirmAction({
            type: 'complete',
            title: 'Complete Wash',
            message: `Complete wash for ${bay.currentVehicle?.plateNumber}?`,
            confirmText: '✓ Complete',
            confirmColor: '#10b981'
        });
        setShowConfirmModal(true);
    };

    const executeCompleteWash = async () => {
        const bay = selectedBay;
        setShowConfirmModal(false);
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            const currentVehicle = bay.currentVehicle;
            
            // 1. Update the intake record in Firestore (main tracking)
            if (currentVehicle?.recordId && services.intakeRecordsService) {
                await services.intakeRecordsService.updateRecord(currentVehicle.recordId, {
                    status: 'completed',
                    timeOut: new Date().toISOString()
                });
            }
            
            // 2. If vehicle has queue entry, remove or update it
            if (currentVehicle?.queueId && services.intakeQueueService) {
                await services.intakeQueueService.removeFromQueue(currentVehicle.queueId);
            }
            
            // 3. Complete the wash bay
            await services.washBayService.completeWash(bay.id);
            
            // Refresh stats
            const result = await services.washBayService.getTodayStats();
            if (result.success) setTodayStats(result.data);
            
            setSuccessMessage(`${currentVehicle?.plateNumber} wash completed!`);
        } catch (err) {
            console.error('Complete wash error:', err);
            setError('Failed to complete wash');
        } finally {
            setActionLoading(false);
            setSelectedBay(null);
        }
    };

    const handleSetMaintenance = (bay) => {
        setSelectedBay(bay);
        setMaintenanceNote('');
        setShowMaintenanceModal(true);
    };

    const executeSetMaintenance = async () => {
        setShowMaintenanceModal(false);
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.washBayService.setMaintenance(selectedBay.id, { note: maintenanceNote });
            setSuccessMessage(`${selectedBay.name} set to maintenance`);
        } catch (err) {
            setError('Failed to set maintenance');
        } finally {
            setActionLoading(false);
            setSelectedBay(null);
            setMaintenanceNote('');
        }
    };

    const handleClearMaintenance = (bay) => {
        setSelectedBay(bay);
        setConfirmAction({
            type: 'clearMaintenance',
            title: 'Clear Maintenance',
            message: `Mark ${bay.name} as available again?`,
            confirmText: '✓ Clear Maintenance',
            confirmColor: '#10b981'
        });
        setShowConfirmModal(true);
    };

    const executeClearMaintenance = async () => {
        setShowConfirmModal(false);
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.washBayService.updateBayStatus(selectedBay.id, 'available');
            setSuccessMessage(`${selectedBay.name} is now available`);
        } catch (err) {
            setError('Failed to clear maintenance');
        } finally {
            setActionLoading(false);
            setSelectedBay(null);
        }
    };

    const handleDeleteBay = (bay) => {
        setSelectedBay(bay);
        setConfirmAction({
            type: 'delete',
            title: 'Delete Bay',
            message: `Delete ${bay.name}? This cannot be undone.`,
            confirmText: '🗑️ Delete',
            confirmColor: '#ef4444'
        });
        setShowConfirmModal(true);
    };

    const executeDeleteBay = async () => {
        setShowConfirmModal(false);
        setActionLoading(true);
        try {
            const services = window.FirebaseServices;
            await services.washBayService.deleteBay(selectedBay.id);
            setSuccessMessage(`${selectedBay.name} deleted`);
        } catch (err) {
            setError('Failed to delete bay');
        } finally {
            setActionLoading(false);
            setSelectedBay(null);
        }
    };

    // Handle confirm action
    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        
        switch (confirmAction.type) {
            case 'complete':
                await executeCompleteWash();
                break;
            case 'clearMaintenance':
                await executeClearMaintenance();
                break;
            case 'delete':
                await executeDeleteBay();
                break;
            default:
                setShowConfirmModal(false);
        }
        setConfirmAction(null);
    };

    // Stats cards
    const statsCards = [
        { 
            label: 'In Queue', 
            value: intakeQueue.length, 
            icon: '⏳',
            color: '#6366f1'
        },
        { 
            label: 'Available Bays', 
            value: bays.filter(b => b.status === 'available').length, 
            icon: '✅',
            color: '#10b981'
        },
        { 
            label: 'In Progress', 
            value: bays.filter(b => b.status === 'occupied').length, 
            icon: '🚗',
            color: '#f59e0b'
        },
        { 
            label: 'Completed Today', 
            value: todayStats.completed, 
            icon: '🏁',
            color: '#8b5cf6'
        }
    ];
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                    <p style={{ color: theme.textSecondary }}>Loading wash bays...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Error Banner */}
            {error && (
                <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    borderRadius: '2px', 
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                marginBottom: '24px' 
            }}>
                {statsCards.map((stat, i) => (
                    <div key={i} style={{
                        backgroundColor: theme.bg,
                        borderRadius: '2px',
                        padding: '20px',
                        boxShadow: theme.cardShadow,
                        border: `1px solid ${theme.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '2px', 
                                backgroundColor: `${stat.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text }}>{stat.value}</div>
                                <div style={{ fontSize: '13px', color: theme.textSecondary }}>{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs & Add Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px' 
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['bays', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '2px',
                                border: 'none',
                                backgroundColor: activeTab === tab ? '#3b82f6' : theme.bgSecondary,
                                color: activeTab === tab ? 'white' : theme.text,
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab === 'bays' ? '🚿 Wash Bays' : '📋 History'}
                        </button>
                    ))}
                </div>
                {activeTab === 'bays' && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '2px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>+</span> Add Bay
                    </button>
                )}
            </div>

            {/* Bays Grid */}
            {activeTab === 'bays' && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '20px' 
                }}>
                    {bays.length === 0 ? (
                        <div style={{ 
                            gridColumn: '1/-1', 
                            textAlign: 'center', 
                            padding: '60px 20px',
                            backgroundColor: theme.bg,
                            borderRadius: '2px',
                            border: `1px solid ${theme.border}`
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚿</div>
                            <h3 style={{ color: theme.text, marginBottom: '8px' }}>No Wash Bays</h3>
                            <p style={{ color: theme.textSecondary }}>Click "Add Bay" to create your first wash bay</p>
                        </div>
                    ) : (
                        bays.map(bay => {
                            const statusConfig = STATUS_CONFIG[bay.status] || STATUS_CONFIG.available;
                            const bayType = BAY_TYPES.find(t => t.id === bay.type) || BAY_TYPES[0];

                            return (
                                <div key={bay.id} style={{
                                    backgroundColor: theme.bg,
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                    boxShadow: theme.cardShadow,
                                    border: `1px solid ${theme.border}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}>
                                    {/* Bay Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        backgroundColor: `${bayType.color}10`,
                                        borderBottom: `1px solid ${theme.border}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h3 style={{ 
                                                margin: 0, 
                                                fontSize: '18px', 
                                                fontWeight: '700',
                                                color: theme.text 
                                            }}>
                                                {bay.name}
                                            </h3>
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '4px',
                                                padding: '2px 8px',
                                                borderRadius: '2px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                backgroundColor: bayType.color,
                                                color: 'white'
                                            }}>
                                                {bayType.name}
                                            </span>
                                        </div>
                                        <div style={{
                                            padding: '6px 12px',
                                            borderRadius: '2px',
                                            backgroundColor: statusConfig.bg,
                                            color: statusConfig.color,
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {statusConfig.label}
                                        </div>
                                    </div>

                                    {/* Bay Content */}
                                    <div style={{ padding: '20px' }}>
                                        {bay.status === 'occupied' && bay.currentVehicle ? (
                                            <div>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '12px',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '2px',
                                                        backgroundColor: '#3b82f6',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '24px'
                                                    }}>
                                                        🚗
                                                    </div>
                                                    <div>
                                                        <div style={{ 
                                                            fontWeight: '700', 
                                                            fontSize: '16px',
                                                            color: theme.text 
                                                        }}>
                                                            {bay.currentVehicle.plateNumber}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '13px', 
                                                            color: theme.textSecondary 
                                                        }}>
                                                            {bay.currentVehicle.customerName || 'Walk-in Customer'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '1fr 1fr', 
                                                    gap: '12px',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{
                                                        padding: '10px',
                                                        backgroundColor: theme.bgSecondary,
                                                        borderRadius: '2px'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '2px' }}>Service</div>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{bay.currentVehicle.service}</div>
                                                    </div>
                                                    <div style={{
                                                        padding: '10px',
                                                        backgroundColor: '#dbeafe',
                                                        borderRadius: '2px'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '2px' }}>Time Elapsed</div>
                                                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>{getElapsedTime(bay.startTime)}</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleCompleteWash(bay)}
                                                    disabled={actionLoading}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '2px',
                                                        border: 'none',
                                                        backgroundColor: '#10b981',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    ✓ Complete Wash
                                                </button>
                                            </div>
                                        ) : bay.status === 'maintenance' ? (
                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
                                                <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>
                                                    {bay.maintenanceNote || 'Under maintenance'}
                                                </p>
                                                <button
                                                    onClick={() => handleClearMaintenance(bay)}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '10px 24px',
                                                        borderRadius: '2px',
                                                        border: 'none',
                                                        backgroundColor: '#10b981',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Mark Available
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
                                                <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>Ready for next vehicle</p>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => openAssignModal(bay)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px',
                                                            borderRadius: '2px',
                                                            border: 'none',
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Assign Vehicle
                                                    </button>
                                                    <button
                                                        onClick={() => handleSetMaintenance(bay)}
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: '2px',
                                                            border: `1px solid ${theme.border}`,
                                                            backgroundColor: 'transparent',
                                                            color: theme.textSecondary,
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Set Maintenance"
                                                    >
                                                        🔧
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bay Footer - Delete */}
                                    {bay.status === 'available' && (
                                        <div style={{
                                            padding: '12px 20px',
                                            borderTop: `1px solid ${theme.border}`,
                                            display: 'flex',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <button
                                                onClick={() => handleDeleteBay(bay)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '2px',
                                                    border: 'none',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#dc2626',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete Bay
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div style={{
                    backgroundColor: theme.bg,
                    borderRadius: '2px',
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme.bgSecondary }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Bay</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Vehicle</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Service</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Washed By</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Started</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Completed</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Group history by combining started and completed records
                                const completedRecords = history.filter(r => r.action === 'completed');
                                
                                if (completedRecords.length === 0) {
                                    // Show in-progress items (started but not completed)
                                    const startedRecords = history.filter(r => r.action === 'started');
                                    if (startedRecords.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>
                                                    No wash history yet
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return startedRecords.map(record => (
                                        <tr key={record.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text, fontWeight: '500' }}>
                                                {record.bayName || record.bayId}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: '600', color: theme.text }}>{record.vehicle?.plateNumber}</div>
                                                <div style={{ fontSize: '12px', color: theme.textSecondary }}>{record.vehicle?.customerName || 'Walk-in'}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text }}>
                                                {record.vehicle?.service || '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text }}>
                                                {record.vehicle?.assignedBy || '-'}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: theme.text }}>
                                                {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: theme.textSecondary }}>
                                                -
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: theme.textSecondary }}>
                                                -
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    backgroundColor: '#fef3c7',
                                                    color: '#d97706'
                                                }}>
                                                    In Progress
                                                </span>
                                            </td>
                                        </tr>
                                    ));
                                }
                                
                                // Show completed records (they have all the info including start time)
                                return completedRecords.map(record => (
                                    <tr key={record.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text, fontWeight: '500' }}>
                                            {record.bayName || record.bayId}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: '600', color: theme.text }}>{record.vehicle?.plateNumber}</div>
                                            <div style={{ fontSize: '12px', color: theme.textSecondary }}>{record.vehicle?.customerName || 'Walk-in'}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text }}>
                                            {record.vehicle?.service || '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: theme.text }}>
                                            {record.vehicle?.assignedBy || record.completedBy || '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: theme.text }}>
                                            {record.startTime ? new Date(record.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: theme.text }}>
                                            {record.endTime ? new Date(record.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#3b82f6' }}>
                                            {record.duration ? `${record.duration} min` : '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                backgroundColor: '#d1fae5',
                                                color: '#059669'
                                            }}>
                                                ✓ Done
                                            </span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Bay Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowAddModal(false)}>
                    <div style={{
                        backgroundColor: theme.bg,
                        borderRadius: '2px',
                        width: '100%',
                        maxWidth: '400px',
                        margin: '20px'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}` }}>
                            <h2 style={{ margin: 0, color: theme.text }}>Add New Bay</h2>
                        </div>
                        <form onSubmit={handleAddBay} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Bay Name *</label>
                                <input
                                    type="text"
                                    value={bayForm.name}
                                    onChange={e => setBayForm({ ...bayForm, name: e.target.value })}
                                    placeholder="e.g., Bay 5"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: theme.inputBg,
                                        color: theme.text,
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Bay Type</label>
                                <select
                                    value={bayForm.type}
                                    onChange={e => setBayForm({ ...bayForm, type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: theme.inputBg,
                                        color: theme.text,
                                        fontSize: '14px'
                                    }}
                                >
                                    {BAY_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: 'transparent',
                                        color: theme.text,
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {actionLoading ? 'Adding...' : 'Add Bay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Vehicle Modal */}
            {showAssignModal && selectedBay && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowAssignModal(false)}>
                    <div style={{
                        backgroundColor: theme.bg,
                        borderRadius: '2px',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '20px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}` }}>
                            <h2 style={{ margin: 0, color: theme.text }}>Assign Vehicle to {selectedBay.name}</h2>
                        </div>
                        
                        <form onSubmit={handleAssignVehicle} style={{ padding: '20px' }}>
                            {/* Mode Toggle */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginBottom: '20px',
                                padding: '4px',
                                backgroundColor: theme.bgSecondary,
                                borderRadius: '2px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => { setAssignMode('select'); setSelectedVehicleId(''); }}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: assignMode === 'select' ? '#3b82f6' : 'transparent',
                                        color: assignMode === 'select' ? 'white' : theme.textSecondary,
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    📋 From Queue ({intakeQueue.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignMode('new')}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: assignMode === 'new' ? '#3b82f6' : 'transparent',
                                        color: assignMode === 'new' ? 'white' : theme.textSecondary,
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    ➕ New Vehicle
                                </button>
                            </div>

                            {/* Select from Queue */}
                            {assignMode === 'select' && (
                                <div style={{ marginBottom: '16px' }}>
                                    {intakeQueue.length === 0 ? (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '30px 20px',
                                            backgroundColor: theme.bgSecondary,
                                            borderRadius: '2px',
                                            border: `1px dashed ${theme.border}`
                                        }}>
                                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚗</div>
                                            <p style={{ color: theme.textSecondary, marginBottom: '12px' }}>No vehicles waiting in queue</p>
                                            <button
                                                type="button"
                                                onClick={() => setAssignMode('new')}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '2px',
                                                    border: 'none',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                Add New Vehicle
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: theme.text }}>
                                                Select Vehicle from Queue
                                            </label>
                                            <div style={{ 
                                                maxHeight: '200px', 
                                                overflowY: 'auto',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '2px'
                                            }>
                                                {intakeQueue.map(vehicle => (
                                                    <div
                                                        key={vehicle.id}
                                                        onClick={() => setSelectedVehicleId(vehicle.id)}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderBottom: `1px solid ${theme.border}`,
                                                            cursor: 'pointer',
                                                            backgroundColor: selectedVehicleId === vehicle.id ? '#dbeafe' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            border: `2px solid ${selectedVehicleId === vehicle.id ? '#3b82f6' : theme.border}`,
                                                            backgroundColor: selectedVehicleId === vehicle.id ? '#3b82f6' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {selectedVehicleId === vehicle.id && (
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                                    <polyline points="20 6 9 17 4 12"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '600', color: theme.text, fontSize: '15px' }}>
                                                                {vehicle.plateNumber}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                                                                {vehicle.customerName || vehicle.ownerName || 'Walk-in'} • {vehicle.vehicleType || 'Vehicle'}
                                                            </div>
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '11px', 
                                                            color: theme.textSecondary,
                                                            textAlign: 'right'
                                                        }}>
                                                            {new Date(vehicle.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* New Vehicle Form */}
                            {assignMode === 'new' && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Plate Number *</label>
                                        <input
                                            type="text"
                                            value={assignForm.plateNumber}
                                            onChange={e => setAssignForm({ ...assignForm, plateNumber: e.target.value.toUpperCase() })}
                                            placeholder="e.g., KBZ 123A"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '2px',
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: theme.inputBg,
                                                color: theme.text,
                                                fontSize: '14px',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Customer Name</label>
                                        <input
                                            type="text"
                                            value={assignForm.customerName}
                                            onChange={e => setAssignForm({ ...assignForm, customerName: e.target.value })}
                                            placeholder="Optional"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '2px',
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: theme.inputBg,
                                                color: theme.text,
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Vehicle Type</label>
                                        <select
                                            value={assignForm.vehicleType}
                                            onChange={e => setAssignForm({ ...assignForm, vehicleType: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '2px',
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: theme.inputBg,
                                                color: theme.text,
                                                fontSize: '14px'
                                            }}
                                        >
                                            {VEHICLE_TYPES.map(t => (
                                                <option key={t} value={t.toLowerCase()}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Service Selection (always shown) */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>Service</label>
                                <select
                                    value={assignForm.service}
                                    onChange={e => setAssignForm({ ...assignForm, service: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: theme.inputBg,
                                        color: theme.text,
                                        fontSize: '14px'
                                    }}
                                >
                                    {SERVICES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Staff Assignment (always shown) */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: theme.text }}>
                                    Assign to Staff <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                {staffList.length === 0 ? (
                                    <div style={{ 
                                        padding: '12px', 
                                        backgroundColor: theme.bgSecondary, 
                                        borderRadius: '2px',
                                        border: `1px dashed ${theme.border}`,
                                        textAlign: 'center',
                                        color: theme.textSecondary,
                                        fontSize: '13px'
                                    }}>
                                        No staff members available. Add staff in Staff Management.
                                    </div>
                                ) : (
                                    <select
                                        value={assignForm.assignedTo}
                                        onChange={e => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '2px',
                                            border: `1px solid ${assignForm.assignedTo ? theme.border : '#f59e0b'}`,
                                            backgroundColor: theme.inputBg,
                                            color: theme.text,
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="">-- Select Staff Member --</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.name}>
                                                {staff.name} ({staff.role})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: 'transparent',
                                        color: theme.text,
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || (assignMode === 'select' && !selectedVehicleId)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: (assignMode === 'select' && !selectedVehicleId) ? '#94a3b8' : '#3b82f6',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: (actionLoading || (assignMode === 'select' && !selectedVehicleId)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {actionLoading ? 'Assigning...' : '🚿 Start Wash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100
                }} onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}>
                    <div style={{
                        backgroundColor: theme.bg,
                        borderRadius: '2px',
                        width: '100%',
                        maxWidth: '400px',
                        margin: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ 
                                fontSize: '48px', 
                                marginBottom: '16px'
                            }}>
                                {confirmAction.type === 'delete' ? '🗑️' : confirmAction.type === 'complete' ? '✅' : '🔧'}
                            </div>
                            <h3 style={{ 
                                margin: '0 0 8px 0', 
                                color: theme.text,
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                {confirmAction.title}
                            </h3>
                            <p style={{ 
                                margin: '0 0 24px 0', 
                                color: theme.textSecondary,
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                {confirmAction.message}
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: 'transparent',
                                        color: theme.text,
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={actionLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: confirmAction.confirmColor || '#3b82f6',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {actionLoading ? 'Please wait...' : confirmAction.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && selectedBay && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100
                }} onClick={() => setShowMaintenanceModal(false)}>
                    <div style={{
                        backgroundColor: theme.bg,
                        borderRadius: '2px',
                        width: '100%',
                        maxWidth: '450px',
                        margin: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ 
                            padding: '20px', 
                            borderBottom: `1px solid ${theme.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '2px',
                                backgroundColor: '#fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                🔧
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: theme.text, fontSize: '16px' }}>
                                    Set Maintenance Mode
                                </h3>
                                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '13px' }}>
                                    {selectedBay.name}
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontWeight: '500', 
                                color: theme.text,
                                fontSize: '14px'
                            }}>
                                Maintenance Note (optional)
                            </label>
                            <textarea
                                value={maintenanceNote}
                                onChange={e => setMaintenanceNote(e.target.value)}
                                placeholder="e.g., Water pump repair, Floor cleaning..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '2px',
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: theme.inputBg,
                                    color: theme.text,
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowMaintenanceModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '2px',
                                        border: `1px solid ${theme.border}`,
                                        backgroundColor: 'transparent',
                                        color: theme.text,
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeSetMaintenance}
                                    disabled={actionLoading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '2px',
                                        border: 'none',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {actionLoading ? 'Saving...' : '🔧 Set Maintenance'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {successMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '2px',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1200,
                    animation: 'slideInRight 0.3s ease'
                }}>
                    <span style={{ fontSize: '20px' }}>✓</span>
                    <span style={{ fontWeight: '500' }}>{successMessage}</span>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '2px',
                    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 1200,
                    cursor: 'pointer'
                }} onClick={() => setError(null)}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <span style={{ fontWeight: '500' }}>{error}</span>
                    <span style={{ marginLeft: '8px', opacity: 0.7 }}>✕</span>
                </div>
            )}
        </div>
    );
}

// Dashboard Component - Real-time Firebase Integration
function Dashboard({ onModuleClick }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [queue, setQueue] = useState([]);
    const [bays, setBays] = useState([]);
    const [garageJobs, setGarageJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to Firebase data for real-time stats
    useEffect(() => {
        let cancelled = false;
        
        const waitForServices = async () => {
            let services = window.FirebaseServices;
            let attempts = 0;
            while (!services && attempts < 20 && !cancelled) {
                await new Promise(resolve => setTimeout(resolve, 50));
                services = window.FirebaseServices;
                attempts++;
            }
            if (services && !cancelled) initializeSubscriptions();
        };
        
        if (window.FirebaseServices) {
            initializeSubscriptions();
        } else {
            waitForServices();
        }
        
        function initializeSubscriptions() {
            const svc = window.FirebaseServices;
            let unsubRecords, unsubQueue, unsubBays, unsubGarage;
            
            // Subscribe to vehicle records (Firestore)
            if (svc.intakeRecordsService) {
                unsubRecords = svc.intakeRecordsService.subscribeToRecords(
                    (records) => {
                        console.log('Dashboard: Records updated', records.length);
                        setVehicles(records);
                        setLoading(false);
                    },
                    (err) => console.error('Dashboard records error:', err)
                );
            }
            
            // Subscribe to queue (Realtime DB)
            if (svc.intakeQueueService) {
                unsubQueue = svc.intakeQueueService.subscribeToQueue(
                    (queueData) => {
                        console.log('Dashboard: Queue updated', queueData.length);
                        setQueue(queueData);
                    },
                    (err) => console.error('Dashboard queue error:', err)
                );
            }
            
            // Subscribe to bays (Realtime DB)
            if (svc.intakeBaysService) {
                unsubBays = svc.intakeBaysService.subscribeToBays(
                    (baysData) => {
                        console.log('Dashboard: Bays updated', baysData.length);
                        setBays(baysData);
                    },
                    (err) => console.error('Dashboard bays error:', err)
                );
            }
            
            // Subscribe to garage jobs (Firestore)
            if (svc.garageJobsService) {
                unsubGarage = svc.garageJobsService.subscribeToJobs(
                    (jobs) => {
                        console.log('Dashboard: Garage jobs updated', jobs.length);
                        setGarageJobs(jobs);
                    },
                    (err) => console.error('Dashboard garage error:', err)
                );
            }
            
            return () => {
                if (unsubRecords) unsubRecords();
                if (unsubQueue) unsubQueue();
                if (unsubBays) unsubBays();
                if (unsubGarage) unsubGarage();
            };
        }
    }, []);

    // Calculate real-time stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayVehicles = vehicles.filter(v => {
        const vDate = new Date(v.timeIn || v.createdAt);
        vDate.setHours(0, 0, 0, 0);
        return vDate.getTime() === today.getTime();
    });
    
    const completedToday = todayVehicles.filter(v => v.status === 'completed');
    
    // Calculate wash revenue (from completed wash vehicles)
    const washRevenueToday = completedToday.reduce((sum, v) => sum + (v.service?.price || 0), 0);
    
    // Calculate garage revenue (from completed garage jobs today)
    const garageJobsToday = garageJobs.filter(job => {
        if (job.status !== 'completed' || !job.completedAt) return false;
        const jobDate = new Date(job.completedAt);
        jobDate.setHours(0, 0, 0, 0);
        return jobDate.getTime() === today.getTime();
    });
    const garageRevenueToday = garageJobsToday.reduce((sum, job) => sum + (job.totalCost || 0), 0);
    
    // Total revenue
    const totalRevenueToday = washRevenueToday + garageRevenueToday;
    
    const inProgressCount = vehicles.filter(v => v.status === 'in-progress').length;
    const occupiedBays = bays.filter(b => b.status === 'occupied').length;
    const availableBays = bays.filter(b => b.status === 'available').length;
    const uniqueCustomers = [...new Set(vehicles.filter(v => v.customerPhone).map(v => v.customerPhone))].length;
    
    const handleRefresh = () => {
        console.log('Refreshing dashboard...');
        setLoading(true);
        setTimeout(() => setLoading(false), 100);
    };
    
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        console.log('Searching for:', e.target.value);
    };
    
    const stats = [
        {
            title: 'Vehicles Today',
            value: todayVehicles.length.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3l-3.5-7a2 2 0 0 0-1.9-1.3H7.4a2 2 0 0 0-1.9 1.3L2 16h3m0 0a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/></svg>,
            color: '#3b82f6'
        },
        {
            title: 'Active Bays',
            value: `${occupiedBays}/${bays.length || 4}`,
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
            color: '#10b981'
        },
        {
            title: 'In Progress',
            value: inProgressCount.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
            color: '#f59e0b'
        },
        {
            title: 'Revenue Today',
            value: `KSh ${totalRevenueToday.toLocaleString()}`,
            subValues: [
                { label: 'Wash', value: washRevenueToday, color: '#3b82f6' },
                { label: 'Garage', value: garageRevenueToday, color: '#8b5cf6' }
            ],
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
            color: '#10b981'
        },
        {
            title: 'In Queue',
            value: queue.length.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            color: '#8b5cf6'
        },
        {
            title: 'Completed Today',
            value: completedToday.length.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
            color: '#10b981'
        },
        {
            title: 'Available Bays',
            value: availableBays.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
            color: '#06b6d4'
        },
        {
            title: 'Total Records',
            value: vehicles.length.toString(),
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
            color: '#6366f1'
        }
    ];

    const quickAccess = [
        { 
            id: 'vehicle-intake', 
            label: 'Vehicle Intake', 
            icon: Icons.car,
            color: '#3b82f6'
        },
        { 
            id: 'wash-bays', 
            label: 'Wash Bays', 
            icon: Icons.droplet,
            color: '#10b981'
        },
        { 
            id: 'billing', 
            label: 'Billing', 
            icon: Icons.creditCard,
            color: '#8b5cf6'
        },
        { 
            id: 'customers', 
            label: 'Customers', 
            icon: Icons.users,
            color: '#f59e0b'
        },
        { 
            id: 'reports', 
            label: 'Reports', 
            icon: Icons.trendingUp,
            color: '#ec4899'
        },
        { 
            id: 'settings', 
            label: 'Settings', 
            icon: Icons.settings,
            color: '#6366f1'
        }
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-toolbar">
                <div className="search-bar-container">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder="Search vehicles, customers, invoices..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    )}
                </div>
                <button className="refresh-button" onClick={handleRefresh} title="Refresh Dashboard">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6"/>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                        <path d="M3 22v-6h6"/>
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                    </svg>
                    <span>Refresh</span>
                </button>
            </div>
            
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon">
                                {stat.icon}
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="stat-card-value">{stat.value}</div>
                            <div className="stat-card-title">{stat.title}</div>
                            {/* Revenue breakdown for Revenue Today card */}
                            {stat.subValues && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    marginTop: '8px', 
                                    paddingTop: '8px', 
                                    borderTop: '1px solid #e2e8f0',
                                    fontSize: '12px'
                                }}>
                                    {stat.subValues.map((sub, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ 
                                                width: '8px', 
                                                height: '8px', 
                                                borderRadius: '50%', 
                                                backgroundColor: sub.color,
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{ color: '#64748b' }}>{sub.label}:</span>
                                            <span style={{ fontWeight: '600', color: sub.color }}>
                                                KSh {sub.value.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="quick-access-section">
                <h2 className="section-title">Quick Access</h2>
                <div className="quick-access-grid">
                    {quickAccess.map((item) => (
                        <button 
                            key={item.id} 
                            className="quick-access-btn"
                            style={{ backgroundColor: item.color }}
                            onClick={() => onModuleClick(item.id)}
                        >
                            <span className="quick-access-icon">{item.icon}</span>
                            <span className="quick-access-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="recent-activities-section">
                <div className="section-header">
                    <h2 className="section-title">Recent Activities</h2>
                    <div className="section-actions">
                        <button className="icon-button" title="Refresh">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6"/>
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                                <path d="M3 22v-6h6"/>
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                            </svg>
                        </button>
                        <button className="view-all-btn" onClick={() => onModuleClick('activities')}>View All</button>
                    </div>
                </div>
                <div className="table-container">
                    <table className="activities-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Activity</th>
                                <th>User</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="4" className="empty-table">No recent activities</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Content Area Component
function ContentArea({ activeModule, onModuleClick }) {
    const currentModule = menuItems.find(item => item.id === activeModule);
    
    return (
        <div className="content-area">
            <div className="module-header">
                <div className="module-header-icon">{currentModule?.icon}</div>
                <h1 className="module-header-title">{currentModule?.label}</h1>
            </div>
            <div className="content-placeholder">
                {activeModule === 'dashboard' && <Dashboard onModuleClick={onModuleClick} />}
                {activeModule === 'vehicle-intake' && <VehicleIntake />}
                {activeModule === 'service-packages' && <ServicePackages />}
                {activeModule === 'equipment' && <EquipmentManagement />}
                {activeModule === 'customers' && <CustomerManagement />}
                {activeModule === 'garage-management' && <GarageManagement />}
                {activeModule === 'wash-bays' && <WashBays />}
            </div>
        </div>
    );
}

// Main App Component with Authentication
function App() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeModule, setActiveModule] = useState('dashboard');
    
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Check authentication state on mount
    useEffect(() => {
        let unsubscribe = null;
        
        const checkAuth = async () => {
            // Wait for Firebase services
            let services = window.FirebaseServices;
            let attempts = 0;
            while (!services && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 100));
                services = window.FirebaseServices;
                attempts++;
            }
            
            if (!services || !services.authService) {
                console.error('Auth service not available');
                setAuthLoading(false);
                return;
            }

            // Listen to auth state changes
            unsubscribe = services.authService.onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in
                    const profileResult = await services.userService.getUserProfile(user.uid);
                    if (profileResult.success && profileResult.data) {
                        if (profileResult.data.isActive) {
                            setCurrentUser(user);
                            setUserProfile(profileResult.data);
                            setIsAuthenticated(true);
                        } else {
                            // User is deactivated
                            await services.authService.signOut();
                            setIsAuthenticated(false);
                        }
                    } else {
                        // No profile, sign out
                        setIsAuthenticated(false);
                    }
                } else {
                    // User is signed out
                    setCurrentUser(null);
                    setUserProfile(null);
                    setIsAuthenticated(false);
                }
                setAuthLoading(false);
            });
        };

        checkAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleLoginSuccess = (user, profile) => {
        setCurrentUser(user);
        setUserProfile(profile);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        const services = window.FirebaseServices;
        if (services && services.authService) {
            await services.authService.signOut();
        }
        setCurrentUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setActiveModule('dashboard');
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
    };

    const handleModuleClick = (moduleId) => {
        // Check if user has access to this module
        if (userProfile && window.FirebaseServices?.userService) {
            const hasAccess = window.FirebaseServices.userService.hasModuleAccess(userProfile.role, moduleId);
            if (!hasAccess) {
                alert('You do not have access to this module. Please contact your administrator.');
                return;
            }
        }
        setActiveModule(moduleId);
    };

    // Permission helper functions
    const hasModuleAccess = (moduleId) => {
        if (!userProfile) return false;
        if (!window.FirebaseServices?.userService) return true;
        return window.FirebaseServices.userService.hasModuleAccess(userProfile.role, moduleId);
    };

    const hasPermission = (permissionKey) => {
        if (!userProfile) return false;
        if (!window.FirebaseServices?.userService) return true;
        return window.FirebaseServices.userService.hasPermission(userProfile.role, permissionKey);
    };

    // Show loading screen while checking auth
    if (authLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3b82f6 100%)',
                color: 'white'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 16H9m10 0h3l-3.5-7a2 2 0 0 0-1.9-1.3H7.4a2 2 0 0 0-1.9 1.3L2 16h3m0 0a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/>
                    </svg>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>EcoSpark</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Loading...
                </div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // Permission context value
    const permissionValue = {
        hasModuleAccess,
        hasPermission,
        userRole: userProfile?.role || 'receptionist',
        userProfile,
        currentUser
    };

    return (
        <PermissionContext.Provider value={permissionValue}>
            <AuthContext.Provider value={{ currentUser, userProfile, logout: handleLogout }}>
                <div className="app-container">
                    <Sidebar 
                        isCollapsed={isSidebarCollapsed} 
                        activeModule={activeModule}
                        onModuleClick={handleModuleClick}
                        userProfile={userProfile}
                        hasModuleAccess={hasModuleAccess}
                    />
                    <div className="main-content">
                        <TopBar 
                            onToggleSidebar={toggleSidebar} 
                            onToggleTheme={toggleTheme}
                            isDarkMode={isDarkMode}
                            userProfile={userProfile}
                            onLogout={handleLogout}
                        />
                        <ContentArea activeModule={activeModule} onModuleClick={handleModuleClick} />
                    </div>
                </div>
            </AuthContext.Provider>
        </PermissionContext.Provider>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
