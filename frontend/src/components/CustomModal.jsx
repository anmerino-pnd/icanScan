import React from 'react';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

export default function CustomModal({ isOpen, title, message, type = 'alert', onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(45, 45, 45, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="postit-card animate-modal-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '32px',
        border: '3px solid var(--border-lead)',
        boxShadow: '8px 8px 0px 0px #2d2d2d',
        position: 'relative',
        background: type === 'confirm' ? 'var(--bg-surface)' : 'var(--bg-postit)',
        transform: 'rotate(-1deg)'
      }}>
        {/* Tape Decoration holding the note on screen */}
        <div className="tape-decoration" />

        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Cerrar"
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--wobbly-sm)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '2px solid var(--border-lead)',
            boxShadow: '2px 2px 0px 0px #2d2d2d'
          }}>
            {type === 'confirm' ? (
              <HelpCircle size={28} color="var(--accent-blue)" />
            ) : (
              <AlertCircle size={28} color="var(--accent-red)" />
            )}
          </div>
          <h3 style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {title || (type === 'confirm' ? 'Confirmación Requerida' : 'Aviso del Cuaderno')}
          </h3>
        </div>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          marginBottom: '32px',
          whiteSpace: 'pre-line',
          fontFamily: 'Patrick Hand, cursive'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          {type === 'confirm' && (
            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '10px 22px', fontSize: '1.05rem' }}
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className="btn btn-primary"
            style={{ 
              padding: '12px 28px', 
              fontSize: '1.15rem', 
              fontFamily: 'Kalam, cursive', 
              fontWeight: 700,
              background: type === 'confirm' ? 'var(--accent-blue)' : 'var(--accent-red)',
              color: '#ffffff',
              boxShadow: '3px 3px 0px 0px #2d2d2d'
            }}
          >
            {type === 'confirm' ? 'Confirmar Acción' : '¡Entendido!'}
          </button>
        </div>
      </div>
    </div>
  );
}
