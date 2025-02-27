"use client";

import { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function Home() {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Analyzing URL:", url);
  };

  const barData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        label: "Sentiment Distribution",
        data: [65, 25, 10],
        backgroundColor: ["#4ade80", "#facc15", "#f87171"],
        borderRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  const pieData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ["#4ade80", "#facc15", "#f87171"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#f1f5f9",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1E293B",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        padding: 10,
        borderColor: "#64748b",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#f8fafc",
        },
      },
      y: {
        ticks: {
          color: "#f8fafc",
        },
      },
    },
  };

  return (
    <div className="w-full min-h-screen p-8 bg-[#0F172A] flex flex-col items-center">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
        <div className="flex w-full gap-3">
          <input
            type="text"
            placeholder="Enter product URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg text-white placeholder-gray-400 border border-gray-700"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg"
          >
            Analyze
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            Sentiment Distribution
          </h2>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            Sentiment Breakdown
          </h2>
          <div className="h-64 flex justify-center">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>
      </div>
      <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
  <h2 className="text-lg font-semibold mb-4 text-gray-200">Product Images</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    <img src="https://via.placeholder.com/150" alt="Product 1" className="w-full h-auto rounded-lg shadow-md" />
    <img src="https://via.placeholder.com/150" alt="Product 2" className="w-full h-auto rounded-lg shadow-md" />
    <img src="https://via.placeholder.com/150" alt="Product 3" className="w-full h-auto rounded-lg shadow-md" />
    <img src="https://via.placeholder.com/150" alt="Product 4" className="w-full h-auto rounded-lg shadow-md" />
  </div>
</div>

      <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">
          AI Feedback
        </h2>
        <div className="bg-[#1E293B] p-4 rounded-lg shadow-md border border-gray-700">
          <p className="text-gray-400 mb-3">
            AI-generated sentiment analysis and product review insights will appear here.
          </p>
          <div className="flex items-center text-sm gap-4">
            <span className="flex items-center text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              Positive: 65%
            </span>
            <span className="flex items-center text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Rating: 4.2/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
