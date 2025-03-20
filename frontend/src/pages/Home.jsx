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
  const [amazonUrl, setAmazonUrl] = useState("");
  const [flipkartUrl, setFlipkartUrl] = useState("");
  const [myntraUrl, setMyntraUrl] = useState("");
  const [amazonLoading, setAmazonLoading] = useState(false);
  const [flipkartLoading, setFlipkartLoading] = useState(false);
  const [myntraLoading, setMyntraLoading] = useState(false);
  const [amazonData, setAmazonData] = useState(null);
  const [flipkartData, setFlipkartData] = useState(null);
  const [myntraData, setMyntraData] = useState(null);
  const [amazonError, setAmazonError] = useState(null);
  const [flipkartError, setFlipkartError] = useState(null);
  const [myntraError, setMyntraError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amazonUrl) {
      setAmazonError("Please enter an Amazon product URL");
      return;
    }

    setAmazonLoading(true);
    setAmazonError(null);

    try {
      const amazonResponse = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: amazonUrl, platform: 'amazon' }),
      });

      const amazonResult = await amazonResponse.json();
      if (!amazonResponse.ok) {
        throw new Error(amazonResult.error || 'Amazon analysis failed');
      }
      setAmazonData(amazonResult);
    } catch (err) {
      setAmazonError(err.message || 'Failed to analyze URL. Please try again.');
      console.error('Error:', err);
    } finally {
      setAmazonLoading(false);
    }
  };

  const handleFlipkartSubmit = async (e) => {
    e.preventDefault();
    if (!flipkartUrl) {
      setFlipkartError("Please enter a Flipkart product URL");
      return;
    }

    setFlipkartLoading(true);
    setFlipkartError(null);

    try {
      const flipkartResponse = await fetch('http://localhost:5000/analyzeFlipkart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: flipkartUrl }),
      });

      const flipkartResult = await flipkartResponse.json();
      if (!flipkartResponse.ok) {
        throw new Error(flipkartResult.error || 'Flipkart analysis failed');
      }
      setFlipkartData(flipkartResult);
    } catch (err) {
      setFlipkartError(err.message || 'Failed to analyze Flipkart URL. Please try again.');
      console.error('Error:', err);
    } finally {
      setFlipkartLoading(false);
    }
  };

  const handleMyntraSubmit = async (e) => {
    e.preventDefault();
    if (!myntraUrl) {
      setMyntraError("Please enter a Myntra product URL");
      return;
    }

    setMyntraLoading(true);
    setMyntraError(null);

    try {
      const myntraResponse = await fetch('http://localhost:5000/analyzeMyntra', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: myntraUrl }),
      });

      const myntraResult = await myntraResponse.json();
      if (!myntraResponse.ok) {
        throw new Error(myntraResult.error || 'Myntra analysis failed');
      }
      setMyntraData(myntraResult);
    } catch (err) {
      setMyntraError(err.message || 'Failed to analyze Myntra URL. Please try again.');
      console.error('Error:', err);
    } finally {
      setMyntraLoading(false);
    }
  };

  const renderStarDistribution = (ratingDistribution, totalRatings) => {
    return (
      <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">
          Star Distribution 
        </h2>
        <div className="space-y-4">
          {Object.entries(ratingDistribution).map(([stars, count]) => {
            const validCount = isNaN(count) ? 0 : count;
            const percentage = totalRatings > 0 ? ((validCount / totalRatings) * 100).toFixed(1) : 0;
            return (
              <div key={stars} className="flex items-center">
                <div className="w-16 text-gray-400">{stars}</div>
                <div className="flex-1 bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className="bg-yellow-500 h-4"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-gray-400">{validCount}</div>
                <div className="w-16 text-right text-gray-400">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAnalysis = (data, platform) => {
    if (!data) return null;

    const sentimentData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [
            data.sentimentData.positive,
            data.sentimentData.negative,
            data.sentimentData.neutral
          ],
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
          data: [data.sentimentScores?.positive || 0, 0],
          backgroundColor: "#00da0b",
          borderRadius: 4,
        },
        {
          label: "Negative",
          data: [0, data.sentimentScores?.negative || 0],
          backgroundColor: "#ff0000",
          borderRadius: 4,
        },
      ],
    };

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          {platform.toUpperCase()} Analysis Results
        </h2>
        
        {/* Product Details Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md w-full max-w-5xl mb-8">
          <div className="flex items-start gap-8">
            {data.productDetails?.productImage && (
              <div className="w-48 h-48 overflow-hidden rounded-lg bg-white p-2">
                <img 
                  src={data.productDetails.productImage} 
                  alt="Product" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-4">
                {data.productDetails?.productName || 'Product Analysis'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-white">{data.totalReviews}</p>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-white">{data.productDetails.averageScore}/5</p>
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

 {/* Star Distribution Section */}
 {renderStarDistribution(data.productDetails.ratingDistribution, data.productDetails.totalRatings)}
        {/* Customer Reviews Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Customer Reviews
            </h2>
            <div className="text-gray-400">
              {data.productDetails.totalRatings?.toLocaleString()} global ratings
            </div>
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col justify-center items-center bg-[#1E293B] p-6 rounded-lg">
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-4xl font-bold text-white">
                  {data.productDetails.averageScore}
                </div>
                <div className="text-gray-400">out of 5</div>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(data.productDetails.averageScore)
                        ? 'text-[#FFB700]'
                        : i < data.productDetails.averageScore
                        ? 'text-[#FFB700] opacity-50'
                        : 'text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-gray-400 text-sm">
                {data.productDetails.totalRatings?.toLocaleString()} ratings
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Summary */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            Sentiment Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-green-400 text-2xl font-bold">
                {((data.sentimentData.positive / data.totalReviews) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Positive</p>
            </div>
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-yellow-400 text-2xl font-bold">
                {((data.sentimentData.neutral / data.totalReviews) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Neutral</p>
            </div>
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-red-400 text-2xl font-bold">
                {((data.sentimentData.negative / data.totalReviews) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Negative</p>
            </div>
          </div>
        </div>
         {/* AI Feedback Section */}
         <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
    <h2 className="text-lg font-semibold mb-4 text-gray-200">AI Feedback</h2>
    <div className="text-base text-gray-300 space-y-3 leading-relaxed">
        {data.aiFeedback ? (
            data.aiFeedback.split("\n").map((line, index) => {
                let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-100">$1</strong>');

                return <p key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
            })
        ) : (
            <p>N/A</p>
        )}
    </div>
</div>





       
       
      </div>
    );
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

  const renderFlipkartFeedback = (data) => {
    if (!data) return null;

    const sentimentData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [
            data.fsentimentData.positive,
            data.fsentimentData.negative,
            data.fsentimentData.neutral
          ],
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
          data: [data.fsentimentScores?.positive || 0, 0],
          backgroundColor: "#00da0b",
          borderRadius: 4,
        },
        {
          label: "Negative",
          data: [0, data.fsentimentScores?.negative || 0],
          backgroundColor: "#ff0000",
          borderRadius: 4,
        },
      ],
    };

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          FLIPKART Analysis Results
        </h2>
        
        {/* Product Details Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md w-full max-w-5xl mb-8">
          <div className="flex items-start gap-8">
            {data.fproductDetails?.fproductImage && (
              <div className="w-48 h-48 overflow-hidden rounded-lg bg-white p-2">
                <img 
                  src={data.fproductDetails.fproductImage} 
                  alt="Product" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-4">
                {data.fproductDetails?.fproductName || 'Product Analysis'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-white">{data.freviewCount}</p>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-white">{data.fproductDetails.faverageScore}/5</p>
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

        {/* Star Distribution Section */}
        {renderStarDistribution(data.fproductDetails.fratingDistribution, data.fproductDetails.ftotalRatings)}

        {/* Sentiment Summary */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            Sentiment Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-green-400 text-2xl font-bold">
                {((data.fsentimentData.positive / data.freviewCount) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Positive</p>
            </div>
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-yellow-400 text-2xl font-bold">
                {((data.fsentimentData.neutral / data.freviewCount) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Neutral</p>
            </div>
            <div className="bg-[#1E293B] p-4 rounded-lg text-center">
              <p className="text-red-400 text-2xl font-bold">
                {((data.fsentimentData.negative / data.freviewCount) * 100).toFixed(1)}%
              </p>
              <p className="text-gray-400 mt-1">Negative</p>
            </div>
          </div>
        </div>

        {/* AI Feedback Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">AI Feedback [Flipkart] </h2>
          <div className="text-base text-gray-300 space-y-3 leading-relaxed">
              {data.aiFeedback ? (
                  data.aiFeedback.split("\n").map((line, index) => {
                      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-100">$1</strong>');

                      return <p key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                  })
              ) : (
                  <p>N/A</p>
              )}
          </div>
          <div className="mt-4 text-gray-300">
              <p>Total Reviews Scraped: <strong>{data.freviewCount}</strong></p>
          </div>
        </div>
      </div>
    );
  };

  const renderMyntraFeedback = (data) => {
    if (!data) return null;

    const sentimentData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          data: [
            data.msentimentData.positive,
            data.msentimentData.negative,
            data.msentimentData.neutral
          ],
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
          data: [data.msentimentScores?.positive || 0, 0],
          backgroundColor: "#00da0b",
          borderRadius: 4,
        },
        {
          label: "Negative",
          data: [0, data.msentimentScores?.negative || 0],
          backgroundColor: "#ff0000",
          borderRadius: 4,
        },
      ],
    };

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          MYNTRA Analysis Results
        </h2>
        
        {/* Product Details Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md w-full max-w-5xl mb-8">
          <div className="flex items-start gap-8">
            {data.mproductDetails?.mproductImage && (
              <div className="w-48 h-48 overflow-hidden rounded-lg bg-white p-2">
                <img 
                  src={data.mproductDetails.mproductImage} 
                  alt="Product" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-4">
                {data.mproductDetails?.mproductName || 'Product Analysis'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-white">{data.mreviewCount}</p>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-white">{data.mproductDetails.maverageScore}/5</p>
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

        {/* Star Distribution Section */}
        {renderStarDistribution(data.mproductDetails.mratingDistribution, data.mproductDetails.mtotalRatings)}

        {/* AI Feedback Section */}
        <div className="bg-[#111827] p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md mt-8 w-full max-w-5xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">AI Feedback [Myntra]  </h2>
          <div className="text-base text-gray-300 space-y-3 leading-relaxed">
            {data.aiFeedback ? (
              data.aiFeedback.split("\n").map((line, index) => {
                let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-100">$1</strong>');

                return <p key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
              })
            ) : (
              <p>N/A</p>
            )}
          </div>
          <div className="mt-4 text-gray-300">
            <p>Total Reviews Scraped: <strong>{data.mreviewCount}</strong></p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen p-8 bg-[#0F172A] flex flex-col items-center">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex w-full gap-3">
            <input
              type="text"
              placeholder="Enter Amazon product URL"
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg text-white placeholder-gray-400 border border-gray-700"
            />
            <div className="flex items-center">
              <img 
                src="/amazon-logo.png"
                
                alt="Amazon Logo" 
                className="w-10 h-10 ml-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={amazonLoading}
            className="w-full px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-50"
          >
            {amazonLoading ? 'Analyzing...' : 'Analyze Amazon'}
          </button>
        </div>
        {amazonError && (
          <div className="mt-2 text-red-500 bg-red-500/10 p-2 rounded">
            {amazonError}
          </div>
        )}
      </form>

      {/* Flipkart Form */}
      <form onSubmit={handleFlipkartSubmit} className="w-full max-w-2xl mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex w-full gap-3">
            <input
              type="text"
              placeholder="Enter Flipkart product URL"
              value={flipkartUrl}
              onChange={(e) => setFlipkartUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg text-white placeholder-gray-400 border border-gray-700"
            />
            <div className="flex items-center">
              <img 
                src="/flipkart-logo.png" 
                alt="Flipkart Logo" 
                className="w-10 h-10 ml-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={flipkartLoading}
            className="w-full px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all shadow-lg disabled:opacity-50"
          >
            {flipkartLoading ? 'Analyzing...' : 'Analyze Flipkart'}
          </button>
        </div>
        {flipkartError && (
          <div className="mt-2 text-red-500 bg-red-500/10 p-2 rounded">
            {flipkartError}
          </div>
        )}
      </form>

      {/* Myntra Form */}
      <form onSubmit={handleMyntraSubmit} className="w-full max-w-2xl mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex w-full gap-3">
            <input
              type="text"
              placeholder="Enter Myntra product URL"
              value={myntraUrl}
              onChange={(e) => setMyntraUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg text-white placeholder-gray-400 border border-gray-700"
            />
            <div className="flex items-center">
              <img 
                src="/myntra-logo.png" 
                alt="Myntra Logo" 
                className="w-10 h-10 ml-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={myntraLoading}
            className="w-full px-8 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-pink-500 transition-all shadow-lg disabled:opacity-50"
          >
            {myntraLoading ? 'Analyzing...' : 'Analyze Myntra'}
          </button>
        </div>
        {myntraError && (
          <div className="mt-2 text-red-500 bg-red-500/10 p-2 rounded">
            {myntraError}
          </div>
        )}
      </form>

      {/* Analysis Results */}
      {amazonData && renderAnalysis(amazonData, 'amazon')}
      {flipkartData && renderFlipkartFeedback(flipkartData)}
      {myntraData && renderMyntraFeedback(myntraData)}
    </div>
  );
}

export default Home;