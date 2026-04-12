'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Image as ImageIcon, Layout, Type, Palette, Save,
  Eye, LogOut, Users, TrendingUp, Box, Activity, Bell, BellOff,
  DollarSign, AlertTriangle, Trash2, Menu, X,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { translations } from '@/app/data/constants'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getConfig, updateConfig, getUsers, createUser, deleteUser,
  updateUserRole, toggleUserActive, migrateFromConstants,
  getDashboardStats, getInventoryLogs, addInventoryMovement,
  toggleProductVisibility,
} from '@/lib/server-actions'

import DashboardTab from '@/components/admin/DashboardTab'
import CatalogTab from '@/components/admin/CatalogTab'
import SettingsTab from '@/components/admin/SettingsTab'
import UsersTab from '@/components/admin/UsersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import AuditTab from '@/components/admin/AuditTab'
import ProductModal from '@/components/admin/modals/ProductModal'
import InventoryModal from '@/components/admin/modals/InventoryModal'
import UserModal from '@/components/admin/modals/UserModal'

const NOTIFICATION_STORAGE_KEY = 'admin_notifications_0880'
const MAX_STORED_NOTIFICATIONS = 50

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
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Data
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [config, setConfig] = useState(defaultConfig)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [inventoryLogs, setInventoryLogs] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [language, setLanguage] = useState('es')

  // Catalog state
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [catalogViewMode, setCatalogViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const itemsPerPage = 10

  // Modal state
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProductForInventory, setSelectedProductForInventory] = useState(null)
  const [inventoryAdjustment, setInventoryAdjustment] = useState({ type: 'IN', quantity: 1, reason: '' })
  const [isAdjustingStock, setIsAdjustingStock] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'editor' })

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)

  const t = translations[language].admin

  // --- Notification helpers ---
  const addNotification = (type, message, product = null) => {
    const notif = { id: Date.now(), type, message, product, read: false, date: new Date() }
    setNotifications(prev => {
      const updated = [notif, ...prev].slice(0, MAX_STORED_NOTIFICATIONS)
      try { localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.volume = 0.4
      audio.play()
    } catch {}
  }

  // --- Auth guard ---
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // --- Restore notifications from localStorage ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
      if (stored) setNotifications(JSON.parse(stored))
    } catch {}
    const savedLang = localStorage.getItem('language')
    if (savedLang) setLanguage(savedLang)
  }, [])

  // --- Load initial data ---
  useEffect(() => {
    if (status !== 'authenticated') return
    const load = async () => {
      try {
        const [productsData, configData, usersData, statsData, logsData] = await Promise.all([
          getProducts(), getConfig(), getUsers(), getDashboardStats(), getInventoryLogs(),
        ])
        setProducts(productsData || [])
        setConfig(configData || defaultConfig)
        setUsers(usersData || [])
        setDashboardStats(statsData || null)
        setInventoryLogs(logsData || [])
        if (statsData?.orderCount) setLastOrderCount(statsData.orderCount)
      } catch {
        toast.error('Error al cargar datos. Verifica la conexión a la base de datos.')
      } finally {
        setIsLoadingData(false)
      }
    }
    load()
  }, [status])

  // --- Auto-refresh every 60s ---
  useEffect(() => {
    if (status !== 'authenticated') return
    const interval = setInterval(async () => {
      try {
        const statsData = await getDashboardStats()
        if (!statsData) return
        if (lastOrderCount > 0 && statsData.orderCount > lastOrderCount) {
          addNotification('SALE', t.alerts.newSale.replace('{id}', 'Stripe'))
          toast.success('¡Nueva venta recibida!')
        }
        statsData.lowStockProducts?.forEach(p => {
          if (p.stock === 1 && !notifications.find(n => n.product?.id === p.id && n.type === 'LOW_STOCK')) {
            addNotification('LOW_STOCK', `¡Atención! Queda solo 1 unidad de ${p.name}`, p)
          } else if (p.stock === 0 && !notifications.find(n => n.product?.id === p.id && n.type === 'OUT_OF_STOCK')) {
            addNotification('OUT_OF_STOCK', `Producto AGOTADO: ${p.name}`, p)
          }
        })
        setDashboardStats(statsData)
        setLastOrderCount(statsData.orderCount)
      } catch {}
    }, 60000)
    return () => clearInterval(interval)
  }, [status, lastOrderCount, notifications, t.alerts.newSale])

  // --- Handlers ---
  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      await updateConfig({
        siteName: config.siteName, whatsappNumber: config.whatsappNumber, currency: config.currency,
        heroTitle1: config.heroTitle1, heroTitle2: config.heroTitle2, heroSubtitle: config.heroSubtitle,
        primaryColor: config.primaryColor, backgroundColor: config.backgroundColor,
      })
      toast.success('Cambios guardados exitosamente.')
    } catch {
      toast.error('No se pudieron guardar los cambios.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProduct = async (productData) => {
    try {
      if (productData.id === 'new') {
        const created = await createProduct(productData)
        setProducts(prev => [created, ...prev])
        toast.success('Producto agregado.')
      } else {
        const updated = await updateProduct(productData.id, productData)
        setProducts(prev => prev.map(p => p.id === productData.id ? updated : p))
        toast.success('Producto actualizado.')
      }
      setEditingProduct(null)
    } catch {
      toast.error('Error al guardar el producto.')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Producto eliminado.')
    } catch {
      toast.error('Error al eliminar el producto.')
    }
  }

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (!selectedProductForInventory) return
    setIsAdjustingStock(true)
    try {
      await addInventoryMovement({
        productId: selectedProductForInventory.id,
        type: inventoryAdjustment.type,
        quantity: parseInt(inventoryAdjustment.quantity),
        reason: inventoryAdjustment.reason || (inventoryAdjustment.type === 'IN' ? 'Entrada manual' : 'Salida manual'),
      })
      const diff = inventoryAdjustment.type === 'IN' ? parseInt(inventoryAdjustment.quantity) : -parseInt(inventoryAdjustment.quantity)
      setProducts(prev => prev.map(p => p.id === selectedProductForInventory.id ? { ...p, stock: p.stock + diff } : p))
      const newLogs = await getInventoryLogs()
      setInventoryLogs(newLogs)
      toast.success('Inventario actualizado.')
      setSelectedProductForInventory(null)
      setInventoryAdjustment({ type: 'IN', quantity: 1, reason: '' })
    } catch {
      toast.error('Error al ajustar inventario.')
    } finally {
      setIsAdjustingStock(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      const created = await createUser(newUser)
      setUsers(prev => [created, ...prev])
      toast.success('Usuario creado.')
      setIsCreatingUser(false)
      setNewUser({ email: '', password: '', role: 'editor' })
    } catch (error) {
      toast.error(error.message || 'Error al crear usuario.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario permanentemente?')) return
    try {
      await deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('Usuario eliminado.')
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario.')
    }
  }

  const handleUpdateRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Rol actualizado.')
    } catch {
      toast.error('Error al actualizar rol.')
    }
  }

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      await toggleUserActive(userId, !currentActive)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u))
      toast.success('Estado actualizado.')
    } catch {
      toast.error('Error al actualizar usuario.')
    }
  }

  const handleMigrate = async () => {
    if (!confirm('¿Migrar productos desde constants.js? Esto reemplazará el catálogo actual.')) return
    setIsMigrating(true)
    try {
      const result = await migrateFromConstants()
      if (result.success) {
        toast.success(`${result.count} productos importados.`)
        const updated = await getProducts()
        setProducts(updated)
      }
    } catch {
      toast.error('Error durante la migración.')
    } finally {
      setIsMigrating(false)
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'catalog', label: 'Catálogo', icon: Layout },
    { id: 'inventory', label: 'Inventario', icon: Box },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'audit', label: 'Auditoría', icon: Activity },
    { id: 'general', label: 'General', icon: Settings },
    { id: 'hero', label: 'Hero & Textos', icon: Type },
    { id: 'theme', label: 'Apariencia', icon: Palette },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
  ]

  const settingsTabs = ['general', 'hero', 'theme', 'media']
  const wideLayout = ['catalog', 'inventory', 'dashboard', 'audit', 'users']

  if (status === 'loading' || isLoadingData) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-stone-300 border-t-black animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-stone-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex flex-col md:flex-row">
      <Toaster position="top-right" />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[40] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 w-64 bg-white border-r border-stone-200 h-screen flex flex-col z-[50] transition-transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-serif text-xs font-bold">0880</div>
            <span className="font-bold tracking-widest uppercase text-xs">Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-stone-400 p-1"><X size={20} /></button>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-sm font-medium ${activeTab === item.id ? 'bg-amber-50 text-amber-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-100">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs uppercase tracking-widest border border-stone-300 rounded hover:bg-stone-50 transition-colors">
            <Eye size={14} /> Ver Sitio
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="font-serif text-sm md:text-xl truncate max-w-[150px] md:max-w-none">
              {navItems.find(i => i.id === activeTab)?.label || 'Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative ${notifications.some(n => !n.read) ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:bg-stone-50'}`}
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-stone-200 shadow-xl rounded-xl z-40 overflow-hidden"
                    >
                      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Notificaciones</h3>
                        {notifications.length > 0 && (
                          <button onClick={() => {
                            setNotifications([])
                            try { localStorage.removeItem(NOTIFICATION_STORAGE_KEY) } catch {}
                          }} className="text-[9px] font-bold text-red-600 uppercase hover:underline">
                            Borrar todas
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <BellOff size={24} className="mx-auto text-stone-200 mb-2" />
                            <p className="text-xs text-stone-400 italic">No hay avisos nuevos</p>
                          </div>
                        ) : notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-stone-50 flex gap-3 hover:bg-stone-50 cursor-pointer group ${!n.read ? 'bg-amber-50/30' : ''}`}
                            onClick={() => {
                              if (n.product) { setActiveTab('catalog'); setStockFilter(n.type === 'OUT_OF_STOCK' ? 'out' : 'low'); setShowNotifications(false) }
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
                            }}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'SALE' ? 'bg-green-100 text-green-600' : n.type === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {n.type === 'SALE' ? <DollarSign size={14} /> : <AlertTriangle size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] leading-tight text-stone-700">{n.message}</p>
                              <p className="text-[9px] text-stone-400 mt-1">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(item => item.id !== n.id)) }} className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 bg-stone-50 text-center border-t border-stone-100 text-[10px] text-stone-500">
                          {notifications.filter(n => !n.read).length} no leídas
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {settingsTabs.includes(activeTab) && (
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="flex items-center gap-2 bg-black text-white px-3 md:px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div> : <Save size={16} />}
                <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            )}

            <div className="h-4 w-px bg-stone-200"></div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2 text-stone-400 hover:text-red-600 px-3 py-2 rounded-lg transition-colors group" title="Cerrar Sesión">
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className={`${wideLayout.includes(activeTab) ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>
            <AnimatePresence mode="popLayout">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                {activeTab === 'dashboard' && (
                  <DashboardTab
                    dashboardStats={dashboardStats}
                    t={t}
                    onNavigateTo={(tab, filter) => { setActiveTab(tab); if (filter) setStockFilter(filter); setCurrentPage(1) }}
                  />
                )}

                {activeTab === 'catalog' && (
                  <CatalogTab
                    products={products}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    stockFilter={stockFilter} setStockFilter={setStockFilter}
                    catalogViewMode={catalogViewMode} setCatalogViewMode={setCatalogViewMode}
                    currentPage={currentPage} setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    isMigrating={isMigrating}
                    onNewProduct={() => setEditingProduct({ id: 'new', name: '', collection: 'Valentina', price: 4200, color: '', design: '', image: '', descEs: '', descEn: '', stock: 0, published: true })}
                    onEditProduct={(p) => setEditingProduct(p)}
                    onDeleteProduct={handleDeleteProduct}
                    onOpenInventory={(p) => { setSelectedProductForInventory(p); setInventoryAdjustment({ type: 'IN', quantity: 1, reason: '' }) }}
                    onMigrate={handleMigrate}
                  />
                )}

                {activeTab === 'inventory' && <InventoryTab inventoryLogs={inventoryLogs} />}

                {activeTab === 'users' && (
                  <UsersTab
                    users={users}
                    userPage={userPage} setUserPage={setUserPage}
                    itemsPerPage={itemsPerPage}
                    onNewUser={() => setIsCreatingUser(true)}
                    onUpdateRole={handleUpdateRole}
                    onToggleStatus={handleToggleUserStatus}
                    onDeleteUser={handleDeleteUser}
                  />
                )}

                {activeTab === 'audit' && <AuditTab />}

                {settingsTabs.includes(activeTab) && <SettingsTab activeTab={activeTab} config={config} setConfig={setConfig} />}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {editingProduct && (
            <ProductModal
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onSave={handleSaveProduct}
            />
          )}
          {selectedProductForInventory && (
            <InventoryModal
              product={selectedProductForInventory}
              adjustment={inventoryAdjustment}
              setAdjustment={setInventoryAdjustment}
              isAdjusting={isAdjustingStock}
              onClose={() => setSelectedProductForInventory(null)}
              onSubmit={handleAdjustStock}
            />
          )}
          {isCreatingUser && (
            <UserModal
              newUser={newUser}
              setNewUser={setNewUser}
              onClose={() => setIsCreatingUser(false)}
              onSubmit={handleCreateUser}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
