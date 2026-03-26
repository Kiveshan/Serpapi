import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EEF6FF', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#BFE3F2', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 16px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: '#0669F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={16} color="#ffffff" />
          </div>
          <div style={{ fontWeight: 700, color: '#0669F4', fontSize: 16 }}>Publications</div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 720, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#000000', marginBottom: 10 }}>
            Introducing Publications
          </div>

          <h1 style={{ margin: 0, fontSize: 48, lineHeight: 1.05, fontWeight: 800, color: '#111827' }}>
            Refine Your
            <br />
            <span style={{ color: '#0669F4' }}>Publications</span>
          </h1>

          <p style={{ margin: '18px auto 0', maxWidth: 560, color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
            Publications management is the process of organizing, tracking, and accessing all research outputs within an institution.
            It enables users to efficiently search for publications using filters such as author, title, keywords, institution, or
            publication date.
          </p>

          <button
            type="button"
            onClick={() => navigate('/search')}
            style={{
              marginTop: 18,
              backgroundColor: '#0669F4',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              height: 38,
              padding: '0 18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 18px rgba(6, 105, 244, 0.18)',
            }}
          >
            Log in <ArrowRight size={16} />
          </button>
        </div>
      </main>

      <footer style={{ backgroundColor: '#BFE3F2', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px', textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
          &copy; 2026 Publications
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;