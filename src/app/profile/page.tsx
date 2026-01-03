'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Users,
  Moon,
  Globe,
  ChevronRight,
  LogOut,
  Bell,
  X,
  Camera,
  Sparkles
} from 'lucide-react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { UserProfile } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { isDarkTheme, toggleTheme, currentUser, seedUserDefaults, userId, updateUserProfile, userProfile } = useFinance();
  const { restartTour } = useOnboarding();

  // Load initial username
  const [userName, setUserName] = useState<string>('Usuario');

  React.useEffect(() => {
    async function loadProfile() {
      if (userId) {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        if (data?.full_name) setUserName(data.full_name);
        else if (typeof currentUser === 'string') setUserName(currentUser.split('@')[0]);
      } else if (typeof currentUser === 'string') {
        setUserName(currentUser.split('@')[0]);
      }
    }
    loadProfile();
  }, [userId, currentUser]);

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [familyMembers, setFamilyMembers] = useState(['Hogar']);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset error when url changes
  React.useEffect(() => {
    setAvatarError(false);
  }, [userProfile?.avatar_url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { supabase } = await import('@/lib/supabase');

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (data) {
        await updateUserProfile({ avatar_url: data.publicUrl });
        alert('Foto de perfil actualizada!');
      }

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe) {
      router.push('/');
    }
  };

  const handleEditProfile = () => {
    setTempName(userName);
    setIsEditProfileOpen(true);
  };

  const saveProfileName = async () => {
    if (!userId) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      // Update both profiles and default auth metadata if possible, but profiles table is our source of truth now
      const { error } = await supabase.from('profiles').update({ full_name: tempName }).eq('id', userId);

      if (error) {
        console.error(error);
        alert('Error al guardar nombre: ' + error.message);
      } else {
        setUserName(tempName);
        setIsEditProfileOpen(false);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleAddFamily = () => {
    router.push('/family');
  };

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      className={`switch ${checked ? 'checked' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
    >
      <div className="switch-knob" />
      <style jsx>{`
        .switch {
          width: 51px;
          height: 31px;
          background-color: #E9E9EA;
          border-radius: 31px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .switch.checked {
          background-color: #34C759;
        }
        .switch-knob {
          width: 27px;
          height: 27px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
          transition: transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .switch.checked .switch-knob {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );

  return (
    <MobileLayout>
      <div
        className="profile-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="header-top">
          <button className="close-page-btn" onClick={() => router.push('/')}>
            <X size={24} />
          </button>
        </div>

        <h1 className="page-title">Configuración</h1>

        <div className="profile-header">
          <div className="avatar-large" style={{ position: 'relative' }}>
            <img
              src={avatarError ? `https://ui-avatars.com/api/?name=${userName}&background=007AFF&color=fff&size=128` : (userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${userName}&background=007AFF&color=fff&size=128`)}
              alt="Profile"
              onError={() => setAvatarError(true)}
            />
          </div>
          <h2>{userName}</h2>
          <p>{typeof currentUser === 'string' ? currentUser : 'Usuario'}</p>
          <button className="edit-profile-link" onClick={handleEditProfile}>Editar Perfil</button>
        </div>

        {/* Settings Groups */}
        <div className="settings-group">
          <h3 className="group-title">Cuenta</h3>
          <div className="group-content">
            <div className="settings-item" onClick={handleEditProfile}>
              <div className="item-left">
                <div className="icon-box" style={{ background: '#007AFF' }}><User size={20} /></div>
                <span className="item-label">Mi Perfil</span>
              </div>
              <div className="item-right">
                <span className="item-value">{userName}</span>
                <ChevronRight size={16} className="chevron" />
              </div>
            </div>
            <div className="settings-item" onClick={handleAddFamily}>
              <div className="item-left">
                <div className="icon-box" style={{ background: '#5856D6' }}><Users size={20} /></div>
                <span className="item-label">Familia</span>
              </div>
              <div className="item-right">
                <span className="item-value">{familyMembers.length > 1 ? `${familyMembers.length} Miembros` : 'Hogar'}</span>
                <ChevronRight size={16} className="chevron" />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3 className="group-title">Preferencias</h3>
          <div className="group-content">
            <div className="settings-item">
              <div className="item-left">
                <div className="icon-box" style={{ background: '#FF9500' }}><Moon size={20} /></div>
                <span className="item-label">Tema Oscuro</span>
              </div>
              <div className="item-right">
                <Switch checked={isDarkTheme} onChange={toggleTheme} />
              </div>
            </div>
            <div className="settings-item">
              <div className="item-left">
                <div className="icon-box" style={{ background: '#FF3B30' }}><Bell size={20} /></div>
                <span className="item-label">Notificaciones</span>
              </div>
              <div className="item-right">
                <Switch checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3 className="group-title">Ayuda</h3>
          <div className="group-content">
            <div className="settings-item" onClick={() => {
              restartTour();
              router.push('/');
            }}>
              <div className="item-left">
                <div className="icon-box" style={{ background: '#32ADE6' }}><Sparkles size={20} /></div>
                <span className="item-label">Repetir Tutorial de la App</span>
              </div>
              <div className="item-right">
                <ChevronRight size={16} className="chevron" />
              </div>
            </div>
          </div>
        </div>

        {/* DEBUG / RECOVERY SECTION */}
        <div className="section-container" style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
          <h3 className="section-title text-red-500">Zona de Peligro / Recuperación</h3>
          <p className="text-sm text-gray-500 mb-4">
            Si entraste y no ves tus categorías, pulsa aquí.
          </p>
          <button
            onClick={async () => {
              if (!confirm('¿Reiniciar datos base?')) return;
              try {
                if (userId && seedUserDefaults) {
                  await seedUserDefaults(userId, typeof currentUser === 'string' ? currentUser : undefined);
                  alert('✅ Datos reiniciados. Recarga la página.');
                  window.location.reload();
                } else {
                  alert('Error: Datos user no disponibles');
                }
              } catch (e: any) {
                alert('Error: ' + e.message);
              }
            }}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
          >
            🏗️ Forzar Reinicio de Datos
          </button>
        </div>

        <button className="logout-btn" onClick={handleSignOut}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Editar Perfil</h3>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="modal-input"
                autoFocus
              />
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setIsEditProfileOpen(false)}>Cancelar</button>
                <button className="save-btn" onClick={saveProfileName}>Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-container {
          padding-top: 20px;
          min-height: 100vh; /* Ensure full height for swipe */
        }

        .header-top {
          display: flex;
          justify-content: flex-end;
          padding: 0 10px;
          margin-bottom: 10px;
        }

        .close-page-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-border, #E5E5EA);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted, #8E8E93);
          cursor: pointer;
        }

        .page-title {
          font-size: 34px;
          font-weight: 700;
          margin-bottom: 24px;
          color: var(--color-text, #000);
        }

        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-upload-btn {
            position: absolute;
            bottom: 0;
            right: 0;
            background: white;
            border-radius: 50%;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #007AFF;
            transition: transform 0.2s;
        }
        .avatar-upload-btn:active {
            transform: scale(0.9);
        }

        .profile-header h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text, #000);
        }

        .profile-header p {
          font-size: 17px;
          color: var(--color-text-muted, #8E8E93);
          margin: 0;
        }

        .edit-profile-link {
          margin-top: 8px;
          font-size: 15px;
          color: #007AFF;
          background: none;
          border: none;
          cursor: pointer;
        }

        .settings-group {
          margin-bottom: 24px;
        }

        .group-title {
          font-size: 13px;
          text-transform: uppercase;
          color: var(--color-text-muted, #8E8E93);
          margin-bottom: 8px;
          padding-left: 16px;
        }

        .group-content {
          background: var(--color-surface, white);
          border-radius: 12px;
          overflow: hidden;
        }

        .settings-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-surface, white);
          position: relative;
          cursor: pointer;
          min-height: 44px;
        }

        .settings-item:active {
          background: var(--color-bg, #F2F2F7);
        }

        .settings-item:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 56px;
          right: 0;
          height: 1px;
          background: var(--color-border, #E5E5EA);
        }

        .item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-box {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        /* Different colors for icons */
        .settings-group:nth-child(1) .settings-item:nth-child(1) .icon-box { background: #007AFF; }
        .settings-group:nth-child(1) .settings-item:nth-child(2) .icon-box { background: #5856D6; }
        .settings-group:nth-child(2) .settings-item:nth-child(1) .icon-box { background: #34C759; }
        .settings-group:nth-child(2) .settings-item:nth-child(2) .icon-box { background: #FF9500; }
        .settings-group:nth-child(2) .settings-item:nth-child(3) .icon-box { background: #FF3B30; }

        .item-label {
          font-size: 17px;
          color: var(--color-text, #000);
        }

        .item-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .item-value {
          font-size: 17px;
          color: var(--color-text-muted, #8E8E93);
        }

        .chevron {
          color: var(--color-text-muted, #C7C7CC);
        }

        .logout-btn {
          width: 100%;
          padding: 16px;
          background: var(--color-surface, white);
          border: none;
          border-radius: 12px;
          color: #FF3B30;
          font-size: 17px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          cursor: pointer;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--color-surface, white);
          padding: 24px;
          border-radius: 20px;
          width: 80%;
          max-width: 320px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .modal-content h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text, #000);
        }

        .modal-input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--color-border, #E5E5EA);
          border-radius: 10px;
          font-size: 17px;
          margin-bottom: 20px;
          outline: none;
          background: var(--color-surface, white);
          color: var(--color-text, #000);
        }

        .modal-input:focus {
          border-color: #007AFF;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-actions button {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        .cancel-btn {
          background: var(--color-bg, #F2F2F7);
          color: var(--color-text, #000);
        }

        .save-btn {
          background: #007AFF;
          color: white;
        }
      `}</style>
    </MobileLayout>
  );
}
