import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [authorName, setAuthorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (authorName.trim()) {
      setIsLoading(true);
      // Navigate to results page with encoded author name
      navigate(`/results/${encodeURIComponent(authorName.trim())}`);
    }
  };

  return (
    <div className="container">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <User className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Search Academic Publications
        </h2>
        <p className="text-lg text-gray-600">
          Enter an author's name to find their publications on Google Scholar
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-2">
            Author Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g., John Smith, Jane Doe"
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !authorName.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Searching...' : 'Search Publications'}
        </button>
      </form>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter the full name of the author you want to search</li>
          <li>• We'll search Google Scholar for their publications</li>
          <li>• View detailed publication metadata</li>
          <li>• Download publications or visit the original source</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchPage;
