import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Users,
  LayoutGrid,
  X,
  Loader2,
  Armchair,
  UtensilsCrossed,
} from "lucide-react";
import { theme } from "../../theme/theme";
import { tableService } from "../../services/apiService";

const FloorManagement = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);

  // Form States
  const [newFloorName, setNewFloorName] = useState("");
  const [newTableData, setNewTableData] = useState({
    name: "",
    seats: 4,
    shape: "square",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [floorsResponse, tablesResponse] = await Promise.all([
        tableService.getFloors(),
        tableService.getTables(),
      ]);

      const floorsList = floorsResponse.data || [];
      const tablesList = tablesResponse.data || [];

      // Merge tables into floors
      const mergedFloors = floorsList.map((floor) => ({
        id: floor.id,
        name: floor.name,
        tables: tablesList
          .filter((t) => t.floor === floor.id)
          .map((t) => ({
            id: t.id,
            name: t.table_number,
            seats: t.capacity,
            shape: t.shape,
          })),
      }));

      setFloors(mergedFloors);

      // Set initial selected floor if none selected or current selection invalid
      if (mergedFloors.length > 0) {
        if (
          !selectedFloorId ||
          !mergedFloors.find((f) => f.id === selectedFloorId)
        ) {
          setSelectedFloorId(mergedFloors[0].id);
        }
      } else {
        setSelectedFloorId(null);
      }
    } catch (error) {
      console.error("Failed to fetch floor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  const handleAddFloor = async (e) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;

    try {
      await tableService.createFloor({
        name: newFloorName,
        number: floors.length + 1,
      });

      setNewFloorName("");
      setShowAddFloor(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to create floor:", error);
      alert("Failed to create floor. Please try again.");
    }
  };

  const handleDeleteFloor = async (id, e) => {
    e.stopPropagation();
    if (
      window.confirm("Are you sure? All tables on this floor will be deleted.")
    ) {
      try {
        await tableService.deleteFloor(id);
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Failed to delete floor:", error);
        alert("Failed to delete floor. Please try again.");
      }
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableData.name.trim()) return;

    try {
      await tableService.createTable({
        table_number: newTableData.name,
        capacity: parseInt(newTableData.seats),
        floor: selectedFloorId,
        shape: newTableData.shape,
      });

      setNewTableData({ name: "", seats: 4, shape: "square" });
      setShowAddTable(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to create table:", error);
      alert("Failed to create table. Please try again.");
    }
  };

  const handleDeleteTable = async (floorId, tableId) => {
    if (window.confirm("Delete this table?")) {
      try {
        await tableService.deleteTable(tableId);
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Failed to delete table:", error);
        alert("Failed to delete table. Please try again.");
      }
    }
  };

  if (loading && floors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Floor Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Organize your restaurant layout and seating
            </p>
          </div>
          {floors.length > 0 && (
            <button
              onClick={() => setShowAddTable(true)}
              disabled={!selectedFloorId}
              className={`px-5 py-2.5 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center ${
                !selectedFloorId
                  ? "opacity-50 cursor-not-allowed bg-gray-400"
                  : "hover:opacity-90 hover:scale-105 active:scale-95"
              }`}
              style={{
                backgroundColor: !selectedFloorId
                  ? undefined
                  : theme.colors.primary,
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Table
            </button>
          )}
        </div>

        {/* Floor Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {floors.map((floor) => (
            <div
              key={floor.id}
              onClick={() => setSelectedFloorId(floor.id)}
              className={`
                group relative px-6 py-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center min-w-[140px] justify-center border
                ${
                  selectedFloorId === floor.id
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span className="font-medium">{floor.name}</span>
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  selectedFloorId === floor.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {floor.tables.length}
              </span>

              {/* Delete Floor Button */}
              <button
                onClick={(e) => handleDeleteFloor(floor.id, e)}
                className={`
                  absolute -top-2 -right-2 p-1 rounded-full bg-white border shadow-sm text-gray-400 hover:text-red-500 hover:border-red-200
                  opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100
                `}
                title="Delete Floor"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowAddFloor(true)}
            className="px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-300 rounded-lg transition-all duration-200 flex items-center"
            title="Add New Floor"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">New Floor</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {floors.length === 0 ? (
          // Empty State - No Floors
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Layers className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Floors Created Yet
            </h3>
            <p className="text-gray-500 max-w-md mb-8">
              Start by creating a floor (e.g., "Ground Floor", "Patio") to begin
              organizing your tables.
            </p>
            <button
              onClick={() => setShowAddFloor(true)}
              className="px-6 py-3 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Plus className="w-5 h-5 mr-2" /> Create First Floor
            </button>
          </div>
        ) : (
          <>
            {/* Floor Stats Bar */}
            <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 px-8 py-3 flex justify-between items-center text-sm text-gray-500 sticky top-0 z-10">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <Armchair className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    Capacity:{" "}
                    <span className="font-bold text-gray-900">
                      {selectedFloor?.tables.reduce(
                        (acc, t) => acc + parseInt(t.seats),
                        0,
                      ) || 0}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <UtensilsCrossed className="w-4 h-4 mr-2 text-gray-400" />
                  <span>
                    Tables:{" "}
                    <span className="font-bold text-gray-900">
                      {selectedFloor?.tables.length || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="flex-1 overflow-y-auto p-8">
              {selectedFloor?.tables.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-gray-500">
                    {selectedFloor.name} is empty
                  </p>
                  <p className="text-sm mt-2 mb-6">
                    Add tables to start seating guests here.
                  </p>
                  <button
                    onClick={() => setShowAddTable(true)}
                    className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                  >
                    Add Table
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {selectedFloor?.tables.map((table) => (
                    <div
                      key={table.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 relative group hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer transform hover:-translate-y-1"
                    >
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(selectedFloorId, table.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center py-8">
                        <div
                          className={`
                          w-24 h-24 mb-5 flex items-center justify-center border-2 text-gray-400 bg-gray-50 transition-colors group-hover:border-blue-500 group-hover:text-blue-500
                          ${
                            table.shape === "round"
                              ? "rounded-full"
                              : "rounded-2xl"
                          }
                          ${table.shape === "rectangle" ? "w-32" : ""}
                        `}
                        >
                          <span className="font-bold text-2xl">
                            {table.name}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm bg-gray-100 px-4 py-1.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Users className="w-3 h-3 mr-2" />
                          <span className="font-medium">
                            {table.seats} Seats
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Floor Modal */}
      {showAddFloor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 m-4 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Create New Floor
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Give your new floor area a name.
            </p>
            <form onSubmit={handleAddFloor}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Floor Name
                </label>
                <input
                  type="text"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g. Main Hall, Patio, Rooftop"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddFloor(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-blue-500/30 transition-all"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Create Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Add New Table
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Adding to{" "}
                  <span className="font-bold">{selectedFloor?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Table Name / Number
                </label>
                <input
                  type="text"
                  required
                  value={newTableData.name}
                  onChange={(e) =>
                    setNewTableData({ ...newTableData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. T-12, Table 5"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={newTableData.seats}
                      onChange={(e) =>
                        setNewTableData({
                          ...newTableData,
                          seats: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Shape
                  </label>
                  <select
                    value={newTableData.shape}
                    onChange={(e) =>
                      setNewTableData({
                        ...newTableData,
                        shape: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white"
                  >
                    <option value="square">Square</option>
                    <option value="round">Round</option>
                    <option value="rectangle">Rectangle</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-blue-500/30 transition-all"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorManagement;
