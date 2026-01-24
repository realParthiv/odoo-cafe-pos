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
  QrCode,
  Download,
} from "lucide-react";
import { theme } from "../../theme/theme";
import { tableService } from "../../services/apiService";

const FloorManagement = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [newTableData, setNewTableData] = useState({
    name: "",
    seats: 4,
    shape: "square",
  });

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [floorsResponse, tablesResponse] = await Promise.all([
        tableService.getFloors(),
        tableService.getTables(),
      ]);

      const floorsList =
        floorsResponse.data?.floors ||
        floorsResponse.results ||
        floorsResponse.data ||
        [];
      const tablesList =
        tablesResponse.data?.tables ||
        tablesResponse.results ||
        tablesResponse.data ||
        [];

      const mergedFloors = floorsList.map((floor) => ({
        id: floor.id,
        name: floor.name,
        number: floor.number,
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
      fetchData();
    } catch (error) {
      console.error("Failed to create floor:", error);
      if (error.errors) {
        const errorMsg = Object.values(error.errors).flat().join("\n");
        alert(errorMsg);
      } else {
        alert(error.message || "Failed to create floor. Please try again.");
      }
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
      if (error.errors) {
        const errorMsg = Object.values(error.errors).flat().join("\n");
        alert(errorMsg);
      } else {
        alert(error.message || "Failed to create table. Please try again.");
      }
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

  const handleViewQr = async (e, table) => {
    e.stopPropagation();
    setSelectedQrTable(table);
    setShowQrModal(true);
    setQrLoading(true);
    setQrImageUrl(null);

    try {
      const blob = await tableService.getQrCode(table.id);
      const url = URL.createObjectURL(blob);
      setQrImageUrl(url);
    } catch (error) {
      console.error("Failed to load QR code:", error?.response);
      const errorMsg = error?.response?.data || "Unknown error";
      //   alert(`Failed to load QR code: ${errorMsg}`);
      setShowQrModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadPdf = async (e, table) => {
    e.stopPropagation();
    try {
      const blob = await tableService.downloadQrPdf(table.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `table_${table.name}_qr.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF");
    }
  };

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
                group relative px-6 py-2.5 rounded-full cursor-pointer transition-all duration-300 flex items-center min-w-[120px] justify-center border font-medium select-none
                ${
                  selectedFloorId === floor.id
                    ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20 transform scale-105"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
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
            className="px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-300 rounded-lg transition-all duration-200 flex items-center whitespace-nowrap"
            title="Add New Floor"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">New Floor</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-hidden flex flex-col relative bg-gray-50/50"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
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
                      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-4 relative group hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    >
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex space-x-1">
                        <button
                          onClick={(e) => handleViewQr(e, table)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(e, table)}
                          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(selectedFloorId, table.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Table"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center py-6">
                        <div
                          className={`
                          mb-4 flex items-center justify-center shadow-sm transition-all duration-300
                          ${
                            table.shape === "circle"
                              ? "w-24 h-24 rounded-full"
                              : table.shape === "rectangle"
                                ? "w-32 h-20 rounded-xl"
                                : "w-24 h-24 rounded-2xl"
                          }
                          bg-slate-100 border-2 border-slate-300 text-slate-600 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:bg-blue-50
                        `}
                        >
                          <span className="font-bold text-2xl">
                            {table.name}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-xs bg-gray-100 px-3 py-1 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Users className="w-3 h-3 mr-1.5" />
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
                  placeholder="e.g. 1, 2, 3"
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
                  placeholder={`e.g. ${selectedFloor?.number || 1}01, ${selectedFloor?.number || 1}02`}
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
                    <option value="circle">Circle</option>
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

      {/* View QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 m-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Table {selectedQrTable?.name} QR
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-64 h-64 bg-gray-50 rounded-xl flex items-center justify-center mb-6 border border-gray-100">
              {qrLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Table QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <p className="text-gray-400 text-sm">Failed to load QR</p>
              )}
            </div>

            <button
              onClick={(e) => handleDownloadPdf(e, selectedQrTable)}
              className="w-full py-3 text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Download className="w-5 h-5 mr-2" /> Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorManagement;
