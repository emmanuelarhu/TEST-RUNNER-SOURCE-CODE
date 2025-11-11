import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectSelector from '../common/ProjectSelector';
import authService from '../../services/auth.service';
import api from '../../services/api.service';
import { useProject } from '../../contexts/ProjectContext';
import styles from './TopBar.module.css';

const TopBar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const { projects } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results: any[] = [];
      const lowerQuery = query.toLowerCase();

      // Search in projects
      const matchedProjects = projects.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      );
      matchedProjects.forEach(p => {
        results.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.description || 'Project',
          icon: '📁'
        });
      });

      // Search in test suites for all projects
      for (const project of projects) {
        try {
          const suitesResponse = await api.testSuites.getByProject(project.id);
          const suites = suitesResponse.data.data;
          const matchedSuites = suites.filter((s: any) =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.description?.toLowerCase().includes(lowerQuery)
          );
          matchedSuites.forEach((s: any) => {
            results.push({
              type: 'suite',
              id: s.id,
              title: s.name,
              subtitle: `Test Suite in ${project.name}`,
              icon: '📦',
              projectId: project.id
            });
          });
        } catch (err) {
          // Skip if error fetching suites for this project
        }
      }

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: any) => {
    setShowResults(false);
    setSearchQuery('');

    if (result.type === 'project') {
      navigate(`/project/${result.id}`);
    } else if (result.type === 'suite') {
      navigate(`/suites/${result.id}`);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className={styles.topBar}>
      <ProjectSelector />
      <div className={styles.searchContainer} ref={searchRef}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search projects, tests, suites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        />
        {isSearching && <span className={styles.searchLoading}>⏳</span>}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className={styles.searchResultItem}
                onClick={() => handleResultClick(result)}
              >
                <span className={styles.resultIcon}>{result.icon}</span>
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>{result.title}</div>
                  <div className={styles.resultSubtitle}>{result.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className={styles.searchResults}>
            <div className={styles.noResults}>
              <span>🔍</span>
              <p>No results found for "{searchQuery}"</p>
            </div>
          </div>
        )}
      </div>
      <div className={styles.topBarActions}>
        <button className={styles.iconButton}><span>🔔</span><span className={styles.notificationBadge}></span></button>
        <button className={styles.iconButton}><span>⚙️</span></button>
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.username || 'User'}</span>
            <span className={styles.userRole}>{user?.role || 'user'}</span>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
