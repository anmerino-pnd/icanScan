import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

export default function CustomModal({ isOpen, title, message, type = 'alert', onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel animate-modal-in" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '28px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 240, 255, 0.08)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          title="Cerrar"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: type === 'confirm' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 174, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {type === 'confirm' ? (
              <HelpCircle size={24} color="var(--accent-cyan)" />
            ) : (
              <AlertCircle size={24} color="var(--accent-amber)" />
            )}
          </div>
          <h3 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {title || (type === 'confirm' ? 'Confirmación Requerida' : 'Aviso del Sistema')}
          </h3>
        </div>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '28px',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {type === 'confirm' && (
            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={type === 'confirm' ? 'btn btn-primary' : 'btn btn-amber'}
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            {type === 'confirm' ? 'Confirmar Acción' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
