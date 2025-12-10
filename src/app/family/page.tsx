'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { Users, UserPlus, Mail, Check, X, Shield, ShieldCheck } from 'lucide-react';

export default function FamilyPage() {
    const {
        currentFamily,
        pendingInvites,
        sendInvite,
        acceptInvite,
        currentUser
    } = useFinance();

    const [inviteEmail, setInviteEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!inviteEmail.includes('@')) {
            alert('Ingresa un correo válido');
            return;
        }
        setIsSending(true);
        await sendInvite(inviteEmail);
        setInviteEmail('');
        setIsSending(false);
    };

    return (
        <MobileLayout>
            <div className="page-header">
                <h1>Finanzas en Pareja</h1>
                <p>Gestiona tu hogar en equipo.</p>
            </div>

            {/* STATUS CARD */}
            <div className="status-card">
                {currentFamily ? (
                    <>
                        <div className="icon-badge connected">
                            <Users size={24} color="#34C759" />
                        </div>
                        <div className="status-info">
                            <h3>{currentFamily.name}</h3>
                            <span className="status-label">Familia Activa</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="icon-badge">
                            <UserPlus size={24} color="#007AFF" />
                        </div>
                        <div className="status-info">
                            <h3>Modo Solitario</h3>
                            <span className="status-label">Crea tu familia invitando a alguien</span>
                        </div>
                    </>
                )}
            </div>

            {/* PENDING INVITES */}
            {pendingInvites.length > 0 && (
                <div className="section">
                    <h3>🔔 Invitaciones Pendientes</h3>
                    <div className="invites-list">
                        {pendingInvites.map(invite => (
                            <div key={invite.id} className="invite-card">
                                <div className="invite-content">
                                    <span className="inviter">Invitación de Familia</span>
                                    <span className="email">{invite.email}</span>
                                </div>
                                <div className="invite-actions">
                                    <button className="accept-btn" onClick={() => acceptInvite(invite.family_id)}>
                                        Unirme
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INVITE FORM */}
            <div className="section">
                <h3>Invitar a tu Pareja</h3>
                <div className="invite-box">
                    <div className="input-group">
                        <Mail size={20} color="#8E8E93" />
                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                    </div>
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!inviteEmail || isSending}
                    >
                        {isSending ? 'Enviando...' : 'Enviar Invitación'}
                    </button>
                    <p className="hint">
                        Tu pareja recibirá una notificación en la App cuando inicie sesión con este correo.
                    </p>
                </div>
            </div>

            {/* INFO */}
            <div className="info-cards">
                <div className="info-item">
                    <ShieldCheck size={20} color="#007AFF" />
                    <div>
                        <h4>Privacidad Total</h4>
                        <p>Solo verás los gastos que marques como "Compartidos". Tus gastos personales siguen siendo privados.</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .page-header h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px; }
                .page-header p { color: #8E8E93; font-size: 14px; margin-bottom: 24px; }

                .status-card {
                    background: white; border-radius: 20px; padding: 20px;
                    display: flex; align-items: center; gap: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 32px;
                }
                .icon-badge {
                    width: 50px; height: 50px; border-radius: 12px; background: #F2F2F7;
                    display: flex; align-items: center; justify-content: center;
                }
                .icon-badge.connected { background: #E4F9E9; }
                
                .status-info h3 { margin: 0 0 4px; font-size: 18px; font-weight: 700; }
                .status-label { font-size: 13px; color: #8E8E93; font-weight: 600; }

                .section { margin-bottom: 32px; }
                .section h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #1C1C1E; }

                .invite-box { background: white; padding: 20px; border-radius: 20px; border: 1px solid #F2F2F7; }
                .input-group { 
                    display: flex; align-items: center; gap: 10px; background: #F9F9F9; 
                    padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; 
                }
                .input-group input { 
                    border: none; background: none; outline: none; flex: 1; font-size: 15px; 
                }

                .send-btn {
                    width: 100%; background: #007AFF; color: white; padding: 14px; 
                    border-radius: 12px; font-weight: 700; border: none; font-size: 15px;
                }
                .send-btn:disabled { opacity: 0.5; }
                .hint { font-size: 12px; color: #8E8E93; margin-top: 12px; line-height: 1.4; }

                .invite-card {
                    background: #E4F9E9; padding: 16px; border-radius: 16px; 
                    display: flex; justify-content: space-between; align-items: center; border: 1px solid #34C759;
                }
                .invite-content { display: flex; flex-direction: column; }
                .inviter { font-weight: 700; font-size: 14px; color: #1C1C1E; }
                .email { font-size: 12px; color: #34C759; font-weight: 600; }
                .accept-btn { background: #34C759; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; }

                .info-cards { display: flex; flex-direction: column; gap: 16px; }
                .info-item { display: flex; gap: 12px; background: white; padding: 16px; border-radius: 16px; border: 1px solid #F2F2F7; }
                .info-item h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; }
                .info-item p { margin: 0; font-size: 13px; color: #8E8E93; line-height: 1.4; }
            `}</style>
        </MobileLayout>
    );
}
