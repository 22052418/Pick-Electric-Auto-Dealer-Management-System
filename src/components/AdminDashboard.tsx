import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { UserRole, PasswordRequest, SupportTeamMember } from '../types';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, updateEmail } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Shield, Key, Users, Settings, Mail, Lock, Plus, Save, Trash2, CheckCircle, Edit2, X, Phone, Image, UserPlus, Headset, Unlock, Images as ImagesIcon, Cog, ShieldCheck, UserCog, LifeBuoy, ImagePlay, LayoutTemplate } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { BannersManager } from './BannersManager';

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export function AdminDashboard({ currentUserRole, activeTab = 'all', onNavigate }: { currentUserRole: UserRole | null, activeTab?: string, onNavigate?: (tab: string) => void }) {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  
  // Create staff state
  const [newStaffName, setNewStaffName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newDealershipName, setNewDealershipName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  
  // Update Profile state
  const [updatePass, setUpdatePass] = useState('');
  const [updateUsername, setUpdateUsername] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Support Request Action State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvePassword, setResolvePassword] = useState('');
  const [resolvingLoading, setResolvingLoading] = useState(false);
  
  // Confirm Delete States
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  // Dealer Settings State
  const [helpDeskPhone, setHelpDeskPhone] = useState('9234741782');
  const [helpDeskEmail, setHelpDeskEmail] = useState('pickelectricauto@gmail.com');
  const [supportTeam, setSupportTeam] = useState<SupportTeamMember[]>([
    { id: '1', name: 'Sujit Kumar', phone: '9624051414 ext:393', email: 'smkumar@atulauto.co.in' },
    { id: '2', name: 'Mr. Nishant Y. Trivedi', phone: '9879083666 ext:399', email: 'nytrivedi@atulauto.co.in' }
  ]);
  const [isEditingHelpDesk, setIsEditingHelpDesk] = useState(false);

  const formatEmail = (userStr: string) => {
    if (userStr.includes('@')) return userStr;
    return `${userStr.toLowerCase().replace(/[^a-z0-9]/g, '')}@system.local`;
  };

  const permissionOptions = [
    { id: 'dashboard', label: 'View Dashboard & Analytics' },
    { id: 'specifications', label: 'View Specifications' },
    { id: 'add_vehicle', label: 'Add New Vehicle' },
    { id: 'reduce_vehicle', label: 'Reduce Vehicle Stock' },
    { id: 'update_vehicle', label: 'Update Vehicle Details' },
    { id: 'add_parts', label: 'Add New Parts' },
    { id: 'reduce_parts', label: 'Reduce Parts Stock' },
    { id: 'sales', label: 'Sell Vehicles (Sales)' },
    { id: 'stock', label: 'Manage B2B Stock' },
    { id: 'invoice', label: 'Manage Invoices' },
    { id: 'reports', label: 'View Reports' }
  ];

  useEffect(() => {
    if (currentUserRole?.role !== 'admin') return;

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const data: UserRole[] = [];
      snapshot.forEach(d => data.push({ ...d.data(), id: d.id } as UserRole));
      setUsers(data);
    }, (error) => console.error("Error fetching users:", error));

    const unsubRequests = onSnapshot(query(collection(db, 'passwordRequests')), (snapshot) => {
      const data: PasswordRequest[] = [];
      snapshot.forEach(d => data.push({ ...d.data(), id: d.id } as PasswordRequest));
      setRequests(data);
    }, (error) => console.error("Error fetching password requests:", error));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'dealer'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.helpDeskPhone) setHelpDeskPhone(data.helpDeskPhone);
        if (data.helpDeskEmail) setHelpDeskEmail(data.helpDeskEmail);
        if (data.supportTeam) setSupportTeam(data.supportTeam); else setSupportTeam([{ id: '1', name: 'Sujit Kumar', phone: '9624051414 ext:393', email: 'smkumar@atulauto.co.in' }, { id: '2', name: 'Mr. Nishant Y. Trivedi', phone: '9879083666 ext:399', email: 'nytrivedi@atulauto.co.in' }]);
      }
    }, (error) => console.error("Error fetching dealer settings:", error));

    return () => {
      unsubUsers();
      unsubRequests();
      unsubSettings();
    };
  }, [currentUserRole]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newStaffName) return;
    setLoading(true);
    setError('');
    setMessage('');
    
    const formattedEmail = formatEmail(newUsername);

    try {
      // Create user using secondary app so primary user doesn't log out
      const credential = await createUserWithEmailAndPassword(secondaryAuth, formattedEmail, newPassword);
      const uid = credential.user.uid;
      await secondaryAuth.signOut();

      // Add to users collection using the original clean username
      const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
      await setDoc(doc(db, 'users', uid), {
        email: cleanUsername,
        name: newStaffName,
        branchName: newBranchName,
        branchCode: cleanUsername,
        dealershipName: newDealershipName,
        role: 'staff',
        permissions: newPermissions
      });
      
      setNewStaffName('');
      setNewBranchName('');
      setNewDealershipName('');
      setNewUsername('');
      setNewPassword('');
      setNewPermissions([]);
      setMessage('Staff account created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create staff account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (userId: string, perms: string[]) => {
    try {
      await updateDoc(doc(db, 'users', userId), { permissions: perms });
    } catch (err: any) {
      alert('Error updating permissions: ' + err.message);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setDeletingStaffId(null);
    } catch (err: any) {
      console.error('Error deleting: ' + err.message);
    }
  };

  const submitResolveRequest = async (req: PasswordRequest) => {
    if (!resolvePassword) return;
    setResolvingLoading(true);
    try {
      // Due to Firebase client SDK security constraints, changing another user's password directly 
      // without their current credentials requires Firebase Admin SDK (a backend).
      // Since this applet is serverless, we simulate the action for the UX. 
      await updateDoc(doc(db, 'passwordRequests', req.id), { status: 'resolved' });
      setResolvingId(null);
      setResolvePassword('');
      // In a real app, this is where Admin SDK changes auth password. 
      // We set a temporal message instead of alert because alert triggers iframe blocks.
      setMessage(`Success! Simulated resetting password for ${req.email}. Request marked as resolved.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError('Failed to resolve request: ' + err.message);
    } finally {
      setResolvingLoading(false);
    }
  };

  const handleDeleteRequest = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'passwordRequests', reqId));
      setDeletingRequestId(null);
    } catch (err: any) {
      console.error('Failed to delete request: ' + err.message);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !updateUsername) return;
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const newEmailVal = formatEmail(updateUsername);
      await updateEmail(auth.currentUser, newEmailVal);
      
      // Update in users collection
      const cleanUsername = updateUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: cleanUsername
      });

      setMessage('Username updated successfully!');
      setUpdateUsername('');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Firebase requires email verification to change username. Please disable "Require verification" in Firebase Console > Authentication > Settings > User Actions.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your username.');
      } else {
        setError('Failed to update username: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !updatePass) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updatePassword(auth.currentUser, updatePass);
      setMessage('Password updated successfully!');
      setUpdatePass('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your password.');
      } else {
        setError('Failed to update password: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHelpDesk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'dealer'), {
        helpDeskPhone,
        helpDeskEmail,
        supportTeam
      }, { merge: true });
      setMessage('Help desk configuration updated successfully!');
      setIsEditingHelpDesk(false);
    } catch (err: any) {
      setError('Failed to update configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentUserRole?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-slate-300" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Access Denied</h2>
            <p className="text-slate-500 mt-1">You require administrative privileges to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 pb-32">
      {activeTab !== 'all' && (
        <div className="flex items-center">
          <button 
            onClick={() => onNavigate?.('all')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-200 rounded-lg shadow-sm transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </button>
        </div>
      )}
      {activeTab === 'all' && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Admin Dashboard</h2>
            <p className="text-sm text-slate-500 max-w-2xl">Manage your account settings, define staff roles, and configure system preferences to optimize your workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => onNavigate?.('authentication')} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-sky-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-[#0088cc] mb-4 group-hover:scale-110 transition-transform">
                <img src="https://cdn-icons-png.flaticon.com/512/2092/2092063.png" className="w-6 h-6 object-contain" alt="Account Settings" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Account Settings</h3>
              <p className="text-sm text-slate-500">Manage Display name, Username and Password</p>
            </div>

            <div 
              onClick={() => onNavigate?.('staff')} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-sky-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-[#0088cc] mb-4 group-hover:scale-110 transition-transform">
                <img src="https://cdn-icons-png.flaticon.com/512/10433/10433048.png" className="w-6 h-6 object-contain" alt="User Management" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">User Management</h3>
              <p className="text-sm text-slate-500">Add, Edit, and Manage System Users.</p>
            </div>

            <div 
              onClick={() => onNavigate?.('helpdesk')} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-sky-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-[#0088cc] mb-4 group-hover:scale-110 transition-transform">
                <img src="https://cdn-icons-png.flaticon.com/512/1067/1067566.png" className="w-6 h-6 object-contain" alt="Help Desk" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Help Desk Settings</h3>
              <p className="text-sm text-slate-500">Manage help Desk Contacts and Support Information</p>
            </div>

            <div 
              onClick={() => onNavigate?.('support')} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-sky-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <img src="https://cdn-icons-png.flaticon.com/512/3014/3014227.png" className="w-6 h-6 object-contain" alt="Security" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Password Reset Requests</h3>
              <p className="text-sm text-slate-500">Review and Approve Password Reset Requests</p>
            </div>

            <div 
              onClick={() => onNavigate?.('banners')} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-sky-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-[#0088cc] mb-4 group-hover:scale-110 transition-transform">
                <img src="https://cdn-icons-png.flaticon.com/512/5889/5889158.png" className="w-6 h-6 object-contain" alt="Banners" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Banner Management</h3>
              <p className="text-sm text-slate-500">Upload and Manage Login and Dashboard Page Banners</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 p-4 bg-sky-50 text-sky-800 rounded-2xl border border-sky-100 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-1">
          <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" className="w-5 h-5 text-sky-500 object-contain" alt="Check" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-1">
           <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">!</div>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-8 w-full max-w-full">
        
        {/* Left Column: Account Settings */}
        {(activeTab === 'display-name' || activeTab === 'username-password' || activeTab === 'authentication' || activeTab === 'helpdesk') && (
        <div className="w-full space-y-8">
          {(activeTab === 'display-name' || activeTab === 'username-password' || activeTab === 'authentication') && (
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-[0_4px_24px_-8px_rgba(14,165,233,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/15 border border-white/50">
            <div className="px-6 py-5 border-b border-sky-500/10 flex items-center gap-4 bg-white/40">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
                <img src="https://cdn-icons-png.flaticon.com/512/2092/2092063.png" className="w-5 h-5 object-contain" alt="Account Settings" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight">Account Settings</h3>
                <p className="text-xs text-sky-600/80 mt-0.5 font-medium">Manage Display name, Username and Password</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-sky-500/10">
              {/* Name Pane */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 tracking-tight">Display Name</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Current: <strong className="text-slate-700 font-semibold">{currentUserRole?.name || 'Not Set'}</strong>
                  </p>
                </div>
                
                <div className="w-full">
                  {!isEditingName ? (
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500/30 hover:border-sky-500/40 transition-all shadow-sm"
                    >
                      Change Name
                    </button>
                  ) : (
                    <form onSubmit={(e) => { 
                      e.preventDefault();
                      setLoading(true);
                      updateDoc(doc(db, 'users', currentUserRole!.id), { name: updateName })
                        .then(() => {
                          setMessage('Name updated successfully!');
                          setIsEditingName(false);
                          setUpdateName('');
                        })
                        .catch((err) => setError('Failed to update name: ' + err.message))
                        .finally(() => setLoading(false));
                     }} className="space-y-3">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={updateName}
                        onChange={e => setUpdateName(e.target.value)}
                        className="w-full bg-white/50 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        placeholder="New display name"
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => { setIsEditingName(false); setUpdateName(''); }}
                          className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !updateName.trim()}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_16px_rgba(14,165,233,0.4)]"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Username Pane */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 tracking-tight">Username</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Current: <strong className="text-slate-700 font-semibold">{auth.currentUser?.email?.split('@')[0] || 'admin'}</strong>
                  </p>
                </div>
                
                <div className="w-full">
                  {!isEditingUsername ? (
                    <button 
                      onClick={() => setIsEditingUsername(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500/30 hover:border-sky-500/40 transition-all shadow-sm"
                    >
                      Change Username
                    </button>
                  ) : (
                    <form onSubmit={(e) => { handleChangeEmail(e); setIsEditingUsername(false); }} className="space-y-3">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={updateUsername}
                        onChange={e => setUpdateUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        className="w-full bg-white/50 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        placeholder="New username"
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => { setIsEditingUsername(false); setUpdateUsername(''); }}
                          className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !updateUsername.trim()}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_16px_rgba(14,165,233,0.4)]"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Password Pane */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 tracking-tight">Password</p>
                  <p className="text-sm text-slate-500 mt-1">Keep your account secure.</p>
                </div>
                
                <div className="w-full">
                  {!isEditingPassword ? (
                    <button 
                      onClick={() => setIsEditingPassword(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500/30 hover:border-sky-500/40 transition-all shadow-sm"
                    >
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={(e) => { handleChangePassword(e); setIsEditingPassword(false); }} className="space-y-3">
                      <input
                        type="password"
                        required
                        autoFocus
                        value={updatePass}
                        onChange={e => setUpdatePass(e.target.value)}
                        className="w-full bg-white/50 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        placeholder="New password"
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => { setIsEditingPassword(false); setUpdatePass(''); }}
                          className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={loading || !updatePass.trim()}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_16px_rgba(14,165,233,0.4)]"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {(activeTab === 'helpdesk') && (
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-[0_4px_24px_-8px_rgba(14,165,233,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/15 border border-white/50 mt-8">
            <div className="px-6 py-5 border-b border-sky-500/10 flex items-center gap-4 bg-white/40">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
                <img src="https://cdn-icons-png.flaticon.com/512/1067/1067566.png" className="w-5 h-5 object-contain" alt="Help Desk" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Help Desk Settings</h3>
                <p className="text-xs text-sky-600/80 mt-0.5 font-medium">Manage help Desk Contacts and Support Information</p>
              </div>
            </div>
            
            <div className="p-6">
              {!isEditingHelpDesk ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 tracking-tight">Phone Number</p>
                    <p className="text-sm text-slate-600 mt-1">{helpDeskPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 tracking-tight">Email Address</p>
                    <p className="text-sm text-slate-600 mt-1">{helpDeskEmail}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingHelpDesk(true)}
                    className="w-full sm:w-auto px-4 py-2 mt-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-500/30 hover:border-sky-500/40 transition-all shadow-sm"
                  >
                    Edit Help Desk Info
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateHelpDesk} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={helpDeskPhone}
                      onChange={e => setHelpDeskPhone(e.target.value)}
                      className="w-full bg-white/50 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={helpDeskEmail}
                      onChange={e => setHelpDeskEmail(e.target.value)}
                      className="w-full bg-white/50 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingHelpDesk(false)}
                      className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !helpDeskPhone.trim() || !helpDeskEmail.trim()}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_16px_rgba(14,165,233,0.4)]"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Support Team Section */}
            <div className="px-6 py-5 border-t border-sky-500/10 bg-white/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.3)] border border-indigo-400/20">
                  <img src="https://cdn-icons-png.flaticon.com/512/10433/10433048.png" className="w-4 h-4 object-contain" alt="User Management" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight">Support Team</h3>
              </div>
            </div>
            <div className="p-6 border-t border-sky-500/10 space-y-4">
              {supportTeam.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No support team members added yet.</p>
              )}
              {supportTeam.map((member, idx) => (
                <div key={member.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="md:col-span-3">
                    {isEditingHelpDesk ? (
                      <input 
                        type="text" 
                        value={member.name}
                        onChange={(e) => {
                          const newTeam = [...supportTeam];
                          newTeam[idx].name = e.target.value;
                          setSupportTeam(newTeam);
                        }}
                        placeholder="Name"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                      />
                    ) : (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Name</div>
                        <div className="text-sm font-medium text-slate-800">{member.name || '-'}</div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    {isEditingHelpDesk ? (
                      <input 
                        type="text" 
                        value={member.phone}
                        onChange={(e) => {
                          const newTeam = [...supportTeam];
                          newTeam[idx].phone = e.target.value;
                          setSupportTeam(newTeam);
                        }}
                        placeholder="Phone (e.g. 9879083666 ext:399)"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                      />
                    ) : (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Phone</div>
                        <div className="text-sm text-slate-600">{member.phone || '-'}</div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    {isEditingHelpDesk ? (
                      <input 
                        type="email" 
                        value={member.email}
                        onChange={(e) => {
                          const newTeam = [...supportTeam];
                          newTeam[idx].email = e.target.value;
                          setSupportTeam(newTeam);
                        }}
                        placeholder="Email"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                      />
                    ) : (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Email</div>
                        <div className="text-sm text-slate-600">{member.email || '-'}</div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    {isEditingHelpDesk && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newTeam = supportTeam.filter((_, i) => i !== idx);
                          setSupportTeam(newTeam);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <img src="https://cdn-icons-png.flaticon.com/512/484/484662.png" className="w-4 h-4 object-contain" alt="Delete" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isEditingHelpDesk && (
                <button 
                  type="button"
                  onClick={() => {
                    setSupportTeam([...supportTeam, { id: Date.now().toString(), name: '', phone: '', email: '' }]);
                  }}
                  className="w-full py-2 border-2 border-dashed border-sky-500/30 text-sm font-semibold text-sky-600 hover:bg-sky-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" className="w-4 h-4 object-contain" alt="Add" />
                  Add Team Member
                </button>
              )}
            </div>
          </div>
          )}
        </div>
        )}

        {/* Right Column: Staff Management & Support Requests */}
        <div className="w-full space-y-8">
          {(activeTab === 'staff') && (
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-[0_4px_24px_-8px_rgba(14,165,233,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/15 border border-white/50">
            <div className="px-8 py-6 border-b border-sky-500/10 flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
                  <img src="https://cdn-icons-png.flaticon.com/512/10433/10433048.png" className="w-5 h-5 object-contain" alt="User Management" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 tracking-tight">User Management</h3>
                  <p className="text-sm text-sky-600/80 mt-0.5 font-medium">Add, Edit, and Manage System Users</p>
                </div>
              </div>
            </div>
            
            {/* Create Form */}
            <div className="p-8 border-b border-sky-500/10 bg-white/20">
              <form onSubmit={handleCreateStaff} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Staff Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      className="w-full bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                      placeholder="e.g. SONU KUMAR"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Username / Branch Code</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      className="w-full bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                      placeholder="e.g. 500616"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Initial Password</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                      placeholder="Temporary secure password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Branch Name</label>
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      className="w-full bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                      placeholder="e.g. Patna Sadar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Dealership Name</label>
                    <input
                      type="text"
                      value={newDealershipName}
                      onChange={e => setNewDealershipName(e.target.value)}
                      className="w-full bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                      placeholder="e.g. M/S SANJAY AUTOMOBILES"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="block text-sm font-semibold text-slate-800">Assign Permissions</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                     {permissionOptions.map(p => {
                       const isSelected = newPermissions.includes(p.id);
                       return (
                         <label 
                           key={p.id} 
                           className={`group relative flex items-start gap-3 p-3.5 rounded-xl border border-transparent cursor-pointer transition-all duration-200 ${
                             isSelected 
                               ? 'border-sky-500/50 bg-sky-50/80 shadow-[0_4px_12px_rgba(14,165,233,0.1)] ring-1 ring-sky-500/20' 
                               : 'bg-white/60 backdrop-blur-md border-sky-500/10 hover:border-sky-500/30 hover:bg-white/80 hover:shadow-sm'
                           }`}
                         >
                           <div className="flex items-center h-5 mt-0.5">
                             <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shadow-sm ${
                               isSelected ? 'bg-gradient-to-r from-sky-500 to-blue-500' : 'bg-white border border-sky-500/20 group-hover:border-sky-500/40'
                             }`}>
                               {isSelected && <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" className="w-3 h-3 text-white object-contain" alt="Check" />}
                             </div>
                             <input 
                               type="checkbox" 
                               className="sr-only"
                               checked={isSelected}
                               onChange={e => {
                                 if (e.target.checked) setNewPermissions([...newPermissions, p.id]);
                                 else setNewPermissions(newPermissions.filter(x => x !== p.id));
                               }}
                             />
                           </div>
                           <div className="flex flex-col">
                             <span className={`text-sm tracking-tight font-semibold ${isSelected ? 'text-sky-800' : 'text-slate-700'}`}>
                               {p.label}
                             </span>
                           </div>
                         </label>
                       );
                     })}
                   </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" className="w-4 h-4 mr-2 object-contain" alt="Add" />
                    Create Staff Member
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Directory */}
            <div className="divide-y divide-sky-500/10">
              {users.map(u => (
                <div key={u.id} className="p-8 hover:bg-white/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-sky-600 font-bold border border-sky-500/20">
                           {u.name ? u.name.substring(0, 2).toUpperCase() : u.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-base tracking-tight">{u.name ? `${u.name} (${u.email})` : u.email}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            u.role === 'admin' 
                              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white' 
                              : 'bg-white/80 text-sky-700 border border-sky-200'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : 'Staff'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => setDeletingStaffId(u.id)} 
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent shadow-sm hover:shadow" 
                        title="Remove Account"
                      >
                        <img src="https://cdn-icons-png.flaticon.com/512/484/484662.png" className="w-4 h-4 object-contain" alt="Delete" />
                      </button>
                    )}
                  </div>

                  {u.role !== 'admin' && (
                    <div className="pl-13 sm:pl-14">
                      <p className="text-xs font-semibold text-sky-600/70 uppercase tracking-wider mb-3">Assigned Permissions</p>
                      <div className="flex flex-wrap gap-2">
                         {permissionOptions.map(p => {
                           const hasAccess = u.permissions.includes(p.id);
                           return (
                            <label 
                              key={p.id} 
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 shadow-sm ${
                                hasAccess 
                                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 border-transparent text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]' 
                                  : 'bg-white/60 backdrop-blur-md border-sky-500/20 text-slate-600 hover:bg-white/80 hover:border-sky-500/40'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={hasAccess}
                                onChange={e => {
                                  const newPerms = e.target.checked 
                                    ? [...u.permissions, p.id]
                                    : u.permissions.filter(x => x !== p.id);
                                  handleUpdatePermission(u.id, newPerms);
                                }}
                              />
                              <span className={`text-xs font-semibold tracking-tight ${hasAccess ? 'text-white' : 'text-slate-700'}`}>
                                {p.label}
                              </span>
                            </label>
                          );
                         })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                   <div className="w-12 h-12 bg-white/60 rounded-xl shadow-sm border border-sky-500/10 flex items-center justify-center mb-3">
                     <img src="https://cdn-icons-png.flaticon.com/512/681/681494.png" className="w-6 h-6 text-sky-400 object-contain" alt="Users" />
                   </div>
                   <p className="text-sm font-semibold text-slate-800">No team members</p>
                   <p className="text-sm text-slate-500 mt-1">Get started by creating a new staff account.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Password Reset Requests */}
          {(activeTab === 'support') && (
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-[0_4px_24px_-8px_rgba(14,165,233,0.1)] ring-1 ring-sky-500/15 border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(14,165,233,0.15)]">
            <div className="px-8 py-6 border-b border-sky-500/10 flex items-center gap-4 bg-white/40">
               <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(251,191,36,0.3)] border border-amber-300">
                 <img src="https://cdn-icons-png.flaticon.com/512/3014/3014227.png" className="w-5 h-5 object-contain" alt="Security" />
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Password Reset Requests</h3>
                 <p className="text-sm text-amber-600/80 mt-0.5 font-medium">Review and Approve Password Reset Requests</p>
               </div>
            </div>
            <div className="divide-y divide-sky-500/10">
              {requests.map(req => (
                <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800 tracking-tight">{req.email}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]"></div>
                      Requested on {new Date(req.requestedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {req.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        {resolvingId === req.id ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                             <input 
                               type="text" 
                               value={resolvePassword}
                               onChange={(e) => setResolvePassword(e.target.value)}
                               placeholder="Enter new password"
                               className="px-3 py-1.5 text-sm rounded-lg border border-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/60 w-40"
                             />
                             <button
                               onClick={() => submitResolveRequest(req)}
                               disabled={!resolvePassword || resolvingLoading}
                               className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                             >
                               {resolvingLoading ? 'Saving...' : 'Save'}
                             </button>
                             <button 
                               onClick={() => setResolvingId(null)}
                               className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                             >
                               <img src="https://cdn-icons-png.flaticon.com/512/2723/2723639.png" className="w-4 h-4 object-contain" alt="Close" />
                             </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setResolvingId(req.id);
                              setResolvePassword('');
                            }}
                            className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-md border border-sky-500/20 text-slate-700 hover:bg-white/80 hover:border-sky-500/40 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow"
                          >
                            Set New Password
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 bg-sky-50 text-sky-700 text-xs font-semibold tracking-tight rounded-full ring-1 ring-sky-200">
                        <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" className="w-3.5 h-3.5 mr-1.5 object-contain" alt="Check" /> Resolved
                      </span>
                    )}
                    <button 
                      onClick={() => setDeletingRequestId(req.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent shadow-sm hover:shadow"
                      title="Delete request"
                    >
                      <img src="https://cdn-icons-png.flaticon.com/512/484/484662.png" className="w-4 h-4 object-contain" alt="Delete" />
                    </button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="p-16 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/60 rounded-xl shadow-sm border border-sky-500/10 flex items-center justify-center mb-3">
                    <img src="https://cdn-icons-png.flaticon.com/512/3059/3059989.png" className="w-6 h-6 text-sky-400 object-contain" alt="Mail" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">Inbox Zero</p>
                  <p className="text-sm text-slate-500 mt-1">No pending password reset requests.</p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {(activeTab === 'banners') && (
        <BannersManager />
      )}
      
      <ConfirmDialog
        isOpen={deletingStaffId !== null}
        title="Remove Account"
        message="Are you sure you want to completely remove this staff account? They will lose all access immediately and this action cannot be undone."
        onConfirm={async () => {
          if (deletingStaffId) {
            await handleDeleteStaff(deletingStaffId);
          }
        }}
        onCancel={() => setDeletingStaffId(null)}
      />

      <ConfirmDialog
        isOpen={deletingRequestId !== null}
        title="Delete Request"
        message="Are you sure you want to delete this password request? This action cannot be undone."
        onConfirm={async () => {
          if (deletingRequestId) {
            await handleDeleteRequest(deletingRequestId);
          }
        }}
        onCancel={() => setDeletingRequestId(null)}
      />
    </div>
  );
}
