import { useState } from 'react'
import './index.css'

// TODO: Replace with your actual API Gateway Invoke URL
const API_URL = 'https://mwraaebttk.execute-api.us-east-1.amazonaws.com'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [shortcode, setShortcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])

  const isValidUrl = (string) => {
    try {
      const u = new URL(string)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')
    setCopied(false)

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL.')
      return
    }

    // Auto-prepend https:// if missing
    const finalUrl = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`

    if (!isValidUrl(finalUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com).')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Server responded with ${res.status}`)
      }

      const data = await res.json()
      const generatedShortUrl = data.shortUrl || `${API_URL}/${data.shortcode}`
      setShortUrl(generatedShortUrl)
      setShortcode(data.shortcode)

      // Add to local history (most recent first)
      setHistory((prev) => [
        { shortUrl: generatedShortUrl, originalUrl: finalUrl, shortcode: data.shortcode, createdAt: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ])
      setUrl('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = textToCopy
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Animated background */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb--violet" />
      <div className="bg-orb bg-orb--cyan" />

      {/* Header */}
      <header className="header">
        <div className="container header__inner">
          <a href="/" className="logo">
            <div className="logo__icon">⚡</div>
            <span className="logo__text">Sniplink</span>
          </a>
          <div className="header__links">
            <a href="#features" className="header__link">Features</a>
            <a href="#stats" className="header__link">Stats</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Serverless · Lightning Fast
          </div>

          <h1 className="hero__title">
            Shorten any link in{' '}
            <span className="hero__title-gradient">milliseconds.</span>
          </h1>

          <p className="hero__subtitle">
            Paste a long URL and get a clean, shareable short link instantly.
            Built on AWS serverless infrastructure for blazing speed and zero downtime.
          </p>
        </div>
      </section>

      {/* Shortener Card */}
      <section className="shortener">
        <div className="container">
          <div className="shortener__card">
            <form className="shortener__form" onSubmit={handleSubmit}>
              <div className="shortener__input-wrap">
                <span className="shortener__input-icon">🔗</span>
                <input
                  id="url-input"
                  type="text"
                  className="shortener__input"
                  placeholder="Paste your long URL here..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError('') }}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button
                id="shorten-btn"
                type="submit"
                className="shortener__btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Shorten'}
              </button>
            </form>
            <div className="shortener__error">{error}</div>

            {shortUrl && (
              <div className="result">
                <div className="result__label">Your shortened link</div>
                <div className="result__row">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result__url"
                    id="short-url-output"
                  >
                    {shortUrl}
                  </a>
                  <button
                    id="copy-btn"
                    className={`result__copy-btn ${copied ? 'result__copy-btn--copied' : ''}`}
                    onClick={() => handleCopy(shortUrl)}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent History */}
          {history.length > 0 && (
            <div className="shortener__card" style={{ marginTop: '1rem', maxWidth: 620 }}>
              <div className="result__label" style={{ marginBottom: '0.6rem' }}>Recent links</div>
              {history.map((item, i) => (
                <div key={i} className="result__row" style={{ marginBottom: i < history.length - 1 ? '0.5rem' : 0, paddingBottom: i < history.length - 1 ? '0.5rem' : 0, borderBottom: i < history.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="result__url"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {item.shortUrl}
                    </a>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.originalUrl}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="container">
          <div className="features__header">
            <h2 className="features__title">Why Sniplink?</h2>
            <p className="features__subtitle">
              Built on AWS serverless — pay only for what you use.
            </p>
          </div>

          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__icon">⚡</div>
              <h3 className="feature-card__title">Instant Redirects</h3>
              <p className="feature-card__text">
                Powered by AWS Lambda and DynamoDB for sub-50ms lookups and lightning-fast 301 redirects globally.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🔒</div>
              <h3 className="feature-card__title">Secure by Design</h3>
              <p className="feature-card__text">
                End-to-end encryption with ACM certificates. Least-privilege IAM roles for every component.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">💸</div>
              <h3 className="feature-card__title">Virtually Free</h3>
              <p className="feature-card__text">
                Serverless scales to zero. Handle 100K+ clicks for roughly $0.23/month with no idle costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats" id="stats">
        <div className="container">
          <div className="stats__grid">
            <div>
              <div className="stat__value">&lt;50ms</div>
              <div className="stat__label">Redirect Latency</div>
            </div>
            <div>
              <div className="stat__value">$0.23</div>
              <div className="stat__label">Monthly Cost (100K clicks)</div>
            </div>
            <div>
              <div className="stat__value">99.99%</div>
              <div className="stat__label">Uptime SLA</div>
            </div>
            <div>
              <div className="stat__value">∞</div>
              <div className="stat__label">Scales to Zero</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer__inner">
          <span>© {new Date().getFullYear()} Sniplink. Built on AWS Serverless.</span>
          <div className="footer__links">
            <a href="#features" className="footer__link">Features</a>
            <a href="#stats" className="footer__link">Stats</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
