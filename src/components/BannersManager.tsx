import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { LoginBanner } from '../types';
import { Image as ImageIcon, Images as ImagesIcon, Trash2, Plus, LayoutTemplate } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';

export function BannersManager() {
  const [banners, setBanners] = useState<LoginBanner[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);

  // Handle file selection and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Iteratively compress if still too large (approx 900KB base64 = ~675KB binary)
          // 900 * 1024 = 921600 bytes
          while (dataUrl.length > 900000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          if (dataUrl.length > 1000000) {
            setError('Image is too large and cannot be compressed enough to be uploaded.');
            setLoading(false);
            return;
          }
          
          setNewBannerUrl(dataUrl);
          setLoading(false);
        } else {
          setError('Failed to compress image.');
          setLoading(false);
        }
      };
      
      img.onerror = () => {
        setError('Failed to load image for compression.');
        setLoading(false);
      };
      
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const q = query(collection(db, 'loginBanners'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: LoginBanner[] = [];
      snapshot.forEach(d => {
        data.push({ ...d.data(), id: d.id } as LoginBanner);
      });
      data.sort((a, b) => b.createdAt - a.createdAt);
      setBanners(data);
    }, (error) => console.error("Error fetching banners:", error));
    return unsub;
  }, []);

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerUrl.trim()) {
      setError('Please select an image first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    if (!newBannerUrl.startsWith('data:image')) {
       setError('Invalid image format.');
       setLoading(false);
       return;
    }

    try {
      await addDoc(collection(db, 'loginBanners'), {
        imageUrl: newBannerUrl.trim(),
        createdAt: Date.now()
      });
      setNewBannerUrl('');
      // Reset the file input if needed
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError('Failed to add banner: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBannerConfirm = async () => {
    if (!deletingBannerId) return;
    try {
      await deleteDoc(doc(db, 'loginBanners', deletingBannerId));
      setDeletingBannerId(null);
    } catch (err: any) {
      setError('Failed to delete banner: ' + err.message);
      setDeletingBannerId(null);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-[0_4px_24px_-8px_rgba(14,165,233,0.1)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(14,165,233,0.15)] ring-1 ring-sky-500/15 border border-white/50 mt-8">
      <div className="px-8 py-6 border-b border-sky-500/10 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
            <img src="https://cdn-icons-png.flaticon.com/512/5889/5889158.png" className="w-6 h-6 object-contain" alt="Banners" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Banner Management</h3>
            <p className="text-sm text-sky-600/80 mt-0.5 font-medium">Upload and Manage Login and Dashboard Page Banners</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 border-b border-sky-500/10 bg-white/20">
        <form onSubmit={handleAddBanner} className="space-y-4">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex gap-4 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="flex-1 bg-white/60 border border-sky-500/20 rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 transition-all focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !newBannerUrl.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-[0_4px_12px_rgba(14,165,233,0.3)] flex items-center gap-2 h-[42px]"
            >
              <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" className="w-4 h-4 object-contain" alt="Add" /> Upload
            </button>
          </div>
          {newBannerUrl && (
            <div className="mt-4 border border-sky-200 rounded-xl p-2 inline-block">
              <p className="text-xs text-slate-500 mb-2">Preview:</p>
              <img src={newBannerUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
            </div>
          )}
        </form>
      </div>

      <div className="p-8 bg-white/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {banners.length === 0 ? (
             <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                No custom banners uploaded. Default banner will be used.
             </div>
          ) : (
            banners.map(b => (
              <div key={b.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <img src={b.imageUrl} alt="Banner" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-sky-500/50 rounded-xl pointer-events-none transition-colors"></div>
                <button
                  onClick={() => setDeletingBannerId(b.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Delete Banner"
                >
                  <img src="https://cdn-icons-png.flaticon.com/512/484/484662.png" className="w-4 h-4 object-contain" alt="Delete" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deletingBannerId !== null}
        title="Delete Banner"
        message="Are you sure you want to delete this banner from the login page?"
        onConfirm={handleDeleteBannerConfirm}
        onCancel={() => setDeletingBannerId(null)}
      />
    </div>
  );
}
