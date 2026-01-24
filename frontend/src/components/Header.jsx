import React from "react";
import { Bell, Search } from "lucide-react";
import { theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header
      className="h-16 px-8 flex items-center justify-between shadow-sm"
      style={{
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <h2
        className="text-xl font-bold"
        style={{ color: theme.colors.text.primary }}
      >
        {title}
      </h2>

      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-full text-sm border focus:outline-none focus:ring-1"
            style={{
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
              "--tw-ring-color": theme.colors.primary,
            }}
          />
        </div>

        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p
              className="text-sm font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              {user?.first_name} {user?.last_name}
            </p>
            <p
              className="text-xs"
              style={{ color: theme.colors.text.secondary }}
            >
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: theme.colors.secondary }}
          >
            {user?.first_name?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
