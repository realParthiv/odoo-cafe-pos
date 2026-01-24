import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  LayoutGrid, 
  Armchair, 
  UtensilsCrossed,
  Loader2
} from "lucide-react";
import { theme } from "../../theme/theme";
import { tableService } from '../../services/apiService';

const FloorConfiguration = () => {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        setLoading(true);
        const response = await tableService.getFloors();
        const data = response.results || [];
        setFloors(data);
        if (data.length > 0) {
          setSelectedFloorId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch floors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFloors();
  }, []);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const tables = selectedFloor ? selectedFloor.tables : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (floors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
        <Layers className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Floors Configured</h3>
        <p className="text-gray-500 max-w-xs">Contact an administrator to set up restaurant floors and tables.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Floor Layout</h1>
            <p className="text-gray-500 text-sm mt-1">View active restaurant seating and capacity</p>
          </div>
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
                className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                  selectedFloorId === floor.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {floor.tables?.length || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Floor Stats Bar */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 px-8 py-3 flex justify-between items-center text-sm text-gray-500 sticky top-0 z-10">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Armchair className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                Total Capacity:{" "}
                <span className="font-bold text-gray-900">
                  {tables.reduce((acc, t) => acc + (parseInt(t.capacity) || 0), 0)}
                </span>
              </span>
            </div>
            <div className="flex items-center">
              <UtensilsCrossed className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                Active Tables:{" "}
                <span className="font-bold text-gray-900">{tables.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {tables.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-500">This floor has no tables</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md hover:border-blue-100"
                >
                  <div className="flex flex-col items-center justify-center py-6">
                    <div
                      className={`
                      w-24 h-24 mb-5 flex items-center justify-center border-2 text-gray-500 bg-gray-50 transition-colors
                      ${
                        table.shape === "round" || table.shape === "circle"
                          ? "rounded-full"
                          : "rounded-2xl"
                      }
                    `}
                    >
                      <span className="font-bold text-2xl">
                        {table.table_number}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm bg-gray-100 px-4 py-1.5 rounded-full">
                      <Users className="w-3 h-3 mr-2" />
                      <span className="font-medium">
                        {table.capacity} Seats
                      </span>
                    </div>
                    {table.name && (
                      <span className="text-xs text-gray-400 mt-2 italic">
                        {table.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorConfiguration;
