import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import './AuthCard.css';

export const AuthCard = () => {
  const { toResetPassword } = useAuthenticator((context) => [context.toResetPassword]);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [requireOtp, setRequireOtp] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ username: email, password });
      // Authenticator automatically handles Hub event
    } catch (err) {
      setError(err.message || 'Error signing in');
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            name: name || email.split('@')[0]
          }
        }
      });
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setRequireOtp(true);
      } else if (nextStep.signUpStep === 'DONE') {
        await signIn({ username: email, password });
      }
    } catch (err) {
      setError(err.message || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: otp });
      // After confirmation, we need to sign in manually
      await signIn({ username: email, password });
    } catch (err) {
      setError(err.message || 'Invalid confirmation code');
      setLoading(false);
    }
  };

  if (requireOtp) {
    return (
      <div className="shortener__card auth-card__otp">
        <h2 className="features__title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Confirm Email</h2>
        <p className="features__subtitle" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          We sent a code to {email}.
        </p>
        <form className="shortener__form" onSubmit={handleConfirmOtp} style={{ flexDirection: 'column', gap: '1rem' }}>
          <div className="shortener__input-wrap" style={{ width: '100%' }}>
            <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg></span>
            <input
              type="text"
              className="shortener__input"
              placeholder="Confirmation Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="shortener__btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? <span className="spinner" /> : 'Confirm'}
          </button>
        </form>
        {error && <div className="shortener__error" style={{ textAlign: 'center', marginTop: '1rem' }}>{error}</div>}
        <button 
          onClick={() => setRequireOtp(false)} 
          className="header__link" 
          style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card-wrapper">
      <div className="card-switch-container">
        <span 
          className={`switch-label ${!isFlipped ? 'active' : ''}`}
          onClick={() => { setIsFlipped(false); setError(''); }}
        >
          Log in
        </span>
        <label className="switch">
          <input 
            type="checkbox" 
            className="toggle" 
            checked={isFlipped}
            onChange={(e) => {
              setIsFlipped(e.target.checked);
              setError('');
            }}
          />
          <span className="slider" />
        </label>
        <span 
          className={`switch-label ${isFlipped ? 'active' : ''}`}
          onClick={() => { setIsFlipped(true); setError(''); }}
        >
          Sign up
        </span>
      </div>

      <div className="flip-card">
        <div className={`flip-card__inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front: Login */}
          <div className="flip-card__front shortener__card">
            <h2 className="features__title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Log in</h2>
            <form className="flip-card__form" onSubmit={handleSignIn}>
              <div className="shortener__input-wrap" style={{ width: '100%' }}>
                <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span>
                <input 
                  className="shortener__input" 
                  name="email" 
                  placeholder="Email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="shortener__input-wrap" style={{ width: '100%' }}>
                <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                <input 
                  className="shortener__input" 
                  name="password" 
                  placeholder="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="shortener__btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading && !isFlipped ? <span className="spinner" /> : "Let's go!"}
              </button>
              
              {error && !isFlipped && <div className="shortener__error" style={{ textAlign: 'center' }}>{error}</div>}
              
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); toResetPassword(); }} 
                className="header__link" 
                style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
              >
                Forgot your password?
              </button>
            </form>
          </div>

          {/* Back: Sign Up */}
          <div className="flip-card__back shortener__card">
            <h2 className="features__title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Sign up</h2>
            <form className="flip-card__form" onSubmit={handleSignUp}>
              <div className="shortener__input-wrap" style={{ width: '100%' }}>
                <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                <input 
                  className="shortener__input" 
                  placeholder="Name" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="shortener__input-wrap" style={{ width: '100%' }}>
                <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></span>
                <input 
                  className="shortener__input" 
                  name="email" 
                  placeholder="Email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="shortener__input-wrap" style={{ width: '100%' }}>
                <span className="shortener__input-icon" style={{ display: 'flex' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                <input 
                  className="shortener__input" 
                  name="password" 
                  placeholder="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="shortener__btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading && isFlipped ? <span className="spinner" /> : 'Confirm!'}
              </button>

              {error && isFlipped && <div className="shortener__error" style={{ textAlign: 'center' }}>{error}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
