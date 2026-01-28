import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { BarChart3, Search, Calendar, Filter } from 'lucide-react';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, 3days, 10days

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await adminApi.getResults();
      setResults(response.data);
    } catch (error) {
      showToast('Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format score or show N/A
  const formatScore = (score) => {
    if (score === null || score === undefined || score === '') return '-';
    return score;
  };

  // Calculate overall band score from L/R/W/S scores
  const calculateOverall = (result) => {
    // Use backend calculated overall score if available
    if (result.overallScore !== null && result.overallScore !== undefined) {
      return result.overallScore.toFixed(1);
    }

    const scores = [
      result.listeningScore,
      result.readingScore,
      result.writingScore,
      result.speakingScore
    ].filter(s => s !== null && s !== undefined && s !== '');

    if (scores.length === 0) return '-';

    const sum = scores.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const avg = sum / scores.length;
    // IELTS rounds to nearest 0.5
    return (Math.round(avg * 2) / 2).toFixed(1);
  };

  // Filter results based on search and date
  const getFilteredResults = () => {
    let filtered = [...results];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.studentName.toLowerCase().includes(query) ||
        result.testTitle.toLowerCase().includes(query) ||
        result.testKey.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === '3days') {
        filterDate.setDate(now.getDate() - 3);
      } else if (dateFilter === '10days') {
        filterDate.setDate(now.getDate() - 10);
      }

      filtered = filtered.filter(result => {
        const submittedDate = result.submittedAt ? new Date(result.submittedAt) : new Date(result.startedAt);
        return submittedDate >= filterDate;
      });
    }

    return filtered;
  };

  const filteredResults = getFilteredResults();

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-600" />
          Results
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all student test results and scores
        </p>
      </div>

      {/* Filters Section */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, test title, or test key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="3days">Last 3 Days</option>
              <option value="10days">Last 10 Days</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span>
            Showing {filteredResults.length} of {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      <Card>
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {results.length === 0 ? 'No results yet' : 'No matching results'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {results.length === 0
                ? 'Results will appear here when students complete their tests'
                : 'Try adjusting your filters or search query'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Test Key
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Overall
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    R
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    S
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {result.studentName}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {result.testTitle || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                        {result.testKey}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-8 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold rounded">
                        {calculateOverall(result)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium rounded text-sm">
                        {formatScore(result.listeningScore)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium rounded text-sm">
                        {formatScore(result.readingScore)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium rounded text-sm">
                        {formatScore(result.writingScore)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-7 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium rounded text-sm">
                        {formatScore(result.speakingScore)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminResults;
