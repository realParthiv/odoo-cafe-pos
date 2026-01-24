import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  ChefHat,
  Store,
  Grid,
} from "lucide-react";
import { theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout } = useAuth();

  const menuGroups = [
    {
      title: "Main",
      items: [
        {
          path: "/admin",
          icon: LayoutDashboard,
          label: "Overview",
          end: true,
        },
        {
          path: "/admin/floors",
          icon: Grid,
          label: "Floor Plan",
        },
      ],
    },
    {
      title: "Staff",
      items: [
        {
          path: "/admin/cashier",
          icon: Store,
          label: "Cashiers",
        },
        {
          path: "/admin/kitchen",
          icon: ChefHat,
          label: "Kitchen Staff",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          path: "/admin/profile",
          icon: UserCircle,
          label: "Profile",
        },
      ],
    },
  ];

  return (
    <div
      className="w-64 h-screen flex flex-col text-white transition-all duration-300 shadow-xl z-20"
      style={{ backgroundColor: theme.colors.primary }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center space-x-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Odoo Cafe</h1>
          <p className="text-xs text-white/60 font-medium">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <item.icon
                    className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                      item.path === "/admin/kitchen" ? "text-orange-300" : ""
                    }`}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
