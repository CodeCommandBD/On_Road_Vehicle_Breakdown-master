"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import {
  RevenueLineChart,
  RevenueAreaChart,
  RevenueBarChart,
  RevenuePieChart,
  FunnelChart,
  StatCard,
} from "@/components/analytics/Charts";
import ExportMenu from "@/components/analytics/ExportMenu";
import { format } from "date-fns";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [garageData, setGarageData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchAnalytics();

    // Real-time updates
    const initPusher = async () => {
      const { pusherClient } = await import("@/lib/pusher");
      if (pusherClient) {
        const channel = pusherClient.subscribe("analytics");

        channel.bind("revenue_update", (data) => {
          toast.success(`Revenue Update: ৳${data.amount} received!`);
          fetchAnalytics(); // Refresh data
        });

        channel.bind("booking_new", (data) => {
          toast.info("New Booking Received!");
          fetchAnalytics(); // Refresh data
        });

        return () => {
          pusherClient.unsubscribe("analytics");
        };
      }
    };

    initPusher();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [revenueRes, conversionRes, garageRes] = await Promise.all([
        axios.get(`/api/analytics/revenue?months=6`),
        axios.get(
          `/api/analytics/conversion?funnelType=booking&days=${dateRange}`
        ),
        axios.get(`/api/analytics/garage-performance?limit=10`),
      ]);

      setRevenueData(revenueRes.data);
      setConversionData(conversionRes.data);
      setGarageData(garageRes.data);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast.info("Refreshing analytics...");
    await fetchAnalytics();
    toast.success("Analytics refreshed!");
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const revenue = revenueData?.current || {};
  const conversion = conversionData?.summary || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400">
            Track your business performance and growth
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <ExportMenu
            data={{
              revenue: revenue,
              revenueData: revenueData,
              garages: garageData,
            }}
            activeTab={activeTab}
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {["overview", "revenue", "conversion", "garages"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Monthly Recurring Revenue"
              value={`৳${revenue.mrr?.total?.toLocaleString() || 0}`}
              change={revenue.mrr?.growth || 0}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Active Customers"
              value={revenue.customers?.active?.toLocaleString() || 0}
              change={5.2}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Conversion Rate"
              value={`${conversion.conversionRate || 0}%`}
              change={conversion.conversionRate - 15}
              icon={TrendingUp}
              color="purple"
            />
            <StatCard
              title="Churn Rate"
              value={`${revenue.churn?.rate || 0}%`}
              change={-(revenue.churn?.rate || 0)}
              icon={Activity}
              color="orange"
            />
          </div>

          {/* Revenue Trend */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Revenue Trend (6 Months)
            </h2>
            {revenueData?.historical && revenueData.historical.length > 0 ? (
              <RevenueAreaChart
                data={revenueData.historical.reverse().map((item) => ({
                  date: format(new Date(item.date), "MMM yyyy"),
                  value: item.mrr,
                }))}
                dataKey="value"
                color="#10B981"
              />
            ) : (
              <p className="text-gray-400 text-center py-12">
                No historical data available
              </p>
            )}
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Revenue by Source
              </h2>
              {revenue.revenueBySource ? (
                <RevenuePieChart
                  data={[
                    {
                      name: "Subscriptions",
                      value: revenue.revenueBySource.subscriptions || 0,
                    },
                    {
                      name: "Bookings",
                      value: revenue.revenueBySource.bookings || 0,
                    },
                    {
                      name: "AI Diagnose",
                      value: revenue.revenueBySource.aiDiagnose || 0,
                    },
                    {
                      name: "Other",
                      value: revenue.revenueBySource.other || 0,
                    },
                  ].filter((item) => item.value > 0)}
                />
              ) : (
                <p className="text-gray-400 text-center py-12">
                  No data available
                </p>
              )}
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Revenue by Plan
              </h2>
              {revenue.revenueByPlan ? (
                <RevenueBarChart
                  data={[
                    {
                      name: "Standard",
                      value: revenue.revenueByPlan.standard || 0,
                    },
                    {
                      name: "Premium",
                      value: revenue.revenueByPlan.premium || 0,
                    },
                    {
                      name: "Enterprise",
                      value: revenue.revenueByPlan.enterprise || 0,
                    },
                  ].filter((item) => item.value > 0)}
                  dataKey="value"
                  color="#3B82F6"
                />
              ) : (
                <p className="text-gray-400 text-center py-12">
                  No data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">MRR</h3>
              <p className="text-3xl font-bold text-white mb-1">
                ৳{revenue.mrr?.total?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-green-500">
                +{revenue.mrr?.growth || 0}% growth
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">ARR</h3>
              <p className="text-3xl font-bold text-white mb-1">
                ৳{revenue.arr?.total?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-400">Annual Recurring Revenue</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">ARPU</h3>
              <p className="text-3xl font-bold text-white mb-1">
                ৳{revenue.arpu?.overall?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-400">Average Revenue Per User</p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Customer Lifetime Value
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Standard</p>
                <p className="text-2xl font-bold text-white">
                  ৳{revenue.ltv?.byPlan?.standard?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Premium</p>
                <p className="text-2xl font-bold text-white">
                  ৳{revenue.ltv?.byPlan?.premium?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Enterprise</p>
                <p className="text-2xl font-bold text-white">
                  ৳{revenue.ltv?.byPlan?.enterprise?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Tab */}
      {activeTab === "conversion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">Total Funnels</h3>
              <p className="text-3xl font-bold text-white">
                {conversion.total || 0}
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">Completed</h3>
              <p className="text-3xl font-bold text-green-500">
                {conversion.completed || 0}
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold text-blue-500">
                {conversion.conversionRate || 0}%
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm text-gray-400 mb-2">Avg Time</h3>
              <p className="text-3xl font-bold text-white">
                {Math.round((conversion.avgTimeToConvert || 0) / 60)}m
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Booking Funnel
            </h2>
            {conversionData?.stepAnalysis &&
            conversionData.stepAnalysis.length > 0 ? (
              <FunnelChart
                data={conversionData.stepAnalysis.map((step) => ({
                  name: step.stepName,
                  value: step.entered,
                }))}
              />
            ) : (
              <p className="text-gray-400 text-center py-12">
                No funnel data available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Garages Tab */}
      {activeTab === "garages" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                Top Performing Garages
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Garage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {garageData?.topPerformers?.map((garage, index) => (
                    <tr key={garage._id} className="hover:bg-gray-700/20">
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-gray-500">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">
                            {garage.garage?.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {garage.garage?.address?.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                              style={{
                                width: `${
                                  garage.performanceScore?.overall || 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold">
                            {garage.performanceScore?.overall || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {garage.bookings?.total || 0}
                      </td>
                      <td className="px-6 py-4 text-white">
                        ৳{garage.revenue?.total?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-500">
                          ★ {garage.satisfaction?.rating || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
