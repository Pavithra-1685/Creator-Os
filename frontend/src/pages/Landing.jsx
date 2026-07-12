import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BotIcon, BriefcaseIcon, CalendarIcon, WalletIcon } from '../components/Icons';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      {/* Header / Top Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 40px', 
        borderBottom: 'var(--border-width) solid var(--border-color)', 
        backgroundColor: 'var(--bg-sidebar)' 
      }}>
        <div className="sidebar-brand" style={{ fontSize: '2rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF3E7F" stroke="#111111" strokeWidth="2" />
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>CreatorOS</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {user ? (
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '1rem', width: 'auto' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '1rem' }}>
                Log In
              </Link>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '1rem', width: 'auto' }}>
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        padding: '80px 40px 60px 40px', 
        textAlign: 'center', 
        background: 'linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-main) 100%)',
        borderBottom: 'var(--border-width) solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '4.5rem', 
            lineHeight: '1.1', 
            marginBottom: '24px', 
            fontFamily: 'var(--font-title)',
            fontWeight: '800'
          }}>
            The AI-Powered Operating System for <span style={{ color: 'var(--pink-hot)', textDecoration: 'underline' }}>Content Creators</span>
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'var(--text-secondary)', 
            marginBottom: '40px',
            lineHeight: '1.6',
            maxWidth: '750px',
            marginInline: 'auto'
          }}>
            Ditch the fragmented workspace of Notion, ChatGPT, Google Sheets, and Trello. CreatorOS consolidates your calendar, scripts, brand deals, and analytics into one pink-brutalist master dashboard.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 36px', fontSize: '1.2rem', width: 'auto' }}>
              Claim Your Workspace
            </Link>
            <a href="#features" className="btn-secondary" style={{ textDecoration: 'none', padding: '16px 36px', fontSize: '1.2rem' }}>
              See Features
            </a>
          </div>
        </div>
      </header>

      {/* Bento Grid Features */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
          Supercharge Your Workflow
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center', marginBottom: '60px' }}>
          Everything a professional creator needs, built right into a high-fidelity system.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '30px' }}>
          {/* Card 1: Content Calendar */}
          <div className="panel-card highlight-pink bento-item-span-8" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              
              <CalendarIcon size={28} />
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', marginTop: '12px', fontFamily: 'var(--font-title)' }}>Unified Content Calendar</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: '1.6' }}>
                Plan and schedule posts across YouTube, Instagram, TikTok, and Twitter. Move content through custom pipeline stages: Idea, Research, Scripting, Editing, and Published.
              </p>
            </div>
            <div style={{ marginTop: '24px', background: 'white', padding: '16px', border: '2px solid var(--border-color)', borderRadius: '8px', boxShadow: '3px 3px 0px var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <span className="platform-tag youtube">YouTube Video</span>
                <span className="platform-tag instagram">Instagram Reel</span>
                <span className="platform-tag tiktok">TikTok Short</span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Co-Pilot */}
          <div className="panel-card highlight-yellow bento-item-span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              
              <BotIcon size={28} />
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', marginTop: '12px', fontFamily: 'var(--font-title)' }}>AI Assistant</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: '1.6' }}>
                Generate high-retention titles, outline hooks, SEO descriptions, and full-length script concepts in seconds.
              </p>
            </div>
            <div style={{ marginTop: '24px', background: 'white', padding: '12px', border: '2px solid var(--border-color)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Prompt: "Give me 5 hooks for coding video"
            </div>
          </div>

          {/* Card 3: Brand Deals */}
          <div className="panel-card highlight-lavender bento-item-span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              
              <BriefcaseIcon size={28} />
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', marginTop: '12px', fontFamily: 'var(--font-title)' }}>Brand Deals CRM</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: '1.6' }}>
                Manage sponsors, campaign deliverables, pricing contracts, invoice status, and due dates effortlessly.
              </p>
            </div>
            <div style={{ marginTop: '24px', background: 'white', padding: '12px', border: '2px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>Nike Campaign</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--yellow)', fontSize: '0.75rem', fontWeight: '800' }}>$2,500</span>
            </div>
          </div>

          {/* Card 4: Finance Tracker */}
          <div className="panel-card highlight-mint bento-item-span-8" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              
              <WalletIcon size={28} />
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px', marginTop: '12px', fontFamily: 'var(--font-title)' }}>Finance & Revenue Desk</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', lineHeight: '1.6' }}>
                Log AdSense, brand sponsorships, affiliate sales, and merge with monthly expense tracking. Know your profit margins instantly with clear bento visual statistics.
              </p>
            </div>
            <div style={{ marginTop: '24px', background: 'white', padding: '16px', border: '2px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800' }}>Monthly Profit Margin</span>
              <span className="amount-positive">+Rs. 1,24,300</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        borderTop: 'var(--border-width) solid var(--border-color)', 
        padding: '40px', 
        backgroundColor: 'var(--bg-sidebar)',
        textAlign: 'center',
        fontWeight: '700'
      }}>
        <p>Built by Pavithra</p>
      </footer>
    </div>
  );
}
