import React from "react";
import { Menu } from "lucide-react";
import { theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

const Header = ({ title, onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header
      className="h-16 px-4 md:px-8 flex items-center justify-between shadow-sm bg-white"
      style={{
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2
          className="text-lg md:text-xl font-bold truncate"
          style={{ color: theme.colors.text.primary }}
        >
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-6">
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
