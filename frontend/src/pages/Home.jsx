import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
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
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze URL. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: analysisData ? [
          analysisData.sentimentData.positive,
          analysisData.sentimentData.negative,
          analysisData.sentimentData.neutral
        ] : [0, 0, 0],
        backgroundColor: ["#00da0b", "#ff0000", "#fbff00"],
        borderWidth: 0,
        hoverOffset: 20,
      },
    ],
  };

  const intensityData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        label: "Positive",
        data: [analysisData?.sentimentScores?.positive || 0, 0],
        backgroundColor: "#00da0b",
        borderRadius: 4,
      },
      {
        label: "Negative",
        data: [0, analysisData?.sentimentScores?.negative || 0],
        backgroundColor: "#ff0000",
        borderRadius: 4,
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
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
        <div className="flex w-full gap-3">
          <input
            type="text"
            placeholder="Enter Amazon product URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg text-white placeholder-gray-400 border border-gray-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-red-500 bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}
      </form>

      {analysisData && (
        <>
          {/* Product Details Section */}
          <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md w-full max-w-5xl mb-8">
            <div className="flex items-start gap-8">
              {analysisData.productDetails?.productImage && (
                <div className="w-48 h-48 overflow-hidden rounded-lg bg-white p-2">
                  <img 
                    src={analysisData.productDetails.productImage} 
                    alt="Product" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {analysisData.productDetails?.productName || 'Product Analysis'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1E293B] p-4 rounded-lg">
                    <p className="text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-white">{analysisData.totalReviews}</p>
                  </div>
                  <div className="bg-[#1E293B] p-4 rounded-lg">
                    <p className="text-gray-400">Average Score</p>
                    <p className="text-2xl font-bold text-white">{analysisData.averageScore}/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
            <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">
                Sentiment Distribution
              </h2>
              <div className="h-64">
                <Doughnut data={sentimentData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">
                Review Intensity
              </h2>
              <div className="h-64">
                <Bar data={intensityData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Star Rating Distribution */}
          <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              Star Rating Distribution
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64">
                <Bar 
                  data={{
                    labels: Object.keys(analysisData.ratingDistribution),
                    datasets: [{
                      label: 'Number of Reviews',
                      data: Object.values(analysisData.ratingDistribution),
                      backgroundColor: '#4F46E5',
                      borderRadius: 4,
                    }]
                  }} 
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          color: '#f8fafc',
                        },
                      },
                    },
                  }} 
                />
              </div>
              <div className="flex flex-col justify-center items-center bg-[#1E293B] p-6 rounded-lg">
                <div className="text-4xl font-bold text-white mb-2">
                  {analysisData.averageScore}
                </div>
                <div className="text-gray-400">Average Rating</div>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.round(analysisData.averageScore)
                          ? 'text-yellow-400'
                          : 'text-gray-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              Sentiment Summary
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1E293B] p-4 rounded-lg text-center">
                <p className="text-green-400 text-2xl font-bold">
                  {((analysisData.sentimentData.positive / analysisData.totalReviews) * 100).toFixed(1)}%
                </p>
                <p className="text-gray-400 mt-1">Positive</p>
              </div>
              <div className="bg-[#1E293B] p-4 rounded-lg text-center">
                <p className="text-yellow-400 text-2xl font-bold">
                  {((analysisData.sentimentData.neutral / analysisData.totalReviews) * 100).toFixed(1)}%
                </p>
                <p className="text-gray-400 mt-1">Neutral</p>
              </div>
              <div className="bg-[#1E293B] p-4 rounded-lg text-center">
                <p className="text-red-400 text-2xl font-bold">
                  {((analysisData.sentimentData.negative / analysisData.totalReviews) * 100).toFixed(1)}%
                </p>
                <p className="text-gray-400 mt-1">Negative</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;