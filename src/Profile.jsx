import { useState, useEffect } from 'react';
import { fetchAuthSession, updatePassword } from 'aws-amplify/auth';
import { QRCodeCanvas } from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile({ user, signOut }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      const token = tokens?.idToken?.toString() || tokens?.accessToken?.toString();

      const res = await fetch(`${API_URL}/my-urls`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch URLs from server');
      const data = await res.json();
      setUrls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdMsg('');
    setPwdLoading(true);

    try {
      await updatePassword({ oldPassword, newPassword });
      setPwdMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Profile Settings</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Logged in as {user?.signInDetails?.loginId || 'User'}</span>
        </div>
        <button 
          onClick={signOut} 
          style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
        >
          Sign Out
        </button>
      </div>

      {/* Password Update Form */}
      <div className="profile-section" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Security</h3>
        <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="shortener__input-wrap">
            <input 
              type="password" 
              placeholder="Current Password" 
              className="shortener__input" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="shortener__input-wrap">
            <input 
              type="password" 
              placeholder="New Password" 
              className="shortener__input" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="shortener__btn" disabled={pwdLoading}>
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {pwdError && <div className="shortener__error">{pwdError}</div>}
        {pwdMsg && <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.4rem' }}>{pwdMsg}</div>}
      </div>

      {/* User URLs Table */}
      <div className="profile-section">
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>My Links</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><span className="spinner" /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.12)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Unable to load your links right now.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Please try again in a moment.</p>
          </div>
        ) : urls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.12)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔗</div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>No links yet</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Head over to the <strong style={{ color: 'var(--accent-2)' }}>Shortener</strong> tab to create your first short link!</p>
          </div>
        ) : (
          <div className="url-table-container" style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Short Link</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Original URL</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Tags</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Created</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>QR</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((u) => (
                  <tr key={u.shortcode} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <a href={`${window.location.origin}/${u.shortcode}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'none', fontWeight: 600 }}>{u.shortcode}</a>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {u.originalUrl}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                      {u.tags && u.tags.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.tags.map(t => <span key={t} style={{ background: 'var(--accent-1)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{t}</span>)}
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ background: 'white', padding: '0.2rem', borderRadius: '4px', display: 'inline-block' }}>
                        <QRCodeCanvas value={`${window.location.origin}/${u.shortcode}`} size={48} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
