import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calculator,
  Trophy,
  Target,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// API Configuration
const API_BASE_URL = "http://localhost:3001/api";

// API Service Functions
const apiService = {
  async getPointsTable() {
    try {
      const response = await axios.get(`${API_BASE_URL}/points-table`);
      return response.data; // axios auto-parses JSON
    } catch (error) {
      throw new Error("Failed to fetch points table");
    }
  },

  async calculatePosition(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Calculation failed");
    }
  },
};

export default function CricHeroes() {
  const [formData, setFormData] = useState({
    userTeam: "",
    oppositionTeam: "",
    matchOvers: 20,
    desiredPosition: 3,
    tossResult: "batting",
    runs: "",
  });

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pointsTable, setPointsTable] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Check API connection and load initial data
  const checkConnection = async () => {
    try {
      // Load teams and points table
      const pointsResponse = await apiService.getPointsTable();
      setIsConnected(true);

      // Store the points table
      setPointsTable(pointsResponse.data);
    } catch (err) {
      setIsConnected(false);
      setError(
        "Unable to connect to backend server. Please ensure the server is running on port 3001."
      );
    }
  };

  useEffect(() => {
    checkConnection(); // Check once on load

    const interval = setInterval(() => {
      if (!isConnected) {
        checkConnection();
        setError(""); // Try again ONLY if previously disconnected
      }
    }, 5000);

    return () => clearInterval(interval); //clean up function
  }, [isConnected]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isConnected) {
      setError(
        "Backend server is not connected. Please start the server first."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiService.calculatePosition(formData);
      //   console.log(formData);
      if (response.success) {
        setResult(response.data);
        console.log(response.data);
      } else {
        // console.log(response.error);
        throw new Error(response.error || "Calculation failed");
      }
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      userTeam: "",
      oppositionTeam: "",
      matchOvers: 20,
      desiredPosition: 3,
      tossResult: "batting",
      runs: "",
    }));
    setResult(null);
  };
  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-800">
              Points Table Calculator
            </h1>
          </div>
          <p className="text-gray-600">
            Calculate what your team needs to reach desired position
          </p>

          {/* Connection Status */}
          <div className="mt-4 flex justify-center">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "🟢 Backend Connected" : "🔴 Backend Disconnected"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Match Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Your Team
                </label>
                <select
                  name="userTeam"
                  value={formData.userTeam}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  required
                  disabled={!isConnected}
                >
                  <option value="">Select your team</option>
                  {pointsTable.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Opposition Team
                </label>
                <select
                  name="oppositionTeam"
                  value={formData.oppositionTeam}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  required
                  disabled={!isConnected}
                >
                  <option value="">Select opposition team</option>
                  {pointsTable.map((team) => (
                    <option key={team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Match Overs
                  </label>
                  <input
                    type="number"
                    name="matchOvers"
                    value={formData.matchOvers}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    required
                    disabled={!isConnected}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Desired Position
                  </label>
                  <select
                    name="desiredPosition"
                    value={formData.desiredPosition}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    required
                    disabled={!isConnected}
                  >
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <option key={pos} value={pos}>
                        Position {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toss Result
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tossResult"
                      value="batting"
                      checked={formData.tossResult === "batting"}
                      onChange={handleInputChange}
                      className="mr-2"
                      disabled={!isConnected}
                    />
                    Batting First
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tossResult"
                      value="bowling"
                      checked={formData.tossResult === "bowling"}
                      onChange={handleInputChange}
                      className="mr-2"
                      disabled={!isConnected}
                    />
                    Bowling First
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  {formData.tossResult === "batting"
                    ? "Runs Scored"
                    : "Runs Conceded by Opposition"}
                </label>
                <input
                  type="number"
                  name="runs"
                  value={formData.runs}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                  min="0"
                  placeholder={
                    formData.tossResult === "batting"
                      ? "Enter runs scored"
                      : "Enter runs conceded"
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  required
                  disabled={!isConnected}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !isConnected}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? "Calculating..." : "Calculate Requirements"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Results
            </h2>

            {result ? (
              <div className="space-y-4">
                {result.canReach ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      🟢
                      <h3 className="font-semibold text-green-800">
                        Possible to reach position {result.desiredPosition}!
                      </h3>
                    </div>

                    {result.scenario === "batting" ? (
                      <div className="space-y-2 text-sm text-green-700">
                        <p>
                          <strong>Strategy:</strong> Restrict{" "}
                          {result.oppositionTeam} between{" "}
                          {result.minOpponentRuns} to {result.maxOpponentRuns}{" "}
                          runs in {result.matchOvers} overs
                        </p>
                        <p>
                          <strong>NRR Range:</strong> {result.minNRR.toFixed(3)}{" "}
                          to {result.maxNRR.toFixed(3)}
                        </p>
                        <p>
                          <strong>Your Score:</strong> {result.runs} runs in{" "}
                          {result.matchOvers} overs
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-green-700">
                        <p>
                          <strong>Strategy:</strong> Chase {result.runsToChase}{" "}
                          runs between {result.minOversToChase.toFixed(1)} to{" "}
                          {result.maxOversToChase.toFixed(1)} overs
                        </p>
                        <p>
                          <strong>NRR Range:</strong> {result.minNRR.toFixed(3)}{" "}
                          to {result.maxNRR.toFixed(3)}
                        </p>
                        <p>
                          <strong>Opposition Score:</strong> {result.runs} runs
                          in {result.matchOvers} overs
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h3 className="font-semibold text-red-800">
                        Cannot reach position {result.desiredPosition}
                      </h3>
                    </div>
                    <p className="text-sm text-red-700">{result.message}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className=" w-3xs center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {!isConnected
                    ? "Please connect to backend server to calculate requirements"
                    : "Fill in the match details to calculate requirements"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current Points Table */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Current Points Table
          </h2>

          {pointsTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Position</th>
                    <th className="p-3 text-left">Team</th>
                    <th className="p-3 text-center">Matches</th>
                    <th className="p-3 text-center">Won</th>
                    <th className="p-3 text-center">Lost</th>
                    <th className="p-3 text-center">Points</th>
                    <th className="p-3 text-center">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((team, index) => (
                    <tr key={team.name} className="border-b border-gray-100">
                      <td className="p-3 font-semibold">{index + 1}</td>
                      <td className="p-3">{team.name}</td>
                      <td className="p-3 text-center">{team.matches}</td>
                      <td className="p-3 text-center">{team.won}</td>
                      <td className="p-3 text-center">{team.lost}</td>
                      <td className="p-3 text-center font-semibold">
                        {team.points}
                      </td>
                      <td className="p-3 text-center">{team.nrr.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <AlertCircle className="w-5 h-5" />
                <p>
                  Unable to load points table. Please check backend connection.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
