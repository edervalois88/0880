'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Image as ImageIcon, Layout, Type, Palette, Save, Eye, Plus, Trash2, Home, CheckCircle, Edit2, X, Search, LogOut, Users, Database, TrendingUp, ShoppingCart, DollarSign, Package, Box, EyeOff, Activity, Grid, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { translations } from '@/app/data/constants';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getConfig,
  updateConfig,
  getUsers,
  createUser,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  migrateFromConstants,
  getDashboardStats,
  getInventoryLogs,
  addInventoryMovement,
  toggleProductVisibility,
} from '@/lib/server-actions';

const defaultConfig = {
  id: 'singleton',
  siteName: '0880 LUXURY COLLECTION',
  whatsappNumber: '5215633551085',
  currency: 'MXN',
  heroTitle1: 'Arte en',
  heroTitle2: 'cada puntada.',
  heroSubtitle: 'Lujo Silencioso • Hecho a Mano • León, Gto.',
  primaryColor: '#b45309',
  backgroundColor: '#fafafa',
  updatedBy: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [config, setConfig] = useState(defaultConfig);
  const [isMigrating, setIsMigrating] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [selectedProductForInventory, setSelectedProductForInventory] = useState(null);
  const [inventoryAdjustment, setInventoryAdjustment] = useState({ type: 'IN', quantity: 1, reason: '' });
  const [language, setLanguage] = useState('es');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'editor' });
  const [catalogViewMode, setCatalogViewMode] = useState('grid');

  const t = translations[language].admin;
  const tc = translations[language].catalog;

  // Sound effect for new sales
  const playNotification = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load initial data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadAdminData = async () => {
      try {
        const [productsData, configData, usersData, statsData, logsData] = await Promise.all([
          getProducts(),
          getConfig(),
          getUsers(),
          getDashboardStats(),
          getInventoryLogs(),
        ]);

        setProducts(productsData || []);
        setConfig(configData || defaultConfig);
        setUsers(usersData || []);
        setDashboardStats(statsData || null);
        setInventoryLogs(logsData || []);
      } catch (error) {
        console.error('Data load error:', error);
        toast.error('Error al cargar datos. Verifica la conexión a la base de datos.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAdminData();
  }, [status]);

  // Auto-refresh logic (every 60 seconds)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(async () => {
      try {
        const statsData = await getDashboardStats();
        if (statsData) {
          // Check for new sales
          if (lastOrderCount > 0 && statsData.orderCount > lastOrderCount) {
            playNotification();
            toast.success(t.alerts.newSale.replace('{id}', 'Stripe'), {
              icon: '💰',
              duration: 5000,
            });
          }
          setDashboardStats(statsData);
          setLastOrderCount(statsData.orderCount);
        }
      } catch (error) {
        console.error('Auto-refresh failed', error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [status, lastOrderCount, t.alerts.newSale]);

  // Handle language sync with root (optional, or just local)
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleSave = async () => {
    if (!session?.user) return;
    setIsSaving(true);

    try {
      await updateConfig({
        siteName: config.siteName,
        whatsappNumber: config.whatsappNumber,
        currency: config.currency,
        heroTitle1: config.heroTitle1,
        heroTitle2: config.heroTitle2,
        heroSubtitle: config.heroSubtitle,
        primaryColor: config.primaryColor,
        backgroundColor: config.backgroundColor,
      });

      toast.success('Cambios guardados exitosamente.');
    } catch (error) {
      toast.error('No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!session?.user) return;

    const productData = {
      name: editingProduct.name,
      collection: editingProduct.collection,
      price: editingProduct.price,
      color: editingProduct.color,
      design: editingProduct.design,
      image: editingProduct.image,
      descEs: editingProduct.descEs || '',
      descEn: editingProduct.descEn || editingProduct.descEs || '',
      stock: parseInt(editingProduct.stock) || 0,
      published: !!editingProduct.published,
    };

    try {
      if (editingProduct.id === 'new') {
        const newProduct = await createProduct(productData);
        setProducts([newProduct, ...products]);
        toast.success('Producto agregado con éxito.');
      } else {
        const updated = await updateProduct(editingProduct.id, productData);
        setProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)));
        toast.success('Producto actualizado.');
      }
      setEditingProduct(null);
    } catch (error) {
      toast.error('Error al guardar el producto.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Producto eliminado.');
    } catch (error) {
      toast.error('Error al eliminar el producto.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'catalog', label: 'Catálogo', icon: Layout },
    { id: 'inventory', label: 'Inventario', icon: Box },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'general', label: 'General', icon: Settings },
    { id: 'hero', label: 'Hero & Textos', icon: Type },
    { id: 'theme', label: 'Apariencia', icon: Palette },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
  ];
 
  const handleMigrate = async () => {
    if (!confirm('¿Deseas migrar los productos desde el archivo constants.js? Esto reemplazará el catálogo actual.')) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateFromConstants();
      if (result.success) {
        toast.success(`Migración exitosa: ${result.count} productos importados.`);
        const updatedProducts = await getProducts();
        setProducts(updatedProducts);
      }
    } catch (error) {
      toast.error('Error durante la migración.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await toggleUserActive(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, active: !currentStatus } : u));
      toast.success('Estado de usuario actualizado.');
    } catch (error) {
      toast.error('Error al actualizar usuario.');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Rol actualizado.');
    } catch (error) {
      toast.error('Error al actualizar rol.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const created = await createUser(newUser);
      setUsers([created, ...users]);
      toast.success('Usuario creado con éxito');
      setIsCreatingUser(false);
      setNewUser({ email: '', password: '', role: 'editor' });
    } catch (error) {
      toast.error(error.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario permanentemente?')) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Usuario eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      await toggleProductVisibility(id, !currentStatus);
      setProducts(products.map(p => p.id === id ? { ...p, published: !currentStatus } : p));
      toast.success('Visibilidad actualizada');
    } catch (error) {
      toast.error('Error al cambiar visibilidad');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProductForInventory) return;
    
    setIsAdjustingStock(true);
    try {
      await addInventoryMovement({
        productId: selectedProductForInventory.id,
        type: inventoryAdjustment.type,
        quantity: parseInt(inventoryAdjustment.quantity),
        reason: inventoryAdjustment.reason || (inventoryAdjustment.type === 'IN' ? 'Entrada manual' : 'Salida manual')
      });
      
      // Update local state
      const diff = inventoryAdjustment.type === 'IN' ? parseInt(inventoryAdjustment.quantity) : -parseInt(inventoryAdjustment.quantity);
      setProducts(products.map(p => p.id === selectedProductForInventory.id ? { ...p, stock: p.stock + diff } : p));
      
      // Refresh logs
      const newLogs = await getInventoryLogs();
      setInventoryLogs(newLogs);
      
      toast.success('Inventario actualizado');
      setSelectedProductForInventory(null);
      setInventoryAdjustment({ type: 'IN', quantity: 1, reason: '' });
    } catch (error) {
      console.error(error);
      toast.error('Error al ajustar inventario');
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.collection.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || isLoadingData) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-stone-300 border-t-black animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-stone-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex flex-col md:flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-serif text-xs font-bold">
            0880
          </div>
          <span className="font-bold tracking-widest uppercase text-xs">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-stone-100">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs uppercase tracking-widest border border-stone-300 rounded hover:bg-stone-50 transition-colors">
            <Eye size={14} />
            Ver Sitio
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="font-serif text-xl">Configuración del Sitio</h1>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className={`${activeTab === 'catalog' || activeTab === 'inventory' || activeTab === 'dashboard' ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>
            <AnimatePresence mode="popLayout">
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Alerts / Notification Center */}
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-900 flex items-center gap-2">
                        <Activity size={14} />
                        {t.alerts.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] text-amber-700 font-medium uppercase tracking-tighter">Live Monitor</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {dashboardStats?.lowStockProducts?.map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-10 relative rounded overflow-hidden">
                              <Image src={product.image} fill className="object-cover" alt="" />
                            </div>
                            <p className="text-xs font-medium text-red-900">
                              {t.alerts.lowStock.replace('{name}', product.name).replace('{stock}', product.stock)}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedProductForInventory(product);
                              setActiveTab('inventory');
                            }}
                            className="bg-white px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Reabastecer
                          </button>
                        </div>
                      ))}
                      {dashboardStats?.lowStockCount === 0 && (
                        <p className="text-center py-4 text-xs text-stone-400 font-light italic">
                          {t.alerts.noAlerts}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-amber-200 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-stone-100 rounded-lg text-stone-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <DollarSign size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">Live</span>
                      </div>
                      <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{t.stats.totalSales}</p>
                      <h3 className="text-2xl font-serif text-stone-900 mt-1">${dashboardStats?.totalSales?.toLocaleString() || 0}</h3>
                      <p className="text-[10px] text-stone-400 mt-2">Historical Gross revenue</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                          <ShoppingCart size={20} />
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{t.stats.orders}</p>
                      <h3 className="text-2xl font-serif text-stone-900 mt-1">{dashboardStats?.orderCount || 0}</h3>
                      <p className="text-[10px] text-stone-400 mt-2">Successful transactions</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{t.stats.aov}</p>
                      <h3 className="text-2xl font-serif text-stone-900 mt-1">${dashboardStats?.aov?.toLocaleString() || 0}</h3>
                      <p className="text-[10px] text-stone-400 mt-2">Avg. Value per cart</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${dashboardStats?.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'}`}>
                          <Package size={20} />
                        </div>
                        {dashboardStats?.lowStockCount > 0 && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-tighter">Action</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{t.stats.lowStock}</p>
                      <h3 className="text-2xl font-serif text-stone-900 mt-1">{dashboardStats?.lowStockCount || 0}</h3>
                      <p className="text-[10px] text-stone-400 mt-2">Critically low items</p>
                    </div>
                  </div>

                  {/* Charts & Lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                         <TrendingUp size={120} />
                      </div>
                      
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-8 text-stone-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Activity size={16} className="text-amber-600" />
                          Ingresos Recientes (7d)
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-600"></div>
                            <span className="text-[10px] font-medium text-stone-500">Ventas</span>
                          </div>
                        </div>
                      </h3>
                      
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardStats?.salesByDay || []}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#A3A3A3'}} 
                              dy={10} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#A3A3A3'}} 
                              tickFormatter={(val) => `$${val/1000}k`} 
                            />
                            <Tooltip 
                              cursor={{stroke: '#d97706', strokeWidth: 1}}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px'}}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="ventas" 
                              stroke="#d97706" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorSales)" 
                              animationDuration={2000}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-stone-800 flex items-center gap-2">
                        <Activity size={16} className="text-amber-600" />
                        Actividad Reciente
                      </h3>
                      <div className="space-y-4">
                        {dashboardStats?.recentActivity?.map((activity, idx) => (
                          <div key={idx} className="flex gap-3 p-2 group hover:bg-stone-50 rounded-lg transition-colors">
                            <div className={`w-1 h-10 rounded-full shrink-0 ${activity.type === 'SALE' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-stone-900 uppercase tracking-tighter truncate">
                                {activity.product.name}
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                {activity.type === 'SALE' ? 'Venta' : activity.reason}
                              </p>
                              <p className="text-[8px] text-stone-400 mt-1 uppercase">
                                {new Date(activity.createdAt).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className={`text-[10px] font-bold ${activity.type === 'SALE' ? 'text-green-600' : 'text-stone-400'}`}>
                                {activity.type === 'SALE' ? `-1` : activity.type === 'IN' ? `+${activity.quantity}` : `-${activity.quantity}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Settings size={18} className="text-amber-600" />
                      Información General
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Nombre del Sitio</label>
                        <input 
                          type="text" 
                          value={config.siteName}
                          onChange={(e) => setConfig({...config, siteName: e.target.value})}
                          className="w-full border border-stone-300 rounded px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Número de WhatsApp (Ventas)</label>
                        <div className="flex mb-1">
                          <span className="bg-stone-100 border border-stone-300 border-r-0 rounded-l px-3 py-2 text-stone-500 flex items-center">
                            +
                          </span>
                          <input 
                            type="text" 
                            value={config.whatsappNumber}
                            onChange={(e) => setConfig({...config, whatsappNumber: e.target.value})}
                            className="w-full border border-stone-300 rounded-r px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            placeholder="52 1 555 123 4567"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400">Incluye el código de país. Ej: 5215633551085</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* HERO & TEXTOS TAB */}
              {activeTab === 'hero' && (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Type size={18} className="text-amber-600" />
                      Textos de Portada (Hero)
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Título Principal (Línea 1)</label>
                        <input 
                          type="text" 
                          value={config.heroTitle1}
                          onChange={(e) => setConfig({...config, heroTitle1: e.target.value})}
                          className="w-full border border-stone-300 rounded px-4 py-2 font-serif text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Título Principal (Línea 2 - Itálica)</label>
                        <input 
                          type="text" 
                          value={config.heroTitle2}
                          onChange={(e) => setConfig({...config, heroTitle2: e.target.value})}
                          className="w-full border border-stone-300 rounded px-4 py-2 font-serif italic text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Subtítulo (Microcopy)</label>
                        <input 
                          type="text" 
                          value={config.heroSubtitle}
                          onChange={(e) => setConfig({...config, heroSubtitle: e.target.value})}
                          className="w-full border border-stone-300 rounded px-4 py-2 text-xs uppercase tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CATALOG TAB */}
              {activeTab === 'catalog' && (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800">Inventario y Catálogo</h2>
                      <p className="text-sm text-stone-500 mt-1">Gestiona tus colecciones, precios y detalles de {products.length} productos.</p>
                    </div>
                    <button 
                      onClick={() => setEditingProduct({ id: 'new', name: '', collection: 'Valentina', price: 4200, color: '', design: '', image: '/images/extracted/page_1_img_1.png', descEs: '', descEn: '' })}
                      className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0"
                    >
                      <Plus size={16} />
                      Nuevo Producto
                    </button>
                    {products.length === 0 && (
                      <button 
                        onClick={handleMigrate}
                        disabled={isMigrating}
                        className="bg-stone-800 hover:bg-black text-white px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        <Database size={16} />
                        {isMigrating ? 'Migrando...' : 'Migrar desde constants.js'}
                      </button>
                    )}
                  </div>

                  {/* Search, Filter and View Toggle */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex-1 flex items-center gap-3">
                      <Search className="text-stone-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre, color o colección..." 
                        className="flex-1 outline-none text-sm placeholder:text-stone-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-sm flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => setCatalogViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${catalogViewMode === 'grid' ? 'bg-stone-100 text-stone-900 shadow-sm border border-stone-200/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
                        title="Vista de Cuadrícula"
                      >
                        <Grid size={18} />
                      </button>
                      <button 
                        onClick={() => setCatalogViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${catalogViewMode === 'list' ? 'bg-stone-100 text-stone-900 shadow-sm border border-stone-200/50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
                        title="Vista de Lista"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Content View */}
                  {catalogViewMode === 'list' ? (
                    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                              <th className="p-4 font-semibold">Producto</th>
                              <th className="p-4 font-semibold">Colección</th>
                              <th className="p-4 font-semibold">Color / Diseño</th>
                              <th className="p-4 font-semibold">Precio (MXN)</th>
                              <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {filteredProducts.map((product) => (
                              <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                                <td className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-16 bg-stone-100 rounded overflow-hidden relative border border-stone-200 shrink-0">
                                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <span className="font-serif text-base text-stone-800">{product.name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs tracking-wider">{product.collection}</span>
                                </td>
                                <td className="p-4">
                                  <div className="text-sm text-stone-800">{product.color}</div>
                                  <div className="text-xs text-stone-500">{product.design}</div>
                                </td>
                                <td className="p-4 font-medium text-stone-800">
                                  ${product.price.toLocaleString()}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingProduct(product)} className="text-stone-400 hover:text-amber-700 p-2 transition-colors">
                                      <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-stone-400 hover:text-red-600 p-2 transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredProducts.length === 0 && (
                          <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                            <Layout size={40} className="text-stone-300 mb-4" />
                            <p>No se encontraron productos en tu búsqueda.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                          <div className="relative h-64 bg-stone-100">
                            <Image src={product.image} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
                            {!product.published && (
                              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Oculto</div>
                            )}
                          </div>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-stone-900 uppercase tracking-tighter text-sm">{product.name}</h3>
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] tracking-wider shrink-0 ml-2">{product.collection}</span>
                            </div>
                            <p className="text-stone-500 text-xs line-clamp-2 mb-4 font-light leading-relaxed">{product.color} {product.design ? `- ${product.design}` : ''}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                              <span className="font-serif text-lg text-stone-800">${product.price.toLocaleString()}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingProduct(product)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="col-span-full bg-white border border-stone-200 rounded-xl shadow-sm p-12 text-center text-stone-500 flex flex-col items-center">
                          <Layout size={40} className="text-stone-300 mb-4" />
                          <p>No se encontraron productos en tu búsqueda.</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800">Gestión de Usuarios</h2>
                      <p className="text-sm text-stone-500 mt-1">Administra accesos y roles de administradores ({users.length} usuarios).</p>
                    </div>
                    <button 
                      onClick={() => setIsCreatingUser(true)}
                      className="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                    >
                      <Plus size={14} /> Nuevo Usuario
                    </button>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                            <th className="p-4 font-semibold">Usuario</th>
                            <th className="p-4 font-semibold">Rol</th>
                            <th className="p-4 font-semibold">Estado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-xs">
                                    {user.email[0].toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium">{user.email}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <select 
                                  value={user.role} 
                                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                  className="text-xs border border-stone-200 rounded px-2 py-1 bg-white outline-none focus:border-amber-500"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="editor">Editor</option>
                                </select>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleToggleUserStatus(user.id, user.active)}
                                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded transition-colors ${
                                    user.active 
                                      ? 'text-red-600 hover:bg-red-50' 
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                >
                                  {user.active ? 'Desactivar' : 'Activar'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}


              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800">Control de Inventarios</h2>
                      <p className="text-sm text-stone-500 mt-1">Monitorea el stock en tiempo real y gestiona la visibilidad en tienda.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Inventory Table */}
                    <div className="lg:col-span-3 bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                              <th className="p-4 font-semibold">Producto</th>
                              <th className="p-4 font-semibold">Stock Actual</th>
                              <th className="p-4 font-semibold">Visibilidad</th>
                              <th className="p-4 font-semibold text-right">Ajuste</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {products.map((product) => (
                              <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                  <div className="w-8 h-10 bg-stone-100 relative shrink-0">
                                    <Image src={product.image} fill className="object-cover" alt={product.name} />
                                  </div>
                                  <span className="text-sm font-semibold text-stone-800 uppercase tracking-tighter">{product.name}</span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                    <span className={`text-sm font-bold ${product.stock <= 3 ? 'text-red-600' : 'text-stone-800'}`}>
                                      {product.stock} un.
                                    </span>
                                    {product.stock === 0 && <span className="text-[9px] uppercase font-serif italic text-red-500">Agotado</span>}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <button 
                                    onClick={() => handleToggleVisibility(product.id, product.published)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                      product.published 
                                        ? 'bg-stone-900 text-white' 
                                        : 'bg-stone-100 text-stone-400 border border-stone-200'
                                    }`}
                                  >
                                    {product.published ? <Eye size={12} /> : <EyeOff size={12} />}
                                    {product.published ? 'Visible' : 'Oculto'}
                                  </button>
                                </td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => setSelectedProductForInventory(product)}
                                    className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                                  >
                                    <Activity size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stock Logs Side */}
                    <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm h-fit">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-800 mb-6 flex items-center gap-2">
                        <Activity size={14} className="text-amber-600" />
                        Movimientos Recientes
                      </h3>
                      <div className="space-y-6">
                        {inventoryLogs.map((log, idx) => (
                          <div key={idx} className="relative pl-4 border-l border-stone-100 space-y-1">
                            <div className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ${log.type === 'IN' ? 'bg-green-500' : log.type === 'OUT' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            <p className="text-[10px] uppercase font-bold text-stone-900 tracking-tighter truncate">{log.product?.name}</p>
                            <p className="text-[10px] text-stone-500">
                              <span className={log.type === 'IN' ? 'text-green-600' : 'text-amber-600'}>
                                {log.type === 'IN' ? '+' : '-'}{log.quantity} un.
                              </span>
                              {' · '}{log.reason}
                            </p>
                            <p className="text-[8px] text-stone-400">{new Date(log.createdAt).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* THEME TAB */}
              {activeTab === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Palette size={18} className="text-amber-600" />
                      Apariencia y Colores
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">Color Brand Principal</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={config.primaryColor}
                            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0 shadow-sm"
                          />
                          <input 
                            type="text" 
                            value={config.primaryColor}
                            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                            className="border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 font-mono text-stone-600"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Este color dicta los acentos, botones primarios e interacciones flotantes.</p>
                      </div>
                      
                      <div className="pt-6 border-t border-stone-100">
                        <label className="block text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wide">Color de Fondo Principal</label>
                        <div className="flex gap-4">
                           {['#fafafa', '#ffffff', '#f5f5f4', '#fdfbf7'].map(color => (
                             <button
                               key={color}
                               onClick={() => setConfig({...config, backgroundColor: color})}
                               className={`w-12 h-12 rounded-full border-2 transition-all ${config.backgroundColor === color ? 'border-amber-600 scale-110 shadow-md ring-2 ring-amber-600/20 ring-offset-2' : 'border-stone-200 hover:scale-105'}`}
                               style={{ backgroundColor: color }}
                             />
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MEDIA TAB */}
              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={18} className="text-amber-600" />
                        Galería Multimedia Global
                      </h2>
                      <button className="text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors">
                        <Plus size={14} /> Subir Imagen
                      </button>
                    </div>

                    <p className="text-sm text-stone-500 mb-8 font-light">
                      Gestiona las imágenes maestras que se usan en la página principal, orígenes, banners decorativos u otras vistas no ligadas al inventario.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[
                        { id: 1, src: '/images/Gemini_Generated_Image_de5chode5chode5c.png', tag: 'Hero Cover' },
                        { id: 2, src: '/images/extracted/page_1_img_1.png', tag: 'Textura' },
                        { id: 3, src: '/images/extracted/page_2_img_1.jpeg', tag: 'Detalle Piel' },
                        { id: 4, src: '/images/extracted/page_9_img_1.jpeg', tag: 'Banner Amor' },
                      ].map(img => (
                        <div key={img.id} className="group relative aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                          <Image src={img.src} alt={img.tag} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <span className="text-white text-xs font-bold tracking-widest uppercase mb-3">{img.tag}</span>
                            <div className="flex gap-2">
                              <button className="flex-1 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded py-1.5 text-white transition-colors flex justify-center">
                                <Edit2 size={14} />
                              </button>
                              <button className="flex-1 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded py-1.5 text-white transition-colors flex justify-center">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Modal for Editing/Adding Product */}
        <AnimatePresence>
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
                onClick={() => setEditingProduct(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center shrink-0">
                  <h3 className="font-serif text-2xl">{editingProduct.id === 'new' ? 'Agregar Producto' : 'Editar Producto'}</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-800 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="flex gap-6 items-start">
                      <div className="w-1/3 space-y-2">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">Imagen</label>
                        <div className="aspect-[3/4] bg-stone-100 rounded-lg border border-stone-200 border-dashed flex items-center justify-center relative overflow-hidden group hover:bg-stone-50 transition-colors cursor-pointer">
                          <Image src={editingProduct.image || '/images/extracted/page_1_img_1.png'} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ImageIcon size={24} />
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="URL / Ruta de la imagen" 
                          value={editingProduct.image}
                          onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                          className="w-full text-[10px] p-2 border border-stone-200 rounded outline-none focus:border-amber-500 mt-2"
                        />
                      </div>
                      
                      <div className="w-2/3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Nombre</label>
                            <input 
                              type="text" required
                              value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Colección</label>
                            <select 
                              value={editingProduct.collection} onChange={(e) => setEditingProduct({...editingProduct, collection: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                            >
                              <option value="Valentina">Valentina</option>
                              <option value="Love">Love</option>
                              <option value="Amelia">Amelia</option>
                              <option value="Inés">Inés</option>
                              <option value="Accesorios">Accesorios</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Color</label>
                            <input 
                              type="text" required
                              value={editingProduct.color} onChange={(e) => setEditingProduct({...editingProduct, color: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Precio ($ MXN)</label>
                            <input 
                              type="number" required min="0" step="100"
                              value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Stock Inicial</label>
                            <input 
                              type="number" required min="0"
                              value={editingProduct.stock || 0} onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-3 pt-6">
                            <input 
                              type="checkbox"
                              id="isPublished"
                              checked={editingProduct.published}
                              onChange={(e) => setEditingProduct({...editingProduct, published: e.target.checked})}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-stone-300 rounded"
                            />
                            <label htmlFor="isPublished" className="text-xs font-bold text-stone-700 uppercase tracking-widest cursor-pointer">Publicado</label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Diseño (Bordado / Variante)</label>
                          <input 
                            type="text" required
                            value={editingProduct.design} onChange={(e) => setEditingProduct({...editingProduct, design: e.target.value})}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Descripción Detallada (Español)</label>
                          <textarea 
                            rows="3" required
                            value={editingProduct.descEs || ''} onChange={(e) => setEditingProduct({...editingProduct, descEs: e.target.value})}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setEditingProduct(null)} type="button" className="px-5 py-2 rounded text-stone-600 font-medium hover:bg-stone-200 transition-colors text-sm">
                    Cancelar
                  </button>
                  <button form="productForm" type="submit" className="px-5 py-2 rounded bg-black text-white font-medium hover:bg-stone-800 transition-colors text-sm flex items-center gap-2">
                    <Save size={16} />
                    Guardar Producto
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* INVENTORY ADJUSTMENT MODAL */}
        <AnimatePresence>
          {selectedProductForInventory && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedProductForInventory(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden relative z-10"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="font-serif text-lg">Ajuste de Inventario</h3>
                  <button onClick={() => setSelectedProductForInventory(null)} className="text-stone-400 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleAdjustStock} className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                    <div className="w-12 h-16 bg-white relative border border-stone-200">
                      <Image src={selectedProductForInventory.image} fill className="object-cover" alt="" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-900">{selectedProductForInventory.name}</p>
                      <p className="text-[10px] text-stone-500">Stock Actual: {selectedProductForInventory.stock} unidades</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setInventoryAdjustment({...inventoryAdjustment, type: 'IN'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                        inventoryAdjustment.type === 'IN' ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'border-stone-200 text-stone-400'
                      }`}
                    >
                      <Plus size={14} /> Entrada
                    </button>
                    <button 
                      type="button"
                      onClick={() => setInventoryAdjustment({...inventoryAdjustment, type: 'OUT'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                        inventoryAdjustment.type === 'OUT' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' : 'border-stone-200 text-stone-400'
                      }`}
                    >
                      <Trash2 size={14} /> Salida
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Cantidad</label>
                      <input 
                        type="number" 
                        min="1"
                        value={inventoryAdjustment.quantity}
                        onChange={(e) => setInventoryAdjustment({...inventoryAdjustment, quantity: e.target.value})}
                        className="w-full border border-stone-300 rounded px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Motivo / Razón</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Reabastecimiento, Devolución..."
                        value={inventoryAdjustment.reason}
                        onChange={(e) => setInventoryAdjustment({...inventoryAdjustment, reason: e.target.value})}
                        className="w-full border border-stone-300 rounded px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isAdjustingStock}
                    className="w-full bg-black text-white py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all disabled:opacity-50"
                  >
                    {isAdjustingStock ? 'Procesando...' : 'Aplicar Movimiento'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
 
        {/* NEW USER MODAL */}
        <AnimatePresence>
          {isCreatingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsCreatingUser(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="font-serif text-xl">Nuevo Usuario</h3>
                  <button onClick={() => setIsCreatingUser(false)} className="text-stone-400 hover:text-stone-800">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Email</label>
                    <input 
                      type="email" required
                      value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500"
                      placeholder="admin@0880mx.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Contraseña</label>
                    <input 
                      type="password" required minLength={6}
                      value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Rol</label>
                    <select 
                      value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="admin">Administrador (Acceso Total)</option>
                      <option value="editor">Editor (Sólo Catálogo)</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors mt-4"
                  >
                    Crear Usuario
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
