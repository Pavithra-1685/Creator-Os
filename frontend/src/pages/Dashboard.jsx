import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
  BarChartIcon,
  BellIcon,
  BotIcon,
  BriefcaseIcon,
  CalendarIcon,
  FileTextIcon,
  HandshakeIcon,
  ImageIcon,
  LogOutIcon,
  PlusIcon,
  ScissorsIcon,
  SearchIcon,
  TargetIcon,
  UsersIcon,
  VideoIcon,
  WalletIcon,
} from '../components/Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const notificationIconMap = {
  PUBLISH_REMINDER: VideoIcon,
  PAYMENT_REMINDER: WalletIcon,
  BRAND_DEAL_DEADLINE: HandshakeIcon,
  GOAL_ACHIEVED: TargetIcon,
  AI_SUGGESTION: BotIcon,
  SYSTEM: BellIcon,
  TEAM_MENTION: UsersIcon,
  EDITING_DEADLINE: ScissorsIcon,
};

const contentStages = ['IDEA', 'RESEARCH', 'SCRIPT', 'RECORDING', 'EDITING', 'THUMBNAIL', 'REVIEW', 'SCHEDULED', 'PUBLISHED'];

const formatCompactNumber = (value = 0) => {
  return Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
};

const formatBytes = (bytes) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getAssetTypeFromFile = (file) => {
  if (!file?.type) return 'OTHER';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  if (file.type.includes('pdf') || file.type.includes('document')) return 'DOCUMENT';
  return 'OTHER';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const socketRef = useRef(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [brandDeals, setBrandDeals] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financeSummary, setFinanceSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, monthlyData: [] });
  const [assets, setAssets] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ views: 0, likes: 0, subscribers: 0, growth: [] });
  const [scripts, setScripts] = useState([]);
  const [assetFile, setAssetFile] = useState(null);

  // Input states for adding new items
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('content'); // content, brand, finance, goal

  const [newContent, setNewContent] = useState({ title: '', type: 'YOUTUBE_VIDEO', status: 'IDEA', scheduledFor: '', notes: '' });
  const [newBrand, setNewBrand] = useState({ name: '', campaignName: '', platform: 'YOUTUBE', dealValue: '', status: 'NEGOTIATING', deliverables: '' });
  const [newFinance, setNewFinance] = useState({ description: '', amount: '', type: 'REVENUE', category: 'OTHER', date: '' });
  const [newGoal, setNewGoal] = useState({ title: '', type: 'UPLOADS', targetValue: '', unit: '', deadline: '' });

  // AI Prompt Co-Pilot Workspace States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSystemPrompt, setAiSystemPrompt] = useState('script');

  // Script Workspace States
  const [currentScript, setCurrentScript] = useState({
    id: '',
    title: '',
    content: '',
    status: 'DRAFT',
    version: 1
  });

  const getToken = () => localStorage.getItem('creatoros_access_token');

  const readJson = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Request failed with ${response.status}`);
    }
    return data;
  };

  // Fetch all data from the API so dashboard state mirrors the database.
  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      logout();
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        dashData,
        contentData,
        goalsData,
        campaignsData,
        revenueData,
        expenseData,
        financeSummaryData,
        assetData,
        notificationData,
        analyticsOverviewData,
        analyticsGrowthData,
        scriptData,
      ] = await Promise.all([
        fetch(`${API_URL}/dashboard`, { headers }).then(readJson),
        fetch(`${API_URL}/content`, { headers }).then(readJson),
        fetch(`${API_URL}/goals`, { headers }).then(readJson),
        fetch(`${API_URL}/brands/campaigns`, { headers }).then(readJson),
        fetch(`${API_URL}/finance/revenue`, { headers }).then(readJson),
        fetch(`${API_URL}/finance/expenses`, { headers }).then(readJson),
        fetch(`${API_URL}/finance/summary`, { headers }).then(readJson),
        fetch(`${API_URL}/assets`, { headers }).then(readJson),
        fetch(`${API_URL}/collaboration/notifications`, { headers }).then(readJson),
        fetch(`${API_URL}/analytics/overview`, { headers }).then(readJson),
        fetch(`${API_URL}/analytics/growth?months=8`, { headers }).then(readJson),
        fetch(`${API_URL}/collaboration/scripts`, { headers }).then(readJson),
      ]);

      setTasks(dashData.data?.tasks || []);
      setContentItems(contentData.data?.items || []);
      setGoals(goalsData.data?.goals || []);
      setNotifications(notificationData.data?.items || []);
      setBrandDeals(campaignsData.data?.items || []);
      setRevenues(revenueData.data?.items || []);
      setExpenses(expenseData.data?.items || []);
      setFinanceSummary(financeSummaryData.data?.summary || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, monthlyData: [] });
      setAssets(assetData.data?.items || []);

      const currentStats = analyticsOverviewData.data?.stats?.current || {};
      setAnalyticsData({
        views: currentStats.views || 0,
        likes: currentStats.likes || 0,
        subscribers: currentStats.subscribers || 0,
        growth: analyticsGrowthData.data?.growth || [],
      });

      const scriptItems = scriptData.data?.items || [];
      setScripts(scriptItems);
      if (scriptItems.length > 0) {
        setCurrentScript(scriptItems[0]);
      }
    } catch (err) {
      setError(err.message || 'Some data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Establish WebSocket Connection
    const socketUrl = API_URL.replace('/api/v1', ''); // E.g., http://localhost:4000
    const socket = io(socketUrl);
    socketRef.current = socket;

    if (user?.id) {
      socket.emit('join_room', user.id);
    }

    socket.on('notification_received', (newNotif) => {
      // Prepend the new notification to state
      setNotifications((prev) => [newNotif, ...prev]);
    });

    socket.on('dashboard_data_updated', () => {
      // Trigger a silent reload of data when backend triggers update events
      const token = getToken();
      if (token) {
        const headers = { Authorization: `Bearer ${token}` };
        // Silently update dashboard datasets in background without loading spinner
        Promise.all([
          fetch(`${API_URL}/dashboard`, { headers }).then(readJson),
          fetch(`${API_URL}/content`, { headers }).then(readJson),
          fetch(`${API_URL}/goals`, { headers }).then(readJson),
          fetch(`${API_URL}/brands/campaigns`, { headers }).then(readJson),
          fetch(`${API_URL}/finance/revenue`, { headers }).then(readJson),
          fetch(`${API_URL}/finance/expenses`, { headers }).then(readJson),
          fetch(`${API_URL}/finance/summary`, { headers }).then(readJson),
          fetch(`${API_URL}/assets`, { headers }).then(readJson),
          fetch(`${API_URL}/collaboration/notifications`, { headers }).then(readJson),
          fetch(`${API_URL}/analytics/overview`, { headers }).then(readJson),
          fetch(`${API_URL}/collaboration/scripts`, { headers }).then(readJson),
        ]).then(([
          dashData,
          contentData,
          goalsData,
          campaignsData,
          revenueData,
          expenseData,
          financeSummaryData,
          assetData,
          notificationData,
          analyticsOverviewData,
          scriptData
        ]) => {
          setTasks(dashData.data?.tasks || []);
          setContentItems(contentData.data?.items || []);
          setGoals(goalsData.data?.goals || []);
          setNotifications(notificationData.data?.items || []);
          setBrandDeals(campaignsData.data?.items || []);
          setRevenues(revenueData.data?.items || []);
          setExpenses(expenseData.data?.items || []);
          setFinanceSummary(financeSummaryData.data?.summary || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, monthlyData: [] });
          setAssets(assetData.data?.items || []);
          const currentStats = analyticsOverviewData.data?.stats?.current || {};
          setAnalyticsData(prev => ({
            ...prev,
            views: currentStats.views || 0,
            likes: currentStats.likes || 0,
            subscribers: currentStats.subscribers || 0,
          }));
          setScripts(scriptData.data?.items || []);
        }).catch(err => console.error('Silent data sync error:', err));
      }
    });

    socket.on('script_updated', (data) => {
      // If we are currently viewing this script, update it in real-time
      setCurrentScript((prev) => {
        if (prev && prev.id === data.scriptId) {
          return {
            ...prev,
            content: data.content,
            title: data.title || prev.title,
          };
        }
        return prev;
      });
      // Also update it in scripts list
      setScripts((prev) =>
        prev.map((s) =>
          s.id === data.scriptId
            ? { ...s, content: data.content, title: data.title || s.title }
            : s
        )
      );
    });

    return () => {
      if (user?.id) {
        socket.emit('leave_room', user.id);
      }
      socket.disconnect();
    };
  }, [user?.id]);

  // Post new Content item
  const handleAddContent = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newContent)
      });
      await readJson(res);
      setNewContent({ title: '', type: 'YOUTUBE_VIDEO', status: 'IDEA', scheduledFor: '', notes: '' });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not add content item.');
    }
  };

  // Post new Brand Deal (creates brand + campaign)
  const handleAddBrand = async (e) => {
    e.preventDefault();
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      // Step 1: create the brand
      const brandRes = await fetch(`${API_URL}/brands/brands`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: newBrand.name })
      });
      const brandData = await readJson(brandRes);
      const brandId = brandData.data?.brand?.id;
      if (!brandId) throw new Error('Brand creation failed');

      // Step 2: create campaign under that brand
      const campaignRes = await fetch(`${API_URL}/brands/campaigns`, {
        method: 'POST', headers,
        body: JSON.stringify({ title: newBrand.campaignName, brandId, budget: parseFloat(newBrand.dealValue) || 0, status: 'ACTIVE' })
      });
      await readJson(campaignRes);
      setNewBrand({ name: '', campaignName: '', platform: 'YOUTUBE', dealValue: '', status: 'NEGOTIATING', deliverables: '' });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not add brand deal.');
    }
  };

  // Post new Finance Transaction
  const handleAddFinance = async (e) => {
    e.preventDefault();
    const token = getToken();
    const isRevenue = newFinance.type === 'REVENUE';
    const endpoint = isRevenue ? `${API_URL}/finance/revenue` : `${API_URL}/finance/expenses`;
    const payload = isRevenue
      ? { amount: parseFloat(newFinance.amount), source: newFinance.category || 'OTHER', description: newFinance.description, date: newFinance.date || new Date().toISOString() }
      : { amount: parseFloat(newFinance.amount), category: newFinance.category || 'OTHER', description: newFinance.description, date: newFinance.date || new Date().toISOString() };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      await readJson(res);
      setNewFinance({ description: '', amount: '', type: 'REVENUE', category: 'OTHER', date: '' });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not log transaction.');
    }
  };

  // Post new Goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newGoal, targetValue: parseFloat(newGoal.targetValue), deadline: newGoal.deadline || undefined })
      });
      await readJson(res);
      setNewGoal({ title: '', type: 'UPLOADS', targetValue: '', unit: '', deadline: '' });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not create goal.');
    }
  };

  // Update content status in Kanban board
  const handleUpdateContentStatus = async (itemId, nextStatus) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/content/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await readJson(res);
      setContentItems(contentItems.map(item => item.id === itemId ? data.data.item : item));
    } catch (err) {
      setError(err.message || 'Could not update content status.');
    }
  };

  // Increment Goal progress
  const handleIncrementGoal = async (goalId, currentVal) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/goals/${goalId}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ increment: 1 })
      });
      const data = await readJson(res);
      setGoals(goals.map(g => g.id === goalId ? data.data.goal : g));
    } catch (err) {
      setError(err.message || 'Could not update goal progress.');
    }
  };

  // Query AI Co-Pilot
  const handleAskAI = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiOutput('');
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: aiPrompt, type: aiSystemPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setAiOutput(data.data.result);
      } else {
        setAiOutput('AI Response error: ' + (data.message || 'Error occurred'));
      }
    } catch (err) {
      setAiOutput('');
      setError(err.message || 'Could not generate AI content.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!assetFile) {
      setError('Choose a file before uploading.');
      return;
    }

    const token = getToken();
    const formData = new FormData();
    formData.append('file', assetFile);
    formData.append('name', assetFile.name);
    formData.append('type', getAssetTypeFromFile(assetFile));

    try {
      const res = await fetch(`${API_URL}/assets/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      await readJson(res);
      setAssetFile(null);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not upload asset.');
    }
  };

  const handleSaveScript = async () => {
    const token = getToken();
    const isExisting = Boolean(currentScript.id);
    const endpoint = isExisting ? `${API_URL}/collaboration/scripts/${currentScript.id}` : `${API_URL}/collaboration/scripts`;

    try {
      const res = await fetch(endpoint, {
        method: isExisting ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: currentScript.title,
          content: currentScript.content,
          status: currentScript.status || 'DRAFT',
        }),
      });
      const data = await readJson(res);
      setCurrentScript(data.data.script);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Could not save script.');
    }
  };

  const handleScriptFieldChange = (field, value) => {
    const updated = { ...currentScript, [field]: value };
    setCurrentScript(updated);
    if (socketRef.current && user?.id) {
      socketRef.current.emit('edit_script', {
        userId: user.id,
        scriptId: currentScript.id,
        content: field === 'content' ? value : (currentScript.content || ''),
        title: field === 'title' ? value : (currentScript.title || ''),
      });
    }
  };

  const handleQuickAiSubmit = (e) => {
    e.preventDefault();
    setActiveTab('ai');
    handleAskAI();
  };

  // Get finance summary from real API data
  const getFinanceSummary = () => {
    return {
      revenue: financeSummary.totalRevenue || 0,
      expense: financeSummary.totalExpenses || 0,
      net: financeSummary.netProfit || 0,
    };
  };

  const getWeekDays = () => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay() || 7;
    monday.setDate(today.getDate() - day + 1);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  const getContentForDate = (date) => {
    return contentItems.filter((item) => {
      if (!item.scheduledFor) return false;
      const itemDate = new Date(item.scheduledFor);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF3E7F" stroke="#111111" strokeWidth="2" />
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>CreatorOS</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('home')} className={`sidebar-link ${activeTab === 'home' ? 'active' : ''}`}>
               <BarChartIcon size={18} />
               <span>Dashboard</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('content')} className={`sidebar-link ${activeTab === 'content' ? 'active' : ''}`}>
               <CalendarIcon size={18} />
               <span>Content Calendar</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('ai')} className={`sidebar-link ${activeTab === 'ai' ? 'active' : ''}`}>
               <BotIcon size={18} />
               <span>AI Assistant</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('brands')} className={`sidebar-link ${activeTab === 'brands' ? 'active' : ''}`}>
               <BriefcaseIcon size={18} />
               <span>Brand Deals</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('finance')} className={`sidebar-link ${activeTab === 'finance' ? 'active' : ''}`}>
              <WalletIcon size={18} />
              <span>Revenue & Expenses</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('assets')} className={`sidebar-link ${activeTab === 'assets' ? 'active' : ''}`}>
               <ImageIcon size={18} />
               <span>Assets</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('analytics')} className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}>
               <BarChartIcon size={18} />
               <span>Analytics</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('goals')} className={`sidebar-link ${activeTab === 'goals' ? 'active' : ''}`}>
               <TargetIcon size={18} />
               <span>Goals</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a onClick={() => setActiveTab('script')} className={`sidebar-link ${activeTab === 'script' ? 'active' : ''}`}>
               <FileTextIcon size={18} />
               <span>Script Workspace</span>
            </a>
          </li>
        </ul>

        <div className="sidebar-user" style={{ marginTop: '16px' }}>
          <div className="user-info">
            <div className="user-name">{user?.email?.split('@')[0] || 'Arjun'}</div>
            <div className="user-role">Creator Account</div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Log out">
            <LogOutIcon size={18} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-wrapper">
        <header className="app-header">
          <div className="search-input-container">
            <span className="search-icon"><SearchIcon size={18} /></span>
            <input 
              className="search-bar" 
              placeholder="Search content, analytics, deals..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button 
              className="btn-primary" 
              style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => {
                setModalType('content');
                setShowAddModal(true);
              }}
            >
              <PlusIcon size={18} />
               CREATE NEW
            </button>

            <div className="notification-bell" onClick={() => setActiveTab('home')}>
              <BellIcon size={20} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <div className="notification-bell-badge">
                  {notifications.filter(n => !n.isRead).length}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--pink-soft)', border: '2px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>A</div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>Hi, {user?.email?.split('@')[0] || 'Arjun'}!</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Creator</div>
              </div>
            </div>
          </div>
        </header>

        <div className="workspace-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="panel-card" style={{ marginBottom: '20px', fontWeight: '800' }}>
              Loading live workspace data...
            </div>
          )}

          {/* ==================== TABS: HOME ==================== */}
          {activeTab === 'home' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>Good morning, {user?.email?.split('@')[0] || 'Arjun'}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>Here's what's happening with your creator business today.</p>
                </div>
                <div style={{ background: 'white', border: '2.5px solid #111111', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '2px 2px 0px #111111' }}>
                   {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Bento Grid Stats */}
              <div className="dashboard-grid">
                <div className="stat-card-row">
                  <div className="stat-card highlight-pink">
                    <div className="stat-header">
                      <span className="stat-title">Total Revenue</span>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                    </div>
                    <div className="stat-value">Rs. {getFinanceSummary().revenue.toLocaleString('en-IN')}</div>
                    <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
                      Net: <span style={{ color: 'var(--pink-hot)' }}>Rs. {getFinanceSummary().net.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="stat-card highlight-yellow">
                    <div className="stat-header">
                      <span className="stat-title">Upcoming Posts</span>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><VideoIcon size={18} /></div>
                    </div>
                    <div className="stat-value">{contentItems.length}</div>
                    <div className="stat-change"><span>This Week</span></div>
                    <div className="goal-progress-track" style={{ marginTop: '10px', height: '8px' }}>
                      <div className="goal-progress-bar" style={{ width: `${Math.min(100, (contentItems.filter(c => c.status === 'SCHEDULED' || c.status === 'PUBLISHED').length / Math.max(contentItems.length, 1)) * 100)}%`, backgroundColor: 'var(--pink-hot)' }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '6px' }}>{contentItems.filter(c => c.status === 'SCHEDULED').length} Scheduled</div>
                  </div>

                  <div className="stat-card highlight-peach">
                    <div className="stat-header">
                      <span className="stat-title">Active Brand Deals</span>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BriefcaseIcon size={18} /></div>
                    </div>
                    <div className="stat-value">{brandDeals.filter(d => d.status === 'ACTIVE').length || brandDeals.length}</div>
                    <div className="stat-change"><span>In Progress</span></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--pink-hot)', marginTop: '8px' }}>
                      {brandDeals.filter(d => d.status === 'NEGOTIATING').length} Negotiating
                    </div>
                  </div>

                  <div className="stat-card highlight-lavender">
                    <div className="stat-header">
                      <span className="stat-title">Goals Progress</span>
                      <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><TargetIcon size={18} /></div>
                    </div>
                    <div className="stat-value">{goals.filter(g => g.isAchieved).length}/{goals.length}</div>
                    <div className="stat-change">
                      <span style={{ color: 'var(--pink-hot)' }}>Up {goals.length}</span> <span style={{ color: 'var(--text-secondary)' }}>active goals</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Center Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Content Calendar Week Strip */}
                <div className="panel-card">
                  <div className="panel-card-header" style={{ borderBottom: 'none', marginBottom: '10px' }}>
                    <h3 className="panel-card-title"> Content Calendar</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 12px' }}>WEEK</button>
                      <button className="btn-secondary" style={{ padding: '6px 12px' }}>MONTH</button>
                      <button className="btn-secondary" style={{ padding: '6px 12px' }}>AGENDA</button>
                    </div>
                  </div>

                  <div className="calendar-grid">
                    {getWeekDays().map((day) => (
                      <div key={day.toISOString()} className={`calendar-cell ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                        <div className="calendar-date-number">
                          {day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                        </div>
                        {getContentForDate(day).slice(0, 3).map(item => (
                          <div key={item.id} className="platform-tag youtube" style={{ fontSize: '0.65rem', padding: '2px' }}>
                            {item.title}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '16px', borderStyle: 'dashed' }} onClick={() => { setModalType('content'); setShowAddModal(true); }}>
                    + ADD CONTENT
                  </button>
                </div>

                {/* Notifications Widget */}
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3 className="panel-card-title"><BellIcon size={20} /> Notifications</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>No notifications yet.</div>
                    ) : notifications.map((n, idx) => {
                      const bg = ['var(--yellow)', 'var(--mint)', 'var(--pink-soft)', 'var(--lavender)'];
                      const NotificationIcon = notificationIconMap[n.type] || BellIcon;
                      return (
                        <div key={n.id || idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: bg[idx % bg.length], border: '2px solid #111111', padding: '6px', borderRadius: '8px', flexShrink: 0, display: 'flex' }}><NotificationIcon size={16} /></div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{n.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#555555' }}>{n.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Bento Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '24px' }}>
                {/* Recent Content */}
                <div className="panel-card">
                  <h3 className="icon-heading" style={{ marginBottom: '16px', fontSize: '1.2rem' }}><VideoIcon size={20} /> Recent Content</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contentItems.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>No content yet. Add your first item.</div>
                    ) : contentItems.slice(0, 3).map((item, idx) => {
                      const colors = ['var(--lavender)', 'var(--yellow)', 'var(--mint)'];
                      return (
                        <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '50px', height: '40px', background: colors[idx % colors.length], border: '2px solid #111111', borderRadius: '4px', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{item.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#555555' }}>{item.type?.replace('_', ' ')} / {item.status}</div>
                            </div>
                          </div>
                          <span style={{ background: 'var(--pink-soft)', border: '1.5px solid #111', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800' }}>{item.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue Overview chart block */}
                <div className="panel-card">
                  <h3 className="icon-heading" style={{ marginBottom: '16px', fontSize: '1.2rem' }}><BarChartIcon size={20} /> Revenue Overview</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '12px', paddingBottom: '10px', borderBottom: '2px solid #111111' }}>
                    {(financeSummary.monthlyData || []).slice(-5).map(month => {
                      const maxRevenue = Math.max(...(financeSummary.monthlyData || []).map(m => m.revenue || 0), 1);
                      const height = Math.max(8, Math.round(((month.revenue || 0) / maxRevenue) * 100));
                      return (
                        <div key={month.month} title={`${month.month}: Rs. ${(month.revenue || 0).toLocaleString('en-IN')}`} style={{ flex: 1, height: `${height}%`, background: height >= 90 ? 'var(--pink-primary)' : 'var(--pink-soft)', border: '2px solid #111111', borderRadius: '4px 4px 0 0' }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', marginTop: '6px' }}>
                    {(financeSummary.monthlyData || []).slice(-5).map(month => (
                      <span key={month.month}>{month.month?.split(' ')[0]}</span>
                    ))}
                  </div>
                </div>

                {/* AI Assistant Quick prompt widget */}
                <div className="panel-card highlight-pink">
                  <h3 className="icon-heading" style={{ marginBottom: '8px', fontSize: '1.2rem' }}><BotIcon size={20} /> AI Co-Pilot</h3>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555555', marginBottom: '16px' }}>
                    Need post ideas, titles, or hooks in seconds?
                  </p>
                  <form onSubmit={handleQuickAiSubmit}>
                    <input 
                      className="form-input" 
                      placeholder="Ask AI Assistant..." 
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      style={{ marginBottom: '12px' }}
                    />
                    <button className="btn-primary" type="submit" style={{ padding: '8px' }}>
                      Generate Outline
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TABS: CONTENT ==================== */}
          {activeTab === 'content' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.3rem' }}>Create Workflow Content</h3>
                <form onSubmit={handleAddContent} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Title" value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })} required />
                  <select className="form-input" value={newContent.type} onChange={e => setNewContent({ ...newContent, type: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="YOUTUBE_VIDEO">YouTube Video</option>
                    <option value="YOUTUBE_SHORT">YouTube Short</option>
                    <option value="INSTAGRAM_REEL">Instagram Reel</option>
                    <option value="TIKTOK">TikTok Video</option>
                  </select>
                  <select className="form-input" value={newContent.status} onChange={e => setNewContent({ ...newContent, status: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="IDEA">Idea</option>
                    <option value="RESEARCH">Research</option>
                    <option value="SCRIPT">Script</option>
                    <option value="RECORDING">Recording</option>
                    <option value="EDITING">Editing</option>
                    <option value="THUMBNAIL">Thumbnail</option>
                    <option value="REVIEW">Review</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                  <button className="btn-primary" type="submit" style={{ padding: '12px' }}>Add to Calendar</button>
                </form>
              </div>

              <div className="workflow-stages">
                {contentStages.map(stage => {
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
                                const nextIndex = contentStages.indexOf(stage) + 1;
                                handleUpdateContentStatus(item.id, contentStages[nextIndex]);
                              }} className="btn-action" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Next</button>
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

          {/* ==================== TABS: AI ASSISTANT ==================== */}
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
                    style={{ backgroundColor: 'white' }}
                  >
                    <option value="script">Script Outline</option>
                    <option value="title">Title Options Generator</option>
                    <option value="hook">High Retention Hooks</option>
                    <option value="seo">SEO & Description Tagging</option>
                    <option value="youtube_idea">YouTube Video Ideas</option>
                    <option value="reel_idea">Instagram Reels Ideas</option>
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
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => {
                    navigator.clipboard.writeText(aiOutput);
                    alert('Copied to clipboard!');
                  }}>Copy to Clipboard</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TABS: BRAND DEALS ==================== */}
          {activeTab === 'brands' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Add New Brand Deal</h3>
                <form onSubmit={handleAddBrand} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Brand Name" value={newBrand.name} onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} required />
                  <input className="form-input" placeholder="Campaign Name" value={newBrand.campaignName} onChange={e => setNewBrand({ ...newBrand, campaignName: e.target.value })} required />
                  <input className="form-input" placeholder="Value (Rs.)" type="number" value={newBrand.dealValue} onChange={e => setNewBrand({ ...newBrand, dealValue: e.target.value })} required />
                  <button className="btn-primary" type="submit" style={{ padding: '12px' }}>Register Deal</button>
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
                        <td>{deal.brand?.name || deal.name || '-'}</td>
                        <td>{deal.title || deal.campaignName || '-'}</td>
                        <td className="amount-positive">Rs. {(deal.budget || deal.dealValue || 0).toLocaleString('en-IN')}</td>
                        <td>{deal.brand?.industry || 'General'}</td>
                        <td>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1.5px solid #111111', background: deal.status === 'COMPLETED' ? 'var(--mint)' : deal.status === 'ACTIVE' ? 'var(--yellow)' : 'var(--lavender)', color: 'var(--text-primary)', fontWeight: '800' }}>
                            {deal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {brandDeals.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No brand deals yet. Register one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TABS: FINANCE ==================== */}
          {activeTab === 'finance' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Log Transaction</h3>
                <form onSubmit={handleAddFinance} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Description" value={newFinance.description} onChange={e => setNewFinance({ ...newFinance, description: e.target.value })} required />
                  <input className="form-input" placeholder="Amount (Rs.)" type="number" step="0.01" value={newFinance.amount} onChange={e => setNewFinance({ ...newFinance, amount: e.target.value })} required />
                  <select className="form-input" value={newFinance.type} onChange={e => setNewFinance({ ...newFinance, type: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                  <button className="btn-primary" type="submit" style={{ padding: '12px' }}>Log Item</button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Cash Flow Records</h3>
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category / Source</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.description || '-'}</td>
                        <td>{rec.source}</td>
                        <td style={{ color: 'var(--pink-hot)', fontWeight: '800' }}>REVENUE</td>
                        <td className="amount-positive">+Rs. {parseFloat(rec.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {expenses.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.description || '-'}</td>
                        <td>{rec.category}</td>
                        <td style={{ fontWeight: '800' }}>EXPENSE</td>
                        <td className="amount-negative">-Rs. {parseFloat(rec.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {revenues.length === 0 && expenses.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No transactions yet. Log one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TABS: ASSETS ==================== */}
          {activeTab === 'assets' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Upload Media Asset</h3>
                <p className="secondary-text">Store and tag raw assets, edits, and thumbnails.</p>
                <form onSubmit={handleUploadAsset} style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" type="file" onChange={(e) => setAssetFile(e.target.files?.[0] || null)} />
                  <button className="btn-primary" type="submit" style={{ width: 'auto' }}>Upload File</button>
                </form>
              </div>

              <div className="asset-grid">
                {assets.map(asset => (
                  <div key={asset.id} className="asset-card">
                    <div className="asset-preview">{asset.type === 'IMAGE' ? <ImageIcon size={34} /> : <VideoIcon size={34} />}</div>
                    <div className="asset-info">
                      <div className="asset-name">{asset.name}</div>
                      <div className="asset-meta">
                        <span>{asset.type}</span>
                        <span>{formatBytes(asset.size)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {assets.length === 0 && (
                  <div className="panel-card" style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)', fontWeight: '700' }}>
                    No uploaded assets yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TABS: GOALS ==================== */}
          {activeTab === 'goals' && (
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <h3>Define Goal</h3>
                <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr', gap: '16px', marginTop: '16px' }}>
                  <input className="form-input" placeholder="Goal Title" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} required />
                  <select className="form-input" value={newGoal.type} onChange={e => setNewGoal({ ...newGoal, type: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="UPLOADS">Uploads</option>
                    <option value="VIEWS">Views</option>
                    <option value="SUBSCRIBERS">Subscribers</option>
                    <option value="REVENUE">Revenue</option>
                    <option value="BRAND_DEALS">Brand Deals</option>
                    <option value="FOLLOWERS">Followers</option>
                    <option value="WATCH_TIME">Watch Time</option>
                    <option value="ENGAGEMENT_RATE">Engagement Rate</option>
                  </select>
                  <input className="form-input" placeholder="Target Value" type="number" value={newGoal.targetValue} onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })} required />
                  <input className="form-input" placeholder="Unit (e.g. views, subs)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} required />
                  <button className="btn-primary" type="submit" style={{ padding: '12px' }}>Create Goal</button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Goal Milestones</h3>
                <div style={{ marginTop: '20px' }}>
                  {goals.map(g => {
                    const percent = Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100) || 0;
                    return (
                      <div key={g.id} className="goal-item">
                        <div className="goal-meta">
                          <span className="goal-title">{g.title}</span>
                          <span style={{ fontWeight: '800' }}>{g.currentValue} / {g.targetValue} {g.unit}</span>
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
                  {goals.length === 0 && (
                    <div className="goal-item" style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                      No goals yet. Create one above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TABS: SCRIPT WORKSPACE ==================== */}
          {activeTab === 'script' && (
            <div className="script-workspace-layout">
              <div className="panel-card script-editor-container">
                <div className="panel-card-header">
                  <h3>Script Editor</h3>
                  <button className="btn-action" onClick={handleSaveScript}>Save Draft</button>
                </div>
                <input 
                  className="form-input" 
                  style={{ fontSize: '1.2rem', fontWeight: 'bold' }} 
                  placeholder="Script Title"
                  value={currentScript.title || ''}
                  onChange={e => handleScriptFieldChange('title', e.target.value)}
                />
                <textarea 
                  className="script-textarea"
                  placeholder="Start writing script outline..."
                  value={currentScript.content || ''}
                  onChange={e => handleScriptFieldChange('content', e.target.value)}
                />
              </div>

              <div className="panel-card">
                <h3>Draft Versions</h3>
                <div style={{ marginTop: '16px' }}>
                  <div className="content-card" style={{ borderLeft: '4px solid var(--pink-primary)' }}>
                    <div className="content-card-title">{currentScript.title}</div>
                    <div className="content-card-meta">
                      <span>Version {currentScript.version || 1}</span>
                      <span>{currentScript.status}</span>
                    </div>
                  </div>
                  {scripts.length > 1 && scripts.slice(1, 5).map(script => (
                    <button key={script.id} className="content-card" style={{ width: '100%', textAlign: 'left', marginTop: '12px' }} onClick={() => setCurrentScript(script)}>
                      <div className="content-card-title">{script.title}</div>
                      <div className="content-card-meta">
                        <span>Version {script.version || 1}</span>
                        <span>{script.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TABS: ANALYTICS ==================== */}
          {activeTab === 'analytics' && (
            <div className="panel-card">
              <h3>Channel Performance</h3>
              <p className="secondary-text">Monthly performance tracker across connected video platforms.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', margin: '24px 0' }}>
                <div className="stat-card highlight-yellow">
                  <span className="stat-title">Subscribers</span>
                  <div className="stat-value">{formatCompactNumber(analyticsData.subscribers)}</div>
                </div>
                <div className="stat-card highlight-pink">
                  <span className="stat-title">Views (30d)</span>
                  <div className="stat-value">{formatCompactNumber(analyticsData.views)}</div>
                </div>
                <div className="stat-card highlight-blue">
                  <span className="stat-title">Likes</span>
                  <div className="stat-value">{formatCompactNumber(analyticsData.likes)}</div>
                </div>
              </div>

              <h3>Growth Trend Chart</h3>
              <div className="chart-bar-container" style={{ height: '240px' }}>
                {analyticsData.growth.length === 0 ? (
                  <div style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontWeight: '700' }}>No analytics logged yet.</div>
                ) : analyticsData.growth.map((item) => {
                  const maxViews = Math.max(...analyticsData.growth.map(g => g.views || 0), 1);
                  const height = Math.max(8, Math.round(((item.views || 0) / maxViews) * 100));
                  return (
                    <div key={item.month} className="chart-bar" style={{ height: `${height}%` }}>
                      <span className="chart-bar-value">{formatCompactNumber(item.views)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px', marginTop: '8px', fontSize: '0.85rem', fontWeight: '800' }}>
                {analyticsData.growth.map(item => (
                  <span key={item.month}>{item.month?.split(' ')[0]}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ textTransform: 'uppercase' }}>Add {modalType}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>X</button>
            </div>
            
            {modalType === 'content' && (
              <form onSubmit={handleAddContent}>
                <div className="form-group">
                  <label className="form-label">Content Title</label>
                  <input className="form-input" placeholder="e.g. 10 Apps I Can't Live Without" value={newContent.title} onChange={e => setNewContent({ ...newContent, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Type</label>
                  <select className="form-input" value={newContent.type} onChange={e => setNewContent({ ...newContent, type: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="YOUTUBE_VIDEO">YouTube Video</option>
                    <option value="YOUTUBE_SHORT">YouTube Short</option>
                    <option value="INSTAGRAM_REEL">Instagram Reel</option>
                    <option value="TIKTOK">TikTok Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={newContent.status} onChange={e => setNewContent({ ...newContent, status: e.target.value })} style={{ backgroundColor: 'white' }}>
                    <option value="IDEA">Idea</option>
                    <option value="RESEARCH">Research</option>
                    <option value="SCRIPTING">Scripting</option>
                    <option value="RECORDING">Recording</option>
                    <option value="EDITING">Editing</option>
                  </select>
                </div>
                <div className="button-row">
                  <button className="btn-secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button className="btn-primary" type="submit" style={{ width: 'auto' }}>Create Item</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
