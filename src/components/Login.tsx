import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { LoginBanner } from '../types';

const TRANSITION_TYPES = ['opacity-transition', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'blur-in', 'slide-up', 'rotate-fade'];

export function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  
  const [banners, setBanners] = useState<LoginBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [transitionEffect, setTransitionEffect] = useState(TRANSITION_TYPES[0]);

  useEffect(() => {
    const q = query(collection(db, 'loginBanners'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: LoginBanner[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as LoginBanner);
      });
      data.sort((a, b) => b.createdAt - a.createdAt);
      setBanners(data);
    }, (error) => console.error("Error fetching banners:", error));
    return unsub;
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setTransitionEffect(TRANSITION_TYPES[Math.floor(Math.random() * TRANSITION_TYPES.length)]);
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  const formatEmail = (userStr: string) => {
    if (userStr.includes('@')) return userStr;
    return `${userStr.toLowerCase().replace(/[^a-z0-9]/g, '')}@system.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    
    const authEmail = formatEmail(username);

    try {
      await signInWithEmailAndPassword(auth, authEmail, password);
    } catch (err: any) {
      // Auto-create admin account for demo convenience
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && (authEmail === 'admin@system.local')) {
        try {
          await createUserWithEmailAndPassword(auth, authEmail, password);
          return;
        } catch (createErr: any) {
          setError('Invalid username or password.');
          setLoading(false);
          return;
        }
      }

      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid username or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your username to request a password reset.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await addDoc(collection(db, 'passwordRequests'), {
        email: username,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      setMessage('Password reset request sent to Admin.');
      // Auto switch back to login after 3 seconds
      setTimeout(() => {
        setMode('login');
        setMessage('');
        setError('');
      }, 3000);
    } catch (err: any) {
      setError('Failed to send request. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans" style={{ zoom: 0.85 }}>
      {/* Top Banner line */}
      <div className="h-2 bg-[#0088cc] w-full border-b border-[#006699]"></div>
      
      {/* Header */}
      <div className="bg-white py-2 px-8 flex justify-between items-center shadow-sm relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="max-h-12 w-auto object-contain" />
            <div className="flex flex-col items-center mt-1">
              <span className="text-[12px] font-extrabold text-[#d2232a] tracking-tight uppercase leading-none">PICK ELECTRIC</span>
              <span className="text-[9px] font-bold text-[#0088cc] tracking-tight uppercase leading-none mt-0.5">AUTO PRIVATE LIMITED</span>
            </div>
          </div>
          {/* Optional middle logos if any, skipping for now */}
        </div>
        <div className="text-[22px] font-bold tracking-tight text-black sm:hidden md:block">
          DEALER MANAGEMENT SYSTEM
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center items-center p-4 py-12 bg-[#F4F4F4]">
        <div className="w-full max-w-[1100px] flex rounded-sm border border-gray-300 bg-white overflow-hidden" style={{ minHeight: '520px' }}>
          
          {/* Left Column - Login Form */}
          <div className="w-[350px] shrink-0 flex flex-col border-r border-gray-300 relative">
            <div className="pt-8 pb-4 bg-white flex flex-col justify-center items-center h-[140px]">
              <img src="/logo.png" alt="Logo" className="max-w-[120px] max-h-[80px] object-contain" />
              <div className="flex flex-col items-center mt-2">
                <span className="text-[15px] font-extrabold text-[#d2232a] tracking-tight uppercase leading-none">PICK ELECTRIC</span>
                <span className="text-[11px] font-bold text-[#0088cc] tracking-tight uppercase leading-none mt-1">AUTO PRIVATE LIMITED</span>
              </div>
            </div>
            
            <div className="bg-[#2488c6] text-white text-center py-2.5 font-bold text-[14px] tracking-wide shadow-sm">
              {mode === 'login' ? 'USER LOGIN' : 'RESET PASSWORD'}
            </div>

            <div className="flex-1 px-8 py-6 flex flex-col bg-white">
              {error && (
                <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 border border-red-200">
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 text-xs text-green-600 bg-green-50 p-2 border border-green-200">
                  {message}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-[13px] text-gray-600 uppercase mb-1 font-normal tracking-wide">USER NAME</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#E8F0FE] border border-gray-300 px-3 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:border-[#0088cc] shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-gray-600 uppercase mb-1 font-normal tracking-wide">PASSWORD</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#E8F0FE] border border-gray-300 px-3 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:border-[#0088cc] shadow-inner"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f4f4f4] hover:bg-gray-200 border border-gray-300 text-gray-800 text-[13px] py-1.5 font-medium transition-colors shadow-sm mt-2"
                  >
                    {loading ? 'Validating...' : 'Submit'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-[13px] text-gray-600 uppercase mb-1 font-normal tracking-wide">USER NAME</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#E8F0FE] border border-gray-300 px-3 py-1.5 text-[13px] text-gray-800 focus:outline-none focus:border-[#0088cc] shadow-inner"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#f4f4f4] hover:bg-gray-200 border border-gray-300 text-gray-800 text-[13px] py-1.5 font-medium transition-colors shadow-sm"
                    >
                      {loading ? 'Sending Request...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                      className="text-[12px] text-gray-600 hover:text-gray-900 transition-colors py-1"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-[#f4f4f4] border-t border-gray-300 py-3 text-center">
              <button 
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                className="text-[11px] text-gray-700 hover:text-[#0088cc] transition-colors font-medium"
              >
                Forgot Your Password ?
              </button>
            </div>
          </div>

          {/* Right Column - Banner */}
          <div className="flex-[2] bg-white relative border-l border-gray-300 overflow-hidden">
            {banners.length > 0 ? (
              <img 
                key={banners[currentBannerIndex].id + transitionEffect}
                src={banners[currentBannerIndex].imageUrl} 
                alt="Dealership Banner" 
                className={`w-full h-full object-contain absolute inset-0 ${transitionEffect}`} 
              />
            ) : (
              <img src="/banner.jpg" alt="Dealership Banner" className="w-full h-full object-contain absolute inset-0 opacity-transition" />
            )}
            
            {/* Banner Dots indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2.5 rounded-full transition-all shadow-sm ${idx === currentBannerIndex ? 'w-8 bg-[#0088cc]' : 'w-2.5 bg-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
