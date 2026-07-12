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
  SettingsIcon,
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
  const { logout, user, fetchProfile } = useAuth();
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

  // Interactive UI / Drawer / Dropdown States
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [profileSubTab, setProfileSubTab] = useState('edit');

  // Profile Settings Form State
  const [profileEditForm, setProfileEditForm] = useState({
    name: '', bio: '', niche: '',
    socialYoutube: '', socialInstagram: '', socialTiktok: '',
    role: 'CREATOR'
  });

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true, title, message,
      onConfirm: () => { onConfirm(); setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null }); }
    });
  };

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

  useEffect(() => {
    if (user) {
      setProfileEditForm({
        name: user.name || '',
        bio: user.bio || '',
        niche: user.niche || '',
        socialYoutube: user.socialYoutube || '',
        socialInstagram: user.socialInstagram || '',
        socialTiktok: user.socialTiktok || '',
        role: user.role || 'CREATOR'
      });
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifDrawer(false);
        setShowProfileDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // ─── CRUD Delete Handler ───
  const handleDeleteItem = async (type, id) => {
    const token = getToken();
    const urlMap = {
      content: `${API_URL}/content/${id}`,
      brand: `${API_URL}/brands/campaigns/${id}`,
      revenue: `${API_URL}/finance/revenue/${id}`,
      expense: `${API_URL}/finance/expenses/${id}`,
      asset: `${API_URL}/assets/${id}`,
      goal: `${API_URL}/goals/${id}`,
      script: `${API_URL}/collaboration/scripts/${id}`,
      notification: `${API_URL}/collaboration/notifications/${id}`,
    };
    const url = urlMap[type];
    if (!url) return;
    try {
      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await readJson(res);
      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, 'success');
      await fetchData();
    } catch (err) {
      addToast(err.message || `Failed to delete ${type}.`, 'error');
    }
  };

  // ─── Notification Actions ───
  const handleClearAllNotifications = async () => {
    const token = getToken();
    try {
      await fetch(`${API_URL}/collaboration/notifications/clear-all`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(readJson);
      setNotifications([]);
      addToast('All notifications cleared!', 'success');
    } catch (err) { addToast(err.message || 'Failed to clear notifications.', 'error'); }
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = getToken();
    try {
      await fetch(`${API_URL}/collaboration/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }).then(readJson);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      addToast('All notifications marked as read!', 'success');
    } catch (err) { addToast(err.message || 'Failed to mark notifications.', 'error'); }
  };

  // ─── Profile Update ───
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileEditForm.name,
          bio: profileEditForm.bio,
          niche: profileEditForm.niche,
          role: profileEditForm.role,
          youtubeChannel: profileEditForm.socialYoutube,
          instagramHandle: profileEditForm.socialInstagram,
          tiktokHandle: profileEditForm.socialTiktok
        })
      });
      await readJson(res);
      await fetchProfile(token);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  // ─── Global Search ───
  const getSearchResults = () => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results = {
      content: contentItems.filter(i => i.title?.toLowerCase().includes(q)),
      assets: assets.filter(i => i.name?.toLowerCase().includes(q)),
      scripts: scripts.filter(i => i.title?.toLowerCase().includes(q)),
      brands: brandDeals.filter(i => (i.brand?.name || i.name || i.title || '').toLowerCase().includes(q)),
      goals: goals.filter(i => i.title?.toLowerCase().includes(q)),
      notifications: notifications.filter(i => (i.title || '').toLowerCase().includes(q) || (i.message || '').toLowerCase().includes(q)),
    };
    const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    return total > 0 ? results : [];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleTabs = {
    CREATOR: ['home', 'content', 'ai', 'brands', 'finance', 'assets', 'analytics', 'goals', 'script', 'profile'],
    VIDEO_EDITOR: ['home', 'content', 'assets', 'script', 'profile'],
    SCRIPT_WRITER: ['home', 'ai', 'script', 'content', 'profile'],
    THUMBNAIL_DESIGNER: ['home', 'assets', 'content', 'profile'],
    MANAGER: ['home', 'brands', 'analytics', 'finance', 'profile'],
    ADMIN: ['home', 'content', 'ai', 'brands', 'finance', 'assets', 'analytics', 'goals', 'script', 'profile'],
    FINANCE_MANAGER: ['home', 'finance', 'analytics', 'profile']
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <BarChartIcon size={18} /> },
    { id: 'content', label: 'Content Calendar', icon: <CalendarIcon size={18} /> },
    { id: 'ai', label: 'AI Assistant', icon: <BotIcon size={18} /> },
    { id: 'brands', label: 'Brand Deals', icon: <BriefcaseIcon size={18} /> },
    { id: 'finance', label: 'Revenue & Expenses', icon: <WalletIcon size={18} /> },
    { id: 'assets', label: 'Assets', icon: <ImageIcon size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChartIcon size={18} /> },
    { id: 'goals', label: 'Goals', icon: <TargetIcon size={18} /> },
    { id: 'script', label: 'Script Workspace', icon: <FileTextIcon size={18} /> },
    { id: 'profile', label: 'Settings', icon: <SettingsIcon size={18} /> }
  ];

  const getRoleLabel = (role) => {
    const mapping = {
      CREATOR: 'Content Creator',
      MANAGER: 'Manager',
      VIDEO_EDITOR: 'Video Editor',
      THUMBNAIL_DESIGNER: 'Thumbnail Designer',
      SCRIPT_WRITER: 'Script Writer',
      ADMIN: 'Administrator',
      FINANCE_MANAGER: 'Finance Manager'
    };
    return mapping[role] || 'Creator';
  };

  const userRole = user?.role || 'CREATOR';
  const allowedTabs = roleTabs[userRole] || roleTabs['CREATOR'];
  const userName = user?.name || user?.email?.split('@')[0] || 'Arjun';
  const userAvatarLetter = userName.charAt(0).toUpperCase();

  const handleNotificationClick = async (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    const token = getToken();
    if (token && notif.id) {
      try {
        await fetch(`${API_URL}/collaboration/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    if (notif.type === 'PAYMENT_REMINDER') {
      setActiveTab('finance');
    } else if (notif.type === 'PUBLISH_REMINDER' || notif.type === 'EDITING_DEADLINE') {
      setActiveTab('content');
    } else if (notif.type === 'BRAND_DEAL_DEADLINE') {
      setActiveTab('brands');
    } else if (notif.type === 'GOAL_ACHIEVED') {
      setActiveTab('goals');
    } else if (notif.type === 'AI_SUGGESTION') {
      setActiveTab('ai');
    }
  };

  const renderCalendarWidget = () => (
    <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
      <div className="panel-card-header" style={{ borderBottom: 'none', marginBottom: '10px' }}>
        <h3 className="panel-card-title"> Content Calendar</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px' }}>WEEK</button>
          <button className="btn-secondary" style={{ padding: '6px 12px' }}>MONTH</button>
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
      <button className="btn-secondary" style={{ width: '100%', marginTop: '16px', borderStyle: 'dashed' }} onClick={(e) => { e.stopPropagation(); setModalType('content'); setShowAddModal(true); }}>
        + ADD CONTENT
      </button>
    </div>
  );

  const renderNotificationsWidget = () => (
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
            <div key={n.id || idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
              <div style={{ background: bg[idx % bg.length], border: '2px solid #111111', padding: '6px', borderRadius: '8px', flexShrink: 0, display: 'flex' }}>
                <NotificationIcon size={16} />
              </div>
              <div style={{ opacity: n.isRead ? 0.6 : 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', textDecoration: n.isRead ? 'line-through' : 'none' }}>{n.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#555555' }}>{n.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRoleStatCards = (role) => {
    switch (role) {
      case 'VIDEO_EDITOR':
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="stat-header">
                  <span className="stat-title">Assigned Editing Tasks</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><FileTextIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.filter(c => c.status === 'EDITING').length}</div>
                <div className="stat-change"><span>Currently in editing status</span></div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="stat-header">
                  <span className="stat-title">Pending Videos</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><VideoIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.filter(c => c.status !== 'PUBLISHED').length}</div>
                <div className="stat-change"><span>Awaiting production completion</span></div>
              </div>
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('script')}>
                <div className="stat-header">
                  <span className="stat-title">Script Files</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><FileTextIcon size={18} /></div>
                </div>
                <div className="stat-value">{scripts.length}</div>
                <div className="stat-change"><span>Collaborative scripts online</span></div>
              </div>
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <div className="stat-header">
                  <span className="stat-title">Uploaded Assets</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><ImageIcon size={18} /></div>
                </div>
                <div className="stat-value">{assets.length}</div>
                <div className="stat-change"><span>Raw media & edits</span></div>
              </div>
            </div>
          </div>
        );
      case 'SCRIPT_WRITER':
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('script')}>
                <div className="stat-header">
                  <span className="stat-title">Assigned Scripts</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><FileTextIcon size={18} /></div>
                </div>
                <div className="stat-value">{scripts.filter(s => s.status === 'DRAFT' || s.status === 'IN_PROGRESS').length || scripts.length}</div>
                <div className="stat-change"><span>Drafting or outlining in progress</span></div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('script')}>
                <div className="stat-header">
                  <span className="stat-title">Drafts</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><FileTextIcon size={18} /></div>
                </div>
                <div className="stat-value">{scripts.filter(s => s.status === 'DRAFT').length}</div>
                <div className="stat-change"><span>Initial outlines & drafts</span></div>
              </div>
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ai')}>
                <div className="stat-header">
                  <span className="stat-title">AI Assistant</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BotIcon size={18} /></div>
                </div>
                <div className="stat-value">Active</div>
                <div className="stat-change"><span>AI hook & script co-pilot</span></div>
              </div>
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="stat-header">
                  <span className="stat-title">Upcoming Posts</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><VideoIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.length}</div>
                <div className="stat-change"><span>Total content calendar items</span></div>
              </div>
            </div>
          </div>
        );
      case 'THUMBNAIL_DESIGNER':
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <div className="stat-header">
                  <span className="stat-title">Thumbnail Requests</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><ImageIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.filter(c => c.status === 'THUMBNAIL').length}</div>
                <div className="stat-change"><span>Awaiting thumbnail design</span></div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="stat-header">
                  <span className="stat-title">Design Queue</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><CalendarIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.filter(c => c.status !== 'PUBLISHED' && c.status !== 'SCHEDULED').length}</div>
                <div className="stat-change"><span>In-progress production pipeline</span></div>
              </div>
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <div className="stat-header">
                  <span className="stat-title">Brand Assets</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BriefcaseIcon size={18} /></div>
                </div>
                <div className="stat-value">{assets.filter(a => a.type === 'IMAGE').length}</div>
                <div className="stat-change"><span>Images, logos & resources</span></div>
              </div>
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <div className="stat-header">
                  <span className="stat-title">Completed Designs</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><ImageIcon size={18} /></div>
                </div>
                <div className="stat-value">{assets.length}</div>
                <div className="stat-change"><span>Total uploaded assets</span></div>
              </div>
            </div>
          </div>
        );
      case 'MANAGER':
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('brands')}>
                <div className="stat-header">
                  <span className="stat-title">Brand Campaigns</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BriefcaseIcon size={18} /></div>
                </div>
                <div className="stat-value">{brandDeals.length}</div>
                <div className="stat-change"><span>Total brand campaigns</span></div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Revenue Summary</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                </div>
                <div className="stat-value">Rs. {getFinanceSummary().revenue.toLocaleString('en-IN')}</div>
                <div className="stat-change"><span>Net Profit: Rs. {getFinanceSummary().net.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="stat-header">
                  <span className="stat-title">Team Tasks</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><UsersIcon size={18} /></div>
                </div>
                <div className="stat-value">{contentItems.length}</div>
                <div className="stat-change"><span>Content workflow pipeline tasks</span></div>
              </div>
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('analytics')}>
                <div className="stat-header">
                  <span className="stat-title">Analytics Overview</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BarChartIcon size={18} /></div>
                </div>
                <div className="stat-value">{formatCompactNumber(analyticsData.views)}</div>
                <div className="stat-change"><span>Total monthly views</span></div>
              </div>
            </div>
          </div>
        );
      case 'FINANCE_MANAGER':
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Total Revenue</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                </div>
                <div className="stat-value">Rs. {getFinanceSummary().revenue.toLocaleString('en-IN')}</div>
                <div className="stat-change"><span>All recorded revenue streams</span></div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Total Expenses</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                </div>
                <div className="stat-value">Rs. {getFinanceSummary().expense.toLocaleString('en-IN')}</div>
                <div className="stat-change"><span>Software, tools & payouts</span></div>
              </div>
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Net Profit Margin</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                </div>
                <div className="stat-value">Rs. {getFinanceSummary().net.toLocaleString('en-IN')}</div>
                <div className="stat-change"><span>After deductions & expenses</span></div>
              </div>
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Campaign Invoices</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><BriefcaseIcon size={18} /></div>
                </div>
                <div className="stat-value">{brandDeals.length}</div>
                <div className="stat-change"><span>Brand deals contracts logged</span></div>
              </div>
            </div>
          </div>
        );
      case 'CREATOR':
      case 'ADMIN':
      default:
        return (
          <div className="dashboard-grid">
            <div className="stat-card-row">
              <div className="stat-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="stat-header">
                  <span className="stat-title">Total Revenue</span>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'white' }}><WalletIcon size={18} /></div>
                </div>
                <div className="stat-value">Rs. {getFinanceSummary().revenue.toLocaleString('en-IN')}</div>
                <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
                  Net: <span style={{ color: 'var(--pink-hot)' }}>Rs. {getFinanceSummary().net.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="stat-card highlight-yellow" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
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
              <div className="stat-card highlight-peach" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('brands')}>
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
              <div className="stat-card highlight-lavender" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('goals')}>
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
        );
    }
  };

  const renderRoleDashboardGrid = (role) => {
    switch (role) {
      case 'VIDEO_EDITOR':
        return (
          <>
            <div className="dashboard-center-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><VideoIcon size={20} /> Video Editing Pipeline</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {contentItems.filter(item => item.status === 'EDITING' || item.status === 'RECORDING').length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', padding: '20px', textAlign: 'center' }}>
                      No videos currently pending editing.
                    </div>
                  ) : contentItems.filter(item => item.status === 'EDITING' || item.status === 'RECORDING').map(item => (
                    <div key={item.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '2px solid #111', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type: {item.type}</div>
                      </div>
                      <span className="platform-tag youtube" style={{ textTransform: 'uppercase' }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dashboard-two-col-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('script')}>
                <h3 className="icon-heading" style={{ marginBottom: '16px', fontSize: '1.2rem' }}><FileTextIcon size={20} /> Active Scripts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scripts.slice(0, 3).map(s => (
                    <div key={s.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{s.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                        {s.content ? s.content.substring(0, 80) + '...' : 'No content outline yet.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <h3 className="icon-heading" style={{ marginBottom: '16px', fontSize: '1.2rem' }}><ImageIcon size={20} /> Raw Assets & Uploads</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {assets.slice(0, 4).map(asset => (
                    <div key={asset.id} style={{ border: '2px solid #111', padding: '8px', borderRadius: '4px', background: 'var(--bg-main)', fontSize: '0.75rem', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.name}
                    </div>
                  ))}
                  {assets.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1/-1' }}>No assets uploaded yet.</div>}
                </div>
              </div>
            </div>
          </>
        );
      case 'SCRIPT_WRITER':
        return (
          <>
            <div className="dashboard-center-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('script')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><FileTextIcon size={20} /> Script Drafts</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {scripts.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', padding: '20px', textAlign: 'center' }}>
                      No script files logged.
                    </div>
                  ) : scripts.slice(0, 3).map(script => (
                    <div key={script.id} style={{ border: '2px solid #111', padding: '12px', borderRadius: '6px', backgroundColor: 'white', boxShadow: '2px 2px 0px #111' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '6px' }}>{script.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>
                        {script.content ? script.content.substring(0, 120) + '...' : 'Blank script template.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ai')}>
                <h3 className="icon-heading" style={{ marginBottom: '8px', fontSize: '1.2rem' }}><BotIcon size={20} /> AI Co-Pilot</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555555', marginBottom: '16px' }}>
                  Draft script segments, viral hooks, and brainstorm content angles instantly.
                </p>
                <form onSubmit={handleQuickAiSubmit}>
                  <input 
                    className="form-input" 
                    placeholder="Topic / Prompt..." 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    style={{ marginBottom: '12px' }}
                  />
                  <button className="btn-primary" type="submit" style={{ padding: '8px' }}>
                    Generate Script Idea
                  </button>
                </form>
              </div>
            </div>
            <div className="dashboard-two-col-grid" style={{ gridTemplateColumns: '1fr' }}>
              {renderCalendarWidget()}
            </div>
          </>
        );
      case 'THUMBNAIL_DESIGNER':
        return (
          <>
            <div className="dashboard-center-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><ImageIcon size={20} /> Thumbnail Requests Queue</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {contentItems.filter(c => c.status === 'THUMBNAIL' || c.status === 'IDEA').length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', padding: '20px', textAlign: 'center' }}>
                      No pending thumbnail requests in the workspace.
                    </div>
                  ) : contentItems.filter(c => c.status === 'THUMBNAIL' || c.status === 'IDEA').map(item => (
                    <div key={item.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555' }}>Platform: {item.type}</div>
                      </div>
                      <span className="platform-tag instagram" style={{ textTransform: 'uppercase' }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dashboard-two-col-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('assets')}>
                <h3 className="icon-heading" style={{ marginBottom: '16px', fontSize: '1.2rem' }}><ImageIcon size={20} /> Brand Assets & Materials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {assets.map(asset => (
                    <div key={asset.id} style={{ border: '2px solid #111', padding: '10px', borderRadius: '6px', background: 'white', textAlign: 'center', boxShadow: '2px 2px 0px #111' }}>
                      <ImageIcon size={24} />
                      <div style={{ fontSize: '0.7rem', fontWeight: '800', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                    </div>
                  ))}
                  {assets.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1/-1' }}>No assets uploaded yet.</div>}
                </div>
              </div>
              {renderCalendarWidget()}
            </div>
          </>
        );
      case 'MANAGER':
        return (
          <>
            <div className="dashboard-center-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('brands')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><BriefcaseIcon size={20} /> Campaign Pipeline</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {brandDeals.map(deal => (
                    <div key={deal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '2px solid #111', borderRadius: '6px', background: 'white' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{deal.name || deal.brand?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Campaign: {deal.campaignName || deal.title}</div>
                      </div>
                      <span style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--pink-hot)' }}>Rs. {deal.dealValue || deal.budget}</span>
                    </div>
                  ))}
                  {brandDeals.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No campaigns registered.</div>}
                </div>
              </div>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('analytics')}>
                <h3 className="panel-card-title"><BarChartIcon size={20} /> Performance Chart</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '10px', marginTop: '16px', borderBottom: '2px solid #111' }}>
                  {analyticsData.growth.slice(-5).map(g => {
                    const maxV = Math.max(...analyticsData.growth.map(i => i.views || 0), 1);
                    const h = Math.max(10, Math.round(((g.views || 0) / maxV) * 100));
                    return (
                      <div key={g.month} title={`${g.month}: ${g.views} views`} style={{ flex: 1, height: `${h}%`, background: 'var(--yellow)', border: '2px solid #111', borderRadius: '4px 4px 0 0' }} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="dashboard-two-col-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <h3 className="panel-card-title"><WalletIcon size={20} /> Financial summary</h3>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Revenues Logged:</span>
                    <span className="amount-positive">Rs. {getFinanceSummary().revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Expenses Logged:</span>
                    <span className="amount-negative">Rs. {getFinanceSummary().expense.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #111', paddingTop: '8px' }}>
                    <span style={{ fontWeight: '800' }}>Net Balance:</span>
                    <span style={{ fontWeight: '800', color: 'var(--pink-hot)' }}>Rs. {getFinanceSummary().net.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'FINANCE_MANAGER':
        return (
          <>
            <div className="dashboard-center-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><WalletIcon size={20} /> Recent Revenues</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {revenues.slice(0, 4).map(rev => (
                    <div key={rev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '2px solid #111', borderRadius: '6px', background: 'white' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{rev.source?.replace('_', ' ')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{rev.description || 'Revenue item'}</div>
                      </div>
                      <span className="amount-positive" style={{ fontWeight: '800' }}>+ Rs. {rev.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {revenues.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No revenue items logged.</div>}
                </div>
              </div>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
                <div className="panel-card-header">
                  <h3 className="panel-card-title"><WalletIcon size={20} /> Recent Expenses</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {expenses.slice(0, 4).map(exp => (
                    <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '2px solid #111', borderRadius: '6px', background: 'white' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{exp.category?.replace('_', ' ')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{exp.description || 'Expense item'}</div>
                      </div>
                      <span className="amount-negative" style={{ fontWeight: '800' }}>- Rs. {exp.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No expense items logged.</div>}
                </div>
              </div>
            </div>
            <div className="dashboard-two-col-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('analytics')}>
                <h3 className="panel-card-title"><BarChartIcon size={20} /> Performance Chart</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '10px', marginTop: '16px', borderBottom: '2px solid #111' }}>
                  {analyticsData.growth.slice(-5).map(g => {
                    const maxV = Math.max(...analyticsData.growth.map(i => i.views || 0), 1);
                    const h = Math.max(10, Math.round(((g.views || 0) / maxV) * 100));
                    return (
                      <div key={g.month} title={`${g.month}: ${g.views} views`} style={{ flex: 1, height: `${h}%`, background: 'var(--yellow)', border: '2px solid #111', borderRadius: '4px 4px 0 0' }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      case 'CREATOR':
      case 'ADMIN':
      default:
        return (
          <>
            <div className="dashboard-center-grid" style={{ gridTemplateColumns: '1fr' }}>
              {renderCalendarWidget()}
            </div>
            <div className="dashboard-bottom-grid">
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('content')}>
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
              <div className="panel-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('finance')}>
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
              <div className="panel-card highlight-pink" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ai')}>
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
          </>
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1050 }} onClick={() => setMobileSidebarOpen(false)} />}

      {/* Sidebar Section */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
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
          {menuItems.filter(item => allowedTabs.includes(item.id)).map(item => (
            <li key={item.id} className="sidebar-item">
              <a onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }} className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}>
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', padding: '16px 0', borderTop: '2px solid var(--border-color)' }}>
          {user?.profileImage ? (
            <img src={user.profileImage} alt={userName} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #111111', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--pink-soft)', border: '2px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
              {userAvatarLetter}
            </div>
          )}
          <div className="user-info" style={{ flex: 1 }}>
            <div className="user-name" style={{ fontSize: '0.9rem', fontWeight: '800' }}>{userName}</div>
            <div className="user-role" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getRoleLabel(userRole)}</div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <LogOutIcon size={18} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-wrapper">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button className="hamburger-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="search-input-container" style={{ position: 'relative', flex: 1 }}>
              <span className="search-icon"><SearchIcon size={18} /></span>
              <input 
                className="search-bar" 
                placeholder="Search content, analytics, deals..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {/* Search Results Dropdown */}
              {(() => {
                const sr = getSearchResults();
                if (!sr || Array.isArray(sr)) return null;
                const sections = [
                  { key: 'content', label: 'Content', tab: 'content', items: sr.content, nameKey: 'title' },
                  { key: 'brands', label: 'Brand Deals', tab: 'brands', items: sr.brands, nameKey: 'title' },
                  { key: 'assets', label: 'Assets', tab: 'assets', items: sr.assets, nameKey: 'name' },
                  { key: 'scripts', label: 'Scripts', tab: 'script', items: sr.scripts, nameKey: 'title' },
                  { key: 'goals', label: 'Goals', tab: 'goals', items: sr.goals, nameKey: 'title' },
                  { key: 'notifications', label: 'Notifications', tab: null, items: sr.notifications, nameKey: 'title' },
                ];
                return (
                  <div className="search-results-dropdown">
                    {sections.filter(s => s.items.length > 0).map(s => (
                      <div key={s.key} className="search-result-group">
                        <div className="search-result-group-title">{s.label} ({s.items.length})</div>
                        {s.items.slice(0, 4).map((item, idx) => (
                          <div key={item.id || idx} className="search-result-item" onClick={() => {
                            if (s.tab) { setActiveTab(s.tab); } else { setShowNotifDrawer(true); }
                            setSearchQuery('');
                          }}>
                            <span>{item[s.nameKey] || item.name || '-'}</span>
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
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

            <div className="notification-bell" onClick={() => setShowNotifDrawer(true)}>
              <BellIcon size={20} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <div className="notification-bell-badge">
                  {notifications.filter(n => !n.isRead).length}
                </div>
              )}
            </div>

            <div className="profile-dropdown-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={userName} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #111111', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--pink-soft)', border: '2px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>{userAvatarLetter}</div>
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>Hi, {userName}!</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getRoleLabel(userRole)}</div>
                </div>
              </div>
              {showProfileDropdown && (
                <div className="profile-dropdown-menu">
                  <button className="profile-dropdown-item" onClick={() => { setActiveTab('profile'); setShowProfileDropdown(false); }}>Edit Profile</button>
                  <button className="profile-dropdown-item" onClick={() => { setActiveTab('goals'); setShowProfileDropdown(false); }}>Goals & Settings</button>
                  <button className="profile-dropdown-item" onClick={() => { setShowNotifDrawer(true); setShowProfileDropdown(false); }}>Notifications</button>
                  <div style={{ borderTop: '2px solid #111', margin: '4px 0' }} />
                  <button className="profile-dropdown-item" onClick={() => { handleLogout(); setShowProfileDropdown(false); }} style={{ color: 'var(--pink-hot)' }}>Logout</button>
                </div>
              )}
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
              Updating workspace datasets...
            </div>
          )}

          {/* ==================== TABS: HOME ==================== */}
          {activeTab === 'home' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>Good morning, {userName}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>
                    Logged in as <strong style={{ color: 'var(--pink-hot)' }}>{getRoleLabel(userRole)}</strong>. Here's your workspace overview for today.
                  </p>
                </div>
                <div style={{ background: 'white', border: '2.5px solid #111111', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '2px 2px 0px #111111' }}>
                   {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {renderRoleStatCards(userRole)}
              {renderRoleDashboardGrid(userRole)}
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
                            <button onClick={() => triggerConfirm('Delete Content', `Delete "${item.title}"?`, () => handleDeleteItem('content', item.id))} className="btn-action" style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--pink-soft)' }}>Delete</button>
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
                      <th>Actions</th>
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
                        <td><button onClick={() => triggerConfirm('Delete Deal', `Delete this brand deal?`, () => handleDeleteItem('brand', deal.id))} className="btn-action" style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--pink-soft)' }}>Delete</button></td>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.description || '-'}</td>
                        <td>{rec.source}</td>
                        <td style={{ color: 'var(--pink-hot)', fontWeight: '800' }}>REVENUE</td>
                        <td className="amount-positive">+Rs. {parseFloat(rec.amount).toLocaleString('en-IN')}</td>
                        <td><button onClick={() => triggerConfirm('Delete Revenue', `Delete this revenue transaction?`, () => handleDeleteItem('revenue', rec.id))} className="btn-action" style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--pink-soft)' }}>Delete</button></td>
                      </tr>
                    ))}
                    {expenses.map(rec => (
                      <tr key={rec.id}>
                        <td>{rec.description || '-'}</td>
                        <td>{rec.category}</td>
                        <td style={{ fontWeight: '800' }}>EXPENSE</td>
                        <td className="amount-negative">-Rs. {parseFloat(rec.amount).toLocaleString('en-IN')}</td>
                        <td><button onClick={() => triggerConfirm('Delete Expense', `Delete this expense transaction?`, () => handleDeleteItem('expense', rec.id))} className="btn-action" style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--pink-soft)' }}>Delete</button></td>
                      </tr>
                    ))}
                    {revenues.length === 0 && expenses.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No transactions yet. Log one above.</td></tr>
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
                  <div key={asset.id} className="asset-card" style={{ position: 'relative' }}>
                    <button onClick={() => triggerConfirm('Delete Asset', `Delete "${asset.name}"?`, () => handleDeleteItem('asset', asset.id))} style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--pink-soft)', color: '#111', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '0.72rem', fontWeight: '800', border: '1.5px solid #111' }}>✕</button>
                    <div className="asset-preview">{asset.type === 'IMAGE' ? <ImageIcon size={34} /> : <VideoIcon size={34} />}</div>
                    <div className="asset-info">
                      <div className="asset-name" style={{ paddingRight: '20px' }}>{asset.name}</div>
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
                          <button className="btn-action" onClick={() => triggerConfirm('Delete Goal', `Delete this goal milestone?`, () => handleDeleteItem('goal', g.id))} style={{ background: 'var(--pink-soft)' }}>Delete</button>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentScript.id && (
                      <button className="btn-action" onClick={() => triggerConfirm('Delete Script', 'Are you sure you want to delete this script draft?', () => { handleDeleteItem('script', currentScript.id); setCurrentScript({ id: '', title: '', content: '', status: 'DRAFT', version: 1 }); })} style={{ background: 'var(--pink-soft)' }}>Delete Script</button>
                    )}
                    <button className="btn-action" onClick={handleSaveScript}>Save Draft</button>
                  </div>
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

          {/* ==================== TABS: PROFILE ==================== */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>
              <div className="panel-card" style={{ alignSelf: 'start', textAlign: 'center' }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={userName} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #111111', objectFit: 'cover', margin: '0 auto 16px auto', display: 'block', boxShadow: '4px 4px 0 #111' }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--pink-soft)', border: '4px solid #111111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '3rem', margin: '0 auto 16px auto', boxShadow: '4px 4px 0 #111' }}>
                    {userAvatarLetter}
                  </div>
                )}
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '0 0 4px 0' }}>{userName}</h2>
                <div style={{ background: 'var(--yellow)', border: '2px solid #111', borderRadius: '20px', display: 'inline-block', padding: '4px 14px', fontSize: '0.78rem', fontWeight: '800', marginBottom: '16px', boxShadow: '2px 2px 0 #111' }}>
                  {getRoleLabel(userRole)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#555', fontWeight: '700', borderTop: '2.5px solid #111', paddingTop: '16px', textAlign: 'left' }}>
                  <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {user?.email}</div>
                  {user?.niche && <div style={{ marginBottom: '8px' }}><strong>Niche:</strong> {user.niche}</div>}
                  {user?.bio && <div style={{ lineBreak: 'anywhere' }}><strong>Bio:</strong> {user.bio}</div>}
                </div>
              </div>

              <div className="panel-card">
                <div style={{ display: 'flex', gap: '20px', borderBottom: '3.5px solid #111', paddingBottom: '12px', marginBottom: '24px' }}>
                  <button onClick={() => setProfileSubTab('edit')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '900', color: profileSubTab === 'edit' ? 'var(--pink-hot)' : '#555', cursor: 'pointer', borderBottom: profileSubTab === 'edit' ? '4px solid var(--pink-hot)' : 'none', paddingBottom: '12px', marginBottom: '-16px' }}>Edit Profile</button>
                  <button onClick={() => setProfileSubTab('security')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '900', color: profileSubTab === 'security' ? 'var(--pink-hot)' : '#555', cursor: 'pointer', borderBottom: profileSubTab === 'security' ? '4px solid var(--pink-hot)' : 'none', paddingBottom: '12px', marginBottom: '-16px' }}>Security Settings</button>
                </div>

                {profileSubTab === 'edit' ? (
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={profileEditForm.name} onChange={e => setProfileEditForm({ ...profileEditForm, name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Primary Role</label>
                        <select className="form-input" value={profileEditForm.role} onChange={e => setProfileEditForm({ ...profileEditForm, role: e.target.value })} style={{ backgroundColor: 'white' }}>
                          <option value="CREATOR">Creator</option>
                          <option value="VIDEO_EDITOR">Video Editor</option>
                          <option value="SCRIPT_WRITER">Script Writer</option>
                          <option value="THUMBNAIL_DESIGNER">Thumbnail Designer</option>
                          <option value="MANAGER">Manager</option>
                          <option value="FINANCE_MANAGER">Finance Manager</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Content Niche</label>
                        <input className="form-input" placeholder="e.g. Tech, Finance, Vlogs" value={profileEditForm.niche} onChange={e => setProfileEditForm({ ...profileEditForm, niche: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">YouTube Channel ID / URL</label>
                        <input className="form-input" placeholder="youtube.com/c/yourchannel" value={profileEditForm.socialYoutube} onChange={e => setProfileEditForm({ ...profileEditForm, socialYoutube: e.target.value })} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Instagram Handle</label>
                        <input className="form-input" placeholder="@instagram_handle" value={profileEditForm.socialInstagram} onChange={e => setProfileEditForm({ ...profileEditForm, socialInstagram: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">TikTok Handle</label>
                        <input className="form-input" placeholder="@tiktok_handle" value={profileEditForm.socialTiktok} onChange={e => setProfileEditForm({ ...profileEditForm, socialTiktok: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Creator Bio</label>
                      <textarea className="form-input" style={{ height: '90px', resize: 'vertical' }} placeholder="Tell us about yourself..." value={profileEditForm.bio} onChange={e => setProfileEditForm({ ...profileEditForm, bio: e.target.value })} />
                    </div>

                    <button className="btn-primary" type="submit" style={{ width: '200px', marginTop: '8px' }}>Save Changes</button>
                  </form>
                ) : (
                  <div style={{ padding: '20px 0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontWeight: '900' }}>Password Reset</h4>
                    <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '20px' }}>Want to update your password? Trigger a password reset request below.</p>
                    <button className="btn-secondary" onClick={() => addToast('Password reset link sent to your registered email address!', 'success')} style={{ width: 'auto' }}>Send Reset Email</button>
                  </div>
                )}
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

      {/* ==================== NOTIFICATION DRAWER ==================== */}
      {showNotifDrawer && (
        <div className="notification-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNotifDrawer(false); }}>
          <div className="notification-drawer">
            <div className="notification-drawer-header">
              <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem' }}>Notifications</h3>
              <button onClick={() => setShowNotifDrawer(false)} style={{ background: 'none', border: '2px solid #111', borderRadius: '6px', padding: '4px 10px', fontWeight: '800', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="notification-drawer-content">
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '700', padding: '40px 0' }}>No notifications yet.</div>
              ) : notifications.map((n, idx) => {
                const bg = ['var(--yellow)', 'var(--mint)', 'var(--pink-soft)', 'var(--lavender)'];
                const NotifIcon = notificationIconMap[n.type] || BellIcon;
                return (
                  <div key={n.id || idx} className={`notification-item-card ${n.isRead ? '' : 'unread'}`}>
                    <div style={{ background: bg[idx % bg.length], border: '2px solid #111', padding: '6px', borderRadius: '8px', flexShrink: 0, display: 'flex' }}>
                      <NotifIcon size={16} />
                    </div>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { handleNotificationClick(n); setShowNotifDrawer(false); }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <button className="notification-delete-btn" onClick={() => handleDeleteItem('notification', n.id)} title="Delete">✕</button>
                  </div>
                );
              })}
            </div>
            <div className="notification-drawer-footer">
              <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={handleMarkAllNotificationsRead}>Mark All Read</button>
              <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', background: 'var(--pink-soft)' }} onClick={() => triggerConfirm('Clear All', 'Delete all notifications permanently?', handleClearAllNotifications)}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM DIALOG ==================== */}
      {confirmDialog.isOpen && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', fontWeight: '900' }}>{confirmDialog.title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: 'var(--pink-hot)' }} onClick={confirmDialog.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST CONTAINER ==================== */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
