'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Briefcase, CheckSquare, Calendar, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'leave' | 'absent';
  title: string;
  subtitle: string;
  status?: string;
  date?: string;
  url: string;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Cmd/Ctrl + K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, filter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('approved')) return 'bg-green-100 text-green-700';
    if (s.includes('progress') || s.includes('pending')) return 'bg-yellow-100 text-yellow-700';
    if (s.includes('reject') || s.includes('cancel')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(result.url);
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-gray-500 border">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, tasks, leaves, absents..."
                className="flex-1 text-lg outline-none placeholder-gray-400"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                ESC
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-3 border-b bg-gray-50">
              {['all', 'projects', 'tasks', 'leaves', 'absents'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : query.length < 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Type at least 2 characters to search</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {result.title}
                          </span>
                          {result.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(result.status)}`}>
                              {result.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="truncate">{result.subtitle}</span>
                          {result.date && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>{format(new Date(result.date), 'MMM d, yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              {results.length > 0 && (
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
