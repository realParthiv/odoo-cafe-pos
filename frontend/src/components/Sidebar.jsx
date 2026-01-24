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
  Settings,
} from "lucide-react";
import { theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, onClose, role = "admin", onCloseSession }) => {
  const { logout } = useAuth();

  const adminMenuGroups = [
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
          path: "/admin/settings",
          icon: Settings,
          label: "Settings",
        },
      ],
    },
  ];

  const cashierMenuGroups = [
    {
      title: "POS",
      items: [
        {
          path: "/cashier",
          icon: Grid,
          label: "Tables",
          end: true,
        },
        {
          path: "/cashier/orders",
          icon: LayoutDashboard,
          label: "Orders",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          path: "/cashier/mobile-orders",
          icon: Grid,
          label: "Mobile Order",
        },
        {
          path: "/cashier/products",
          icon: Store,
          label: "Product Creation",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          path: "/cashier/profile",
          icon: UserCircle,
          label: "My Profile",
        },
      ],
    },
  ];

  const menuGroups = role === "cashier" ? cashierMenuGroups : adminMenuGroups;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64 bg-white text-white transition-transform duration-300 transform 
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 flex flex-col shadow-xl md:shadow-none h-full
        `}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Odoo Cafe</h1>
              <p className="text-xs text-white/60 font-medium">
                {role === "cashier" ? "Cashier Portal" : "Admin Portal"}
              </p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
          >
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
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
                    onClick={() => onClose && onClose()} // Close on navigation on mobile
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
        <div className="p-4 border-t border-white/10 bg-black/10 space-y-2">
          {role === "cashier" && onCloseSession && (
            <button
              onClick={onCloseSession}
              className="flex items-center w-full px-4 py-3 rounded-lg text-orange-200 hover:bg-orange-500/20 hover:text-orange-100 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Close Session</span>
            </button>
          )}
          {role !== "cashier" && (
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
