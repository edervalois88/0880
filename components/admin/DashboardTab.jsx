'use client'

import { DollarSign, ShoppingCart, TrendingUp, Package, Activity, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardTab({ dashboardStats, t, onNavigateTo }) {
  return (
    <div className="space-y-6">
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

        <div
          onClick={() => onNavigateTo('catalog', 'low')}
          className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm cursor-pointer hover:border-red-200 hover:bg-red-50/10 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${dashboardStats?.lowStockCount > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-stone-100 text-stone-600'}`}>
              <Package size={20} />
            </div>
            {dashboardStats?.lowStockCount > 0 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-tighter animate-pulse">Revisar</span>
            )}
          </div>
          <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">{t.stats.lowStock}</p>
          <h3 className="text-2xl font-serif text-stone-900 mt-1">{dashboardStats?.lowStockCount || 0}</h3>
          <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">Click para ver listado <ArrowRight size={10} /></p>
        </div>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp size={120} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-8 text-stone-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity size={16} className="text-amber-600" />
              Ingresos Recientes (7d)
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600"></div>
              <span className="text-[10px] font-medium text-stone-500">Ventas</span>
            </div>
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              {dashboardStats?.salesByDay?.length > 0 ? (
                <AreaChart data={dashboardStats.salesByDay}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3' }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip cursor={{ stroke: '#d97706', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                  <Area type="monotone" dataKey="ventas" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" animationDuration={2000} />
                </AreaChart>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-300 text-xs italic">
                  Sin datos de ventas aún
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-stone-800 flex items-center gap-2">
            <Activity size={16} className="text-amber-600" />
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {dashboardStats?.recentActivity?.length > 0 ? dashboardStats.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex gap-3 p-2 group hover:bg-stone-50 rounded-lg transition-colors">
                <div className={`w-1 h-10 rounded-full shrink-0 ${activity.type === 'SALE' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-stone-900 uppercase tracking-tighter truncate">{activity.product.name}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{activity.type === 'SALE' ? 'Venta' : activity.reason}</p>
                  <p className="text-[8px] text-stone-400 mt-1 uppercase">{new Date(activity.createdAt).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold ${activity.type === 'SALE' ? 'text-green-600' : 'text-stone-400'}`}>
                    {activity.type === 'IN' ? `+${activity.quantity}` : `-${activity.quantity}`}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-stone-400 italic text-center py-8">Sin actividad reciente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
