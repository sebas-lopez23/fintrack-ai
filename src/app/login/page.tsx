'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Auto-login for development
  // Check for existing session
  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  // Auto-login for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoLogin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('🔧 Dev Mode: Auto-logging in as Admin...');
          setIsLoading(true);
          const { error } = await supabase.auth.signInWithPassword({
            email: 'admin@fintrack.com',
            password: 'password123',
          });
          if (!error) {
            // Force reload to ensure Context picks up the new session
            window.location.href = '/dashboard';
          } else {
            console.error('Auto-login failed:', error);
            setIsLoading(false);
          }
        }
      };
      autoLogin();
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard'); // Ir al dashboard
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">💸</div>
          <h1>FinTrack AI</h1>
          <p>Tu asistente financiero inteligente</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {error && <div className="error-msg">{error}</div>}

          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="divider">
          <span>O continúa con</span>
        </div>

        <div className="social-buttons">
          <button onClick={() => handleSocialLogin('google')} className="social-btn google">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            <span>Google</span>
          </button>
          {/* Puedes agregar Apple o Facebook aquí igual */}
        </div>

        <p className="toggle-auth">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          /* Background handled by layout.tsx mesh */
        }

        .login-card {
          background: var(--glass-surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          padding: 40px;
          border-radius: 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-glass);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo-icon {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        h1 {
          color: var(--color-text-main);
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        p {
          color: var(--color-text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-light);
        }

        input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          color: var(--color-text-main);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s;
        }

        input:focus {
          border-color: var(--color-primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .submit-btn {
          background: var(--color-primary);
          color: white;
          padding: 14px;
          border-radius: 99px;
          font-weight: 600;
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .submit-btn:hover {
          background: var(--color-primary-dark);
          transform: translateY(-2px);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: var(--color-text-light);
          font-size: 0.875rem;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }

        .divider span {
          padding: 0 10px;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.6);
          border: 1px solid white;
          border-radius: 16px;
          color: var(--color-text-main);
          font-weight: 500;
          transition: transform 0.2s;
        }

        .social-btn:hover {
          transform: translateY(-2px);
          background: white;
        }

        .toggle-auth {
          margin-top: 24px;
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .toggle-auth button {
          color: var(--color-primary);
          font-weight: 600;
          margin-left: 5px;
        }

        .toggle-auth button:hover {
          text-decoration: underline;
        }

        .error-msg {
          background: var(--color-danger-soft);
          color: var(--color-danger);
          padding: 10px;
          border-radius: 12px;
          font-size: 0.875rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
