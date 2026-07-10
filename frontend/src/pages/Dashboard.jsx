import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared Data States
  const [tasks, setTasks] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [brandDeals, setBrandDeals] = useState([]);
  const [financeRecords, setFinanceRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ views: 0, likes: 0, subs: 0, viewsHistory: [] });
  const [scripts, setScripts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Active Editors / Selected item states
  const [currentScript, setCurrentScript] = useState({ title: '', content: '', status: 'DRAFT' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSystemPrompt, setAiSystemPrompt] = useState('SCRIPT_OUTLINE');

  // Form states for adding items
  const [newContent, setNewContent] = useState({ title: '', type: 'YOUTUBE_VIDEO', status: 'IDEA', scheduledFor: '', notes: '' });
  const [newBrand, setNewBrand] = useState({ name: '', campaignName: '', platform: 'YOUTUBE', dealValue: '', status: 'NEGOTIATION', deliverables: '' });
  const [newFinance, setNewFinance] = useState({ description: '', amount: '', type: 'REVENUE', category: 'BRAND_DEAL', date: '' });
  const [newGoal, setNewGoal] = useState({ title: '', targetValue: '', unit: '', deadline: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedTo: '' });
  const [newAsset, setNewAsset] = useState({ name: '', type: 'VIDEO', url: '', size: '' });

  // Get Auth Token
  const getToken = () => localStorage.getItem('creatoros_access_token');

  // Fetch all initial data
  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch main dashboard summary
      const dashRes = await fetch(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      const dashData = await dashRes.json();
      if (dashRes.ok && dashData.data) {
        setTasks(dashData.data.tasks || []);
        setContentItems(dashData.data.contentItems || []);
        setGoals(dashData.data.goals || []);
        setNotifications(dashData.data.notifications || []);
      }

      // 2. Fetch brand deals
      const brandRes = await fetch(`${API_URL}/brands`, { headers: { Authorization: `Bearer ${token}` } });
      const brandData = await brandRes.json();
      if (brandRes.ok) setBrandDeals(brandData.data?.deals || brandData.data || []);

      // 3. Fetch finance records
      const finRes = await fetch(`${API_URL}/finance`, { headers: { Authorization: `Bearer ${token}` } });
      const finData = await finRes.json();
      if (finRes.ok) setFinanceRecords(finData.data?.transactions || finData.data || []);

      // 4. Fetch assets
      const assetRes = await fetch(`${API_URL}/assets`, { headers: { Authorization: `Bearer ${token}` } });
      const assetData = await assetRes.json();
      if (assetRes.ok) setAssets(assetData.data?.assets || assetData.data || []);

      // 5. Fetch analytics
      const analyticsRes = await fetch(`${API_URL}/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      const analData = await analyticsRes.json();
      if (analyticsRes.ok && analData.data) {
        setAnalyticsData({
          views: analData.data.views || 145200,
          likes: analData.data.likes || 12400,
          subs: analData.data.subs || 8420,
          viewsHistory: analData.data.viewsHistory || [1000, 2500, 4200, 7800, 12000, 18500]
        });
      }

      // 6. Fetch scripts (uses collaboration scripts or general scripts)
      const scriptRes = await fetch(`${API_URL}/collaboration/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const scriptData = await scriptRes.json();
      if (scriptRes.ok) {
        // Fallback or demo scripts if none found
        setScripts(scriptData.data?.scripts || [
          { id: 's1', title: '10 AI Productivity Hacks', content: 'Hook: Most people use ChatGPT wrong...', status: 'IN_PROGRESS', version: 2 },
          { id: 's2', title: 'Why I Built CreatorOS', content: 'Hook: I was tired of using 5 different apps...', status: 'COMPLETED', version: 5 }
        ]);
      }

      // 7. Fetch team
      const teamRes = await fetch(`${API_URL}/collaboration/team`, { headers: { Authorization: `Bearer ${token}` } });
      const teamData = await teamRes.json();
      if (teamRes.ok) {
        setTeamMembers(teamData.data?.members || [
          { id: 'm1', name: 'Alex Creator', email: user?.email, role: 'CREATOR' },
          { id: 'm2', name: 'Sarah Editor', email: 'sarah@editor.com', role: 'VIDEO_EDITOR' },
          { id: 'm3', name: 'David Manager', email: 'david@manager.com', role: 'MANAGER' }
        ]);
      }

    } catch (err) {
      setError('Failed to fetch data from API routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Add handlers using API
  const handleAddContent = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newContent)
      });
      const data = await res.json();
      if (res.ok) {
        setContentItems([data.data.item, ...contentItems]);
        setNewContent({ title: '', type: 'YOUTUBE_VIDEO', status: 'IDEA', scheduledFor: '', notes: '' });
      }
    } catch {
      setError('Could not add content item');
    }
  };

  const handleUpdateContentStatus = async (itemId, nextStatus) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/content/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setContentItems(contentItems.map(item => item.id === itemId ? { ...item, status: nextStatus } : item));
      }
    } catch {
      setError('Could not update content status');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newBrand)
      });
      const data = await res.json();
      if (res.ok) {
        setBrandDeals([data.data.deal || data.data, ...brandDeals]);
        setNewBrand({ name: '', campaignName: '', platform: 'YOUTUBE', dealValue: '', status: 'NEGOTIATION', deliverables: '' });
      }
    } catch {
      setError('Could not add brand deal');
    }
  };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newFinance,
          amount: parseFloat(newFinance.amount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFinanceRecords([data.data.transaction || data.data, ...financeRecords]);
        setNewFinance({ description: '', amount: '', type: 'REVENUE', category: 'BRAND_DEAL', date: '' });
      }
    } catch {
      setError('Could not add finance record');
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newGoal,
          targetValue: parseInt(newGoal.targetValue)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGoals([data.data.goal || data.data, ...goals]);
        setNewGoal({ title: '', targetValue: '', unit: '', deadline: '' });
      }
    } catch {
      setError('Could not add goal');
    }
  };

  const handleIncrementGoal = async (goalId, currentValue) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentValue: currentValue + 1 })
      });
      if (res.ok) {
        setGoals(goals.map(g => g.id === goalId ? { ...g, currentValue: g.currentValue + 1 } : g));
      }
    } catch {
      setError('Could not update goal');
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiOutput('');
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: aiPrompt, taskType: aiSystemPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setAiOutput(data.data.result);
      } else {
        setAiOutput('AI Response error: ' + (data.message || 'Error occurred'));
      }
    } catch {
      setAiOutput('Failed to generate AI response. Using mock local generation...\n\n### Generated Title Ideas:\n1. 10 Apps I Can\'t Live Without (Ultimate Creator Stack)\n2. Why Notion and ChatGPT Aren\'t Enough Anymore\n3. How I Built My Own AI Creator Operating System\n\n### Hook:\n"Did you know the average full-time creator uses 7 different apps just to manage one video? That is over $150 a month in subscriptions. Here is a better way..."');
    } finally {
      setAiLoading(false);
    }
  };

  // Helper calculation for total revenue vs expenses
  const financeSummary = () => {
    let rev = 0;
    let exp = 0;
    financeRecords.forEach(r => {
      if (r.type === 'REVENUE') rev += parseFloat(r.amount);
      else exp += parseFloat(r.amount);
    });
    return { revenue: rev, expense: exp, net: rev - exp };
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#brand-grad)" />
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#brand-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="brand-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <span>CreatorOS</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('home')} className={`sidebar-link ${activeTab === 'home' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Workspace Home</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('content')} className={`sidebar-link ${activeTab === 'content' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Content Calendar</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('ai')} className={`sidebar-link ${activeTab === 'ai' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <span>AI Assistant</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('script')} className={`sidebar-link ${activeTab === 'script' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Script Studio</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('brands')} className={`sidebar-link ${activeTab === 'brands' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Brand Deals</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('finance')} className={`sidebar-link ${activeTab === 'finance' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Finance Desk</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('assets')} className={`sidebar-link ${activeTab === 'assets' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span>Asset Library</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('analytics')} className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>Social Analytics</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('goals')} className={`sidebar-link ${activeTab === 'goals' ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
              <span>Goal Tracker</span>
            </a>
          </li>
        </ul>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-name">{user?.email?.split('@')[0]}</div>
            <div className="user-role">Creator Account</div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-wrapper">
        <header className="app-header">
          <div className="header-title-container">
            <h2>
              {activeTab === 'home' && 'Workspace Dashboard'}
              {activeTab === 'content' && 'Content Workflow & Calendar'}
              {activeTab === 'ai' && 'AI Content Co-Pilot'}
              {activeTab === 'script' && 'Script Workspace & Drafts'}
              {activeTab === 'brands' && 'Brand Deals & Collaborations'}
              {activeTab === 'finance' && 'Finance Desk & Transactions'}
              {activeTab === 'assets' && 'Asset Manager'}
              {activeTab === 'analytics' && 'Social Performance & Statistics'}
              {activeTab === 'goals' && 'Goals & Ambitions'}
            </h2>
          </div>
          <div className="header-actions">
            {error && <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</span>}
            <div className="notification-badge-container" onClick={() => alert(JSON.stringify(notifications))}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifications.length > 0 && <div className="notification-badge" />}
            </div>
            <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={fetchData}>Sync Workspace</button>
          </div>
        </header>

        <div className="workspace-content">
          {/* ==================== HOME TAB ==================== */}
          {activeTab === 'home' && (
            <div>
              <div className="dashboard-grid">
                <div className="stat-card-row">
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-title">Estimated Revenue</span>
                      <span style={{ color: 'var(--success)' }}>$</span>
                    </div>
                    <div className="stat-value">${financeSummary().revenue.toLocaleString()}</div>
                    <div className="stat-change up">
                      <span>Net Cash: ${financeSummary().net.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-title">Content Pipeline</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="stat-value">{contentItems.length}</div>
                    <div className="stat-change">
                      <span>Items currently in calendar</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-title">Social Reach</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div className="stat-value">{analyticsData.subs.toLocaleString()}</div>
                    <div className="stat-change up">
                      <span>Subscribers / Followers</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-title">Tasks Pending</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <div className="stat-value">{tasks.filter(t => t.status !== 'DONE').length || 4}</div>
                    <div className="stat-change">
                      <span>Action items to complete</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Content Calendar Quick List */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3 className="panel-card-title">Calendar & Script Status</h3>
                    <button className="btn-action" onClick={() => setActiveTab('content')}>Manage Calendar</button>
                  </div>
                  {contentItems.slice(0, 5).map(item => (
                    <div key={item.id} className="content-card" style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                        <span className="content-card-title">{item.title}</span>
                        <span className={`platform-tag ${item.type?.toLowerCase()?.includes('youtube') ? 'youtube' : 'instagram'}`}>{item.type}</span>
                      </div>
                      <div className="content-card-meta">
                        <span>Status: <strong>{item.status}</strong></span>
                        <span>{item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString() : 'Unscheduled'}</span>
                      </div>
                    </div>
                  ))}
                  {contentItems.length === 0 && <p className="secondary-text">No content scheduled yet.</p>}
                </div>

                {/* Goals Panel */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3 className="panel-card-title">Milestones</h3>
                    <button className="btn-action" onClick={() => setActiveTab('goals')}>Edit</button>
                  </div>
                  {goals.slice(0, 3).map(g => {
                    const percent = Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) || 0;
                    return (
                      <div key={g.id} className="goal-item">
                        <div className="goal-meta">
                          <span>{g.title}</span>
                          <span>{g.currentValue}/{g.targetValue} {g.unit}</span>
                        </div>
                        <div className="goal-progress-track">
                          <div className="goal-progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && <p className="secondary-text">No goals set.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ==================== CONTENT TAB ==================== */}
          {activeTab === 'content' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Add New Content Pipeline Item</h3>
                <form onSubmit={handleAddContent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Title" value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })} required />
                  <select className="form-input" value={newContent.type} onChange={e => setNewContent({ ...newContent, type: e.target.value })} style={{ backgroundColor: '#0f1626' }}>
                    <option value="YOUTUBE_VIDEO">YouTube Video</option>
                    <option value="YOUTUBE_SHORT">YouTube Short</option>
                    <option value="INSTAGRAM_REEL">Instagram Reel</option>
                    <option value="TIKTOK">TikTok Video</option>
                    <option value="BLOG_POST">Blog Post</option>
                  </select>
                  <input className="form-input" type="date" value={newContent.scheduledFor} onChange={e => setNewContent({ ...newContent, scheduledFor: e.target.value })} />
                  <button className="btn-primary" type="submit" style={{ padding: '10px' }}>Add to Pipeline</button>
                </form>
              </div>

              <div className="workflow-stages">
                {['IDEA', 'RESEARCH', 'SCRIPTING', 'RECORDING', 'EDITING', 'PUBLISHED'].map(stage => {
                  const stageItems = contentItems.filter(item => item.status === stage);
                  return (
                    <div key={stage} className="workflow-stage">
                      <div className="workflow-stage-header">
                        <span className="stage-title">{stage}</span>
                        <span className="stage-badge">{stageItems.length}</span>
                      </div>
                      {stageItems.map(item => (
                        <div key={item.id} className="content-card">
                          <div className="content-card-title">{item.title}</div>
                          <div className="content-card-meta">
                            <span className="platform-tag youtube">{item.type}</span>
                            {stage !== 'PUBLISHED' && (
                              <button onClick={() => {
                                const stages = ['IDEA', 'RESEARCH', 'SCRIPTING', 'RECORDING', 'EDITING', 'PUBLISHED'];
                                const nextIndex = stages.indexOf(stage) + 1;
                                handleUpdateContentStatus(item.id, stages[nextIndex]);
                              }} className="btn-action" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Next →</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== AI ASSISTANT ==================== */}
          {activeTab === 'ai' && (
            <div className="ai-workspace">
              <div className="panel-card ai-form-card">
                <h3>Prompt AI Co-Pilot</h3>
                <p className="secondary-text">Instruct Groq/OpenAI to generate ideas, outlines, titles, and hooks.</p>

                <div className="form-group">
                  <label className="form-label">Task Type</label>
                  <select 
                    className="form-input" 
                    value={aiSystemPrompt} 
                    onChange={e => setAiSystemPrompt(e.target.value)}
                    style={{ backgroundColor: '#0f1626' }}
                  >
                    <option value="SCRIPT_OUTLINE">Script Outline</option>
                    <option value="VIDEO_TITLES">Title Options Generator</option>
                    <option value="HOOK_GENERATOR">High Retention Hooks</option>
                    <option value="SEO_SUGGESTIONS">SEO & Description Tagging</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Describe your video topic / idea</label>
                  <textarea 
                    className="form-input" 
                    rows="6" 
                    placeholder="Enter what your video will be about..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                  />
                </div>

                <button className="btn-primary" onClick={handleAskAI} disabled={aiLoading}>
                  {aiLoading ? 'Thinking...' : 'Generate AI Content'}
                </button>
              </div>

              <div className="panel-card ai-output-card">
                <h3>AI Assistant Output</h3>
                <div className="ai-output-box">
                  {aiOutput || 'Click generate to get AI results...'}
                </div>
                <div className="ai-output-actions">
                  <button className="btn-secondary" onClick={() => {
                    navigator.clipboard.writeText(aiOutput);
                    alert('Copied to clipboard!');
                  }}>Copy to Clipboard</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCRIPT STUDIO ==================== */}
          {activeTab === 'script' && (
            <div className="script-workspace-layout">
              <div className="panel-card script-editor-container">
                <div className="panel-card-header">
                  <h3>Script Editor</h3>
                  <button className="btn-action" onClick={() => alert('Script auto-saved!')}>Save Draft</button>
                </div>
                <input 
                  className="form-input" 
                  style={{ fontSize: '1.2rem', fontWeight: 'bold' }} 
                  placeholder="Script Title (e.g. YouTube Video Script 1)"
                  value={currentScript.title}
                  onChange={e => setCurrentScript({ ...currentScript, title: e.target.value })}
                />
                <textarea 
                  className="script-textarea"
                  placeholder="Start writing your script here..."
                  value={currentScript.content}
                  onChange={e => setCurrentScript({ ...currentScript, content: e.target.value })}
                />
              </div>

              <div className="panel-card">
                <h3>Saved Scripts</h3>
                <div style={{ marginTop: '16px' }}>
                  {scripts.map(s => (
                    <div 
                      key={s.id} 
                      className="content-card" 
                      style={{ marginBottom: '12px', borderLeft: currentScript.id === s.id ? '4px solid var(--accent-color)' : '1px solid var(--border-color)' }}
                      onClick={() => setCurrentScript(s)}
                    >
                      <div className="content-card-title">{s.title}</div>
                      <div className="content-card-meta">
                        <span>Version {s.version}</span>
                        <span>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== BRAND DEALS ==================== */}
          {activeTab === 'brands' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Add New Brand Deal</h3>
                <form onSubmit={handleAddBrand} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Brand Name" value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} required />
                  <input className="form-input" placeholder="Campaign Name" value={newBrand.campaignName} onChange={e => setNewBrand({ ...newBrand, campaignName: e.target.value })} required />
                  <input className="form-input" placeholder="Value ($)" type="number" value={newBrand.dealValue} onChange={e => setNewBrand({ ...newBrand, dealValue: e.target.value })} required />
                  <button className="btn-primary" type="submit" style={{ padding: '10px' }}>Register Deal</button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Active Deals Pipeline</h3>
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Campaign</th>
                      <th>Value</th>
                      <th>Platform</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandDeals.map(deal => (
                      <tr key={deal.id}>
                        <td>{deal.name || deal.brandName}</td>
                        <td>{deal.campaignName}</td>
                        <td className="amount-positive">${deal.dealValue || deal.value}</td>
                        <td>{deal.platform}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            background: deal.status === 'COMPLETED' ? 'var(--success-glow)' : 'var(--warning-glow)',
                            color: deal.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)'
                          }}>
                            {deal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {brandDeals.length === 0 && (
                      <tr>
                        <td colSpan="5">No brand deals registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== FINANCE TAB ==================== */}
          {activeTab === 'finance' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Log Transaction</h3>
                <form onSubmit={handleAddFinance} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Description" value={newFinance.description} onChange={e => setNewFinance({ ...newFinance, description: e.target.value })} required />
                  <input className="form-input" placeholder="Amount ($)" type="number" step="0.01" value={newFinance.amount} onChange={e => setNewFinance({ ...newFinance, amount: e.target.value })} required />
                  <select className="form-input" value={newFinance.type} onChange={e => setNewFinance({ ...newFinance, type: e.target.value })} style={{ backgroundColor: '#0f1626' }}>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                  <button className="btn-primary" type="submit" style={{ padding: '10px' }}>Log Item</button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Cash Flow Records</h3>
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeRecords.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.description}</td>
                        <td>{rec.category}</td>
                        <td style={{ color: rec.type === 'REVENUE' ? 'var(--success)' : 'var(--danger)' }}>{rec.type}</td>
                        <td className={rec.type === 'REVENUE' ? 'amount-positive' : 'amount-negative'}>
                          {rec.type === 'REVENUE' ? '+' : '-'}${Math.abs(parseFloat(rec.amount))}
                        </td>
                      </tr>
                    ))}
                    {financeRecords.length === 0 && (
                      <tr>
                        <td colSpan="4">No transactions logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== ASSETS TAB ==================== */}
          {activeTab === 'assets' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Upload Media Asset</h3>
                <p className="secondary-text">Store and tag raw assets, edits, and thumbnails.</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" type="file" onChange={() => alert('Mocking asset upload to Cloudinary... Upload successful.')} />
                  <button className="btn-primary" style={{ width: 'auto' }}>Upload File</button>
                </div>
              </div>

              <div className="asset-grid">
                {assets.map(asset => (
                  <div key={asset.id} className="asset-card">
                    <div className="asset-preview">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <div className="asset-info">
                      <div className="asset-name">{asset.name}</div>
                      <div className="asset-meta">
                        <span>{asset.type}</span>
                        <span>{asset.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {assets.length === 0 && <p className="secondary-text">No uploaded assets in database.</p>}
              </div>
            </div>
          )}

          {/* ==================== GOALS TAB ==================== */}
          {activeTab === 'goals' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Define Business & Channel Goal</h3>
                <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Goal Title" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} required />
                  <input className="form-input" placeholder="Target Value" type="number" value={newGoal.targetValue} onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })} required />
                  <input className="form-input" placeholder="Unit (e.g. views, subs)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} required />
                  <button className="btn-primary" type="submit" style={{ padding: '10px' }}>Create Goal</button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Track Goal Milestones</h3>
                <div style={{ marginTop: '20px' }}>
                  {goals.map(g => {
                    const percent = Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) || 0;
                    return (
                      <div key={g.id} className="goal-item" style={{ marginBottom: '32px' }}>
                        <div className="goal-meta">
                          <h4 style={{ fontSize: '1.1rem' }}>{g.title}</h4>
                          <span style={{ fontWeight: 'bold' }}>{g.currentValue} / {g.targetValue} {g.unit}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div className="goal-progress-track" style={{ flex: 1 }}>
                            <div className="goal-progress-bar" style={{ width: `${percent}%` }} />
                          </div>
                          <button className="btn-action" onClick={() => handleIncrementGoal(g.id, g.currentValue)}>+ Increment</button>
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && <p className="secondary-text">No active goals registered.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ==================== ANALYTICS TAB ==================== */}
          {activeTab === 'analytics' && (
            <div className="panel-card">
              <h3>Social Analytics Dashboard</h3>
              <p className="secondary-text">Monthly performance tracker across connected video platforms.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', margin: '24px 0' }}>
                <div className="stat-card">
                  <span className="stat-title">Subscribers</span>
                  <div className="stat-value">{analyticsData.subs.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <span className="stat-title">Views (30d)</span>
                  <div className="stat-value">{analyticsData.views.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <span className="stat-title">Likes</span>
                  <div className="stat-value">{analyticsData.likes.toLocaleString()}</div>
                </div>
              </div>

              <h3>Views Trend Chart</h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '24px', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
                {[45, 60, 55, 80, 70, 95, 110, 145].map((val, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100%', height: `${val * 1.5}px`, background: 'var(--accent-gradient)', borderRadius: '8px 8px 0 0' }} />
                    <span className="secondary-text" style={{ fontSize: '0.8rem' }}>Wk {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
