import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import StaffManagement from "./StaffManagement";
import FloorManagement from "./FloorManagement";
import { theme } from "../../theme/theme";
import {
  tableService,
  orderService,
  settingsService,
} from "../../services/apiService";
import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingBasket,
  Users,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Overview = () => {
  const [stats, setStats] = useState({
    total_sales: 0,
    total_orders: 0,
    completed_orders: 0,
  });
  const [salesHistory, setSalesHistory] = useState([]);
  const [cashierStats, setCashierStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily'); // hourly, daily, monthly, yearly

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, historyRes, cashierRes] = await Promise.all([
          orderService.getDashboardStats(period),
          orderService.getSalesHistory(30, period),
          orderService.getCashierPerformance(),
        ]);

        if (statsRes.success && statsRes.data?.summary) {
          setStats(statsRes.data.summary);
        }

        if (historyRes.success && historyRes.data?.history) {
          setSalesHistory(historyRes.data.history);
        }

        if (cashierRes.success && cashierRes.data?.cashiers) {
          setCashierStats(cashierRes.data.cashiers);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // Default data for when there is no history
  const defaultData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      sales: 0,
      orders: 0,
    };
  });

  const chartData = salesHistory.length > 0 ? salesHistory : defaultData;

  const StatCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    iconColorClass,
    subValue,
  }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div
        className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">
          Welcome back to your restaurant control center.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Sales"
          value={`$${stats.total_sales?.toLocaleString() || "0"}`}
          icon={DollarSign}
          colorClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
          subValue="All time revenue"
        />
        <StatCard
          title="Total Orders"
          value={stats.total_orders || "0"}
          icon={ShoppingBasket}
          colorClass="bg-blue-50"
          iconColorClass="text-blue-600"
          subValue={`${stats.completed_orders || 0} completed`}
        />
        <StatCard
          title="Avg. Order Value"
          value={`$${stats.avg_order_value?.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          colorClass="bg-violet-50"
          iconColorClass="text-violet-600"
          subValue="Per transaction"
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            Sales Overview
          </h3>
          <div className="flex gap-2">
            {['hourly', 'daily', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`$${value}`, "Sales"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cashier Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Cashier Performance
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track cashier sales, sessions, and productivity
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Avg. Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sales/Hour
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan="7" className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : cashierStats.length > 0 ? (
                cashierStats.map((cashier) => (
                  <tr
                    key={cashier.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                          {cashier.first_name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cashier.first_name} {cashier.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cashier.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-emerald-600">
                        ${cashier.total_sales?.toLocaleString() || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cashier.total_orders || 0}
                      </div>
                      <div className="text-xs text-gray-500">orders</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cashier.sessions_count || 0}
                      </div>
                      <div className="text-xs text-gray-500">sessions</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cashier.total_hours_worked?.toFixed(1) || "0.0"}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${cashier.avg_per_order?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        $
                        {cashier.total_hours_worked > 0
                          ? (
                              cashier.total_sales / cashier.total_hours_worked
                            ).toFixed(0)
                          : "0"}
                        /hr
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No cashier data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [formData, setFormData] = useState({
    name: "Odoo Cafe POS",
    frontend_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await settingsService.updateMobileOrderSettings(formData);
      setMessage({ type: "success", text: "Settings updated successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update settings",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Mobile Order Settings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure your public facing mobile ordering page
          </p>
        </div>

        <div className="p-6">
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cafe Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="e.g. My Awesome Cafe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frontend URL
              </label>
              <input
                type="url"
                value={formData.frontend_url}
                onChange={(e) =>
                  setFormData({ ...formData, frontend_url: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="https://..."
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                The public URL where customers can place orders
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {loading ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Admin Dashboard"
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="floors" element={<FloorManagement />} />
            <Route
              path="cashier"
              element={<StaffManagement role="cashier" />}
            />
            <Route
              path="kitchen"
              element={<StaffManagement role="kitchen" />}
            />

            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Admin;
