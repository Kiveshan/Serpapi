import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Calendar, Users, BookOpen, Search } from 'lucide-react';
import axios from 'axios';

interface Publication {
  id: string;
  title: string;
  authors: string[];
  year: string;
  venue: string;
  abstract?: string;
  url: string;
  pdfUrl?: string;
  citations: number;
  snippets: string[];
}

const ResultsPage: React.FC = () => {
  const { authorName } = useParams<{ authorName: string }>();
  const navigate = useNavigate();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authorName) {
      searchPublications();
    }
  }, [authorName]);

  const searchPublications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5001/api/search/${encodeURIComponent(authorName || '')}`);
      setPublications(response.data);
    } catch (err) {
      setError('Failed to fetch publications. Please try again.');
      console.error('Error fetching publications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPublications = publications.filter(pub =>
    pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    pub.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (pdfUrl: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleVisitSource = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Publications for "{decodeURIComponent(authorName || '')}"
        </h2>
        
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search within publications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        <p className="text-gray-600">
          Found {filteredPublications.length} publication{filteredPublications.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {filteredPublications.map((publication) => (
          <div key={publication.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {publication.title}
            </h3>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {publication.authors.join(', ')}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {publication.year}
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {publication.venue}
              </div>
            </div>

            {publication.abstract && (
              <p className="text-gray-700 mb-3 line-clamp-3">
                {publication.abstract}
              </p>
            )}

            {publication.snippets.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 italic">
                  "{publication.snippets[0]}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-gray-500">
                {publication.citations} citations
              </div>
              
              <div className="flex gap-2">
                {publication.pdfUrl && (
                  <button
                    onClick={() => handleDownload(publication.pdfUrl!)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                <button
                  onClick={() => handleVisitSource(publication.url)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Source
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPublications.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No publications found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No publications found for this author.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
