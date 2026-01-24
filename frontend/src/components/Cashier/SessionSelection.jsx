import React, { useState, useEffect } from "react";
import { sessionService, tableService } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { theme } from "../../theme/theme";
import { LogOut, Store, DollarSign, MapPin } from "lucide-react";

const SessionSelection = ({ onSessionOpen }) => {
  const { logout } = useAuth();
  const [startingCash, setStartingCash] = useState("1000");
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");

  useEffect(() => {
    const fetchLastSession = async () => {
      try {
        const data = await sessionService.getLastSession();
        setLastSession(data.data);
      } catch (error) {
        console.log("No previous session found");
      }
    };

    const fetchFloors = async () => {
      try {
        const response = await tableService.getFloorAvailability();
        const floorsList = Array.isArray(response)
          ? response
          : response.data || response.floors || [];
        setFloors(Array.isArray(floorsList) ? floorsList : []);
      } catch (error) {
        console.error("Failed to fetch floors", error);
        setFloors([]);
      }
    };

    fetchLastSession();
    fetchFloors();
  }, []);

  const handleOpenSession = async () => {
    if (!startingCash || parseFloat(startingCash) < 0) {
      alert("Please enter a valid starting cash amount");
      return;
    }

    if (!selectedFloorId) {
      alert("Please select a floor");
      return;
    }

    try {
      const response = await sessionService.openSession({
        starting_cash: parseFloat(startingCash),
        floor_id: selectedFloorId,
      });
      onSessionOpen(response.data);
    } catch (error) {
      console.error("Failed to open session:", error);
      alert("Failed to open session: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Point of Sale
              </h1>
              <p className="text-white/70 text-sm">Session Management</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {/* Card Header */}
          <div
            className="p-6 border-b text-center"
            style={{ borderColor: theme.colors.border }}
          >
            <h2
              className="text-xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              {lastSession?.restaurant_name || "Odoo Cafe"}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {showOpenForm ? "Configure New Session" : "Ready to Start?"}
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {!showOpenForm ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-sm">Last Opened</span>
                    <span className="font-medium text-gray-900">
                      {lastSession?.start_time
                        ? new Date(lastSession.start_time).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-sm">
                      Closing Balance
                    </span>
                    <span className="font-medium text-gray-900">
                      {lastSession?.closing_cash
                        ? `$${lastSession.closing_cash}`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowOpenForm(true)}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transform transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.accent})`,
                  }}
                >
                  Open New Session
                </button>
              </>
            ) : (
              <div className="space-y-5">
                {/* Floor Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Select Floor
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none bg-white"
                      value={selectedFloorId}
                      onChange={(e) => setSelectedFloorId(e.target.value)}
                      style={{
                        borderColor: theme.colors.border,
                        "--tw-ring-color": theme.colors.secondary,
                      }}
                    >
                      <option value="">Choose a floor...</option>
                      {floors.map((floor) => (
                        <option
                          key={floor.id}
                          value={floor.id}
                          disabled={floor.is_occupied}
                        >
                          {floor.name}{" "}
                          {floor.is_occupied
                            ? `(Occupied by ${floor.occupied_by?.name})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cash Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Opening Cash
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      value={startingCash}
                      onChange={(e) => setStartingCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{
                        borderColor: theme.colors.border,
                        "--tw-ring-color": theme.colors.secondary,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowOpenForm(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpenSession}
                    className="flex-1 py-3 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: theme.colors.secondary }}
                  >
                    Confirm & Open
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSelection;
