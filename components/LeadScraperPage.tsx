import React, { useState, useRef, useCallback, useEffect } from 'react';
import { findCompaniesWithComponent, scrapeContactInfoFromUrls, generateKeywords } from '../services/leadScraperService';
import { GroundingChunk, ScrapedContactInfo, PersonInfo, SocialMediaHandles, User } from '../types';
import { SearchIcon, DownloadIcon, TrashIcon, CloseIcon } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import OutreachModal from './OutreachModal';
import { databaseService } from '../services/databaseService';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    jspdf: any;
  }
}

interface LeadScraperPageProps {
  user: User;
}

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
      Lead Scraper
    </h1>
    <p className="text-[var(--text-secondary)] mt-2 text-base md:text-lg">
      Discover companies, then scrape their contact info.
    </p>
  </header>
);

const SearchResultCard: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => (
  <a
    href={chunk.web.uri}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] hover:border-cyan-400 transition-all duration-300 transform hover:scale-105"
  >
    <p className="text-lg font-semibold text-cyan-300 truncate">{chunk.web.title || "Untitled"}</p>
    <p className="text-xs text-[var(--text-secondary)] mt-2">Source: Google Search Result</p>
  </a>
);

const SocialLinks: React.FC<{ social: SocialMediaHandles }> = ({ social }) => {
  if (!social || Object.keys(social).length === 0) return <span className="text-[var(--text-secondary)]">N/A</span>;
  
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {Object.entries(social).map(([platform, link]) => {
        if (!link) return null;
        return (
          <a
            key={platform}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            title={platform.charAt(0).toUpperCase() + platform.slice(1)}
            className="text-[var(--text-secondary)] hover:text-cyan-300 transition-colors"
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </a>
        );
      })}
    </div>
  );
};

const ScrapingResultsTable: React.FC<{ 
  data: ScrapedContactInfo[], 
  onPersonClick: (person: PersonInfo, company: ScrapedContactInfo) => void;
}> = ({ data, onPersonClick }) => {
  if (data.length === 0) {
    return <p className="text-center text-[var(--text-secondary)] mt-4">No contact information scraped yet.</p>;
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {data.map((company, companyIndex) => (
          <div key={companyIndex} className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
            <div className="border-b border-[var(--border-color)] pb-3 mb-3">
              <a href={company.url} target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-300 break-all hover:underline">{company.url}</a>
              <div className="text-xs text-[var(--text-secondary)] mt-2 space-y-2">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Company Emails:</p>
                  <p className="break-all">{company.emails.length > 0 ? company.emails.join(', ') : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Company Socials:</p>
                  <SocialLinks social={company.socialMedia} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
                {company.people.length > 0 ? (
                    company.people.map((person, personIndex) => (
                        <div key={personIndex} onClick={() => onPersonClick(person, company)} className="p-2 -mx-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
                            <h4 className="font-semibold text-cyan-300">{person.name}</h4>
                            <p className="text-sm text-[var(--text-primary)]">{person.role}</p>
                            <p className="text-sm text-[var(--text-secondary)] break-all">{person.email || 'N/A'}</p>
                            <div className="mt-1">
                                <SocialLinks social={person.socialMedia || {}} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="px-2 text-sm italic text-[var(--text-secondary)]">No individual contacts found.</p>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
        <table className="min-w-full text-sm text-left text-[var(--text-primary)]">
          <thead className="text-xs text-cyan-200 uppercase bg-[var(--bg-tertiary)]">
            <tr>
              <th scope="col" className="px-6 py-3">Company Information</th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Personal Socials</th>
            </tr>
          </thead>
          <tbody>
            {data.map((company, companyIndex) => {
              const people = company.people;
              const rowSpan = people.length > 0 ? people.length : 1;
              const bottomBorderClass = "border-b border-[var(--border-color)]";
              
              const firstPersonRow = (
                <tr 
                  className={people.length > 0 ? 'hover:bg-[var(--bg-tertiary)] cursor-pointer' : 'hover:bg-[var(--bg-tertiary)]'}
                  onClick={() => people.length > 0 && onPersonClick(people[0], company)}
                >
                  <td className={`px-6 py-4 font-medium text-[var(--text-primary)] align-top max-w-xs ${bottomBorderClass}`} rowSpan={rowSpan}>
                    <a href={company.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-cyan-300 truncate block">{company.url}</a>
                    <div className="text-xs text-[var(--text-secondary)] mt-2 space-y-1">
                      <p className="font-semibold">Company Emails:</p>
                      <div className="break-all">{company.emails.length > 0 ? company.emails.join(', ') : 'N/A'}</div>
                      <p className="font-semibold mt-1">Company Socials:</p>
                      <SocialLinks social={company.socialMedia} />
                    </div>
                  </td>
                  {people.length > 0 ? (
                    <>
                      <td className={`px-6 py-4 align-top font-semibold text-cyan-300 ${people.length === 1 ? bottomBorderClass : ''}`}>{people[0].name}</td>
                      <td className={`px-6 py-4 align-top ${people.length === 1 ? bottomBorderClass : ''}`}>{people[0].role}</td>
                      <td className={`px-6 py-4 align-top ${people.length === 1 ? bottomBorderClass : ''}`}>{people[0].email || 'N/A'}</td>
                      <td className={`px-6 py-4 align-top ${people.length === 1 ? bottomBorderClass : ''}`}>
                        <SocialLinks social={people[0].socialMedia || {}} />
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className={`px-6 py-4 text-center italic text-[var(--text-secondary)] align-top ${bottomBorderClass}`}>
                      No individual contacts found.
                    </td>
                  )}
                </tr>
              );

              const subsequentPersonRows = people.slice(1).map((person, personIndex) => (
                <tr 
                  key={`${companyIndex}-${personIndex}`} 
                  className="hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  onClick={() => onPersonClick(person, company)}
                >
                  <td className={`px-6 py-4 align-top font-semibold text-cyan-300 ${personIndex === people.length - 2 ? bottomBorderClass : ''}`}>{person.name}</td>
                  <td className={`px-6 py-4 align-top ${personIndex === people.length - 2 ? bottomBorderClass : ''}`}>{person.role}</td>
                  <td className={`px-6 py-4 align-top ${personIndex === people.length - 2 ? bottomBorderClass : ''}`}>{person.email || 'N/A'}</td>
                  <td className={`px-6 py-4 align-top ${personIndex === people.length - 2 ? bottomBorderClass : ''}`}>
                    <SocialLinks social={person.socialMedia || {}} />
                  </td>
                </tr>
              ));

              return (
                <React.Fragment key={companyIndex}>
                  {firstPersonRow}
                  {subsequentPersonRows}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

interface KeywordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeywordsGenerated: (keywords: string[]) => void;
}

const KeywordGeneratorModal: React.FC<KeywordGeneratorModalProps> = ({ isOpen, onClose, onKeywordsGenerated }) => {
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceDescription, setSourceDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keywords, setKeywords] = useState<string[]>([]);
    
    const handleGenerate = async () => {
        const source = sourceUrl ? { url: sourceUrl } : { description: sourceDescription };
        if (!source.url && !source.description) {
            setError("Please provide a URL or a description.");
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        setKeywords([]);

        try {
            const generated = await generateKeywords(source);
            if (generated.length === 0) {
                setError("Could not generate keywords. Try refining your input.");
            }
            setKeywords(generated);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleClose = () => {
        setSourceUrl('');
        setSourceDescription('');
        setKeywords([]);
        setError(null);
        setIsGenerating(false);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] shadow-xl p-6 w-full max-w-2xl transform transition-all relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Close">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 id="modal-title" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
                    Generate Search Ideas
                </h2>
                <p className="text-[var(--text-secondary)] mb-6">Get keyword ideas by analyzing your website or business description.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="url-input" className="block text-sm font-medium text-[var(--text-primary)] mb-1">From your Website URL</label>
                        <input
                            id="url-input"
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            disabled={isGenerating}
                        />
                    </div>
                    <div className="text-center text-[var(--text-secondary)] font-semibold">OR</div>
                    <div>
                         <label htmlFor="desc-input" className="block text-sm font-medium text-[var(--text-primary)] mb-1">From your Business Description</label>
                        <textarea
                            id="desc-input"
                            rows={4}
                            value={sourceDescription}
                            onChange={(e) => setSourceDescription(e.target.value)}
                            placeholder="Describe what your business does, your offers, and who your target customers are..."
                             className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            disabled={isGenerating}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || (!sourceUrl && !sourceDescription)}
                        className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        {isGenerating ? <LoadingSpinner /> : <SearchIcon className="w-5 h-5" />}
                        <span>Generate Keywords</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg text-center mt-4" role="alert">
                        {error}
                    </div>
                )}
                
                {keywords.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-cyan-200">Suggested Keywords:</h3>
                         <div className="flex flex-wrap gap-2 mt-3">
                            {keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="bg-[var(--bg-tertiary)] text-cyan-200 px-3 py-1.5 rounded-full text-sm"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => onKeywordsGenerated(keywords)}
                                className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto"
                            >
                                Add {keywords.length} Keywords to Queue
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const LeadScraperPage: React.FC<LeadScraperPageProps> = ({ user }) => {
  const [componentQuery, setComponentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapingProgress, setScrapingProgress] = useState<number>(0);
  const [results, setResults] = useState<GroundingChunk[]>([]);
  const [scrapedData, setScrapedData] = useState<ScrapedContactInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [keywordQueue, setKeywordQueue] = useState<string[]>([]);
  const [completedKeywords, setCompletedKeywords] = useState<Set<string>>(new Set());
  const [processingKeyword, setProcessingKeyword] = useState<string | null>(null);
  const [userOffer, setUserOffer] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<{ person: PersonInfo, company: ScrapedContactInfo } | null>(null);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem('leadScraperRecentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  }, []);

  const handlePersonClick = (person: PersonInfo, company: ScrapedContactInfo) => {
    setSelectedContact({ person, company });
    setIsOutreachModalOpen(true);
  };

  const resetForNewSearch = () => {
    setError(null);
    setResults([]);
    setCompanyFilter('');
  }

  const handleSearch = useCallback(async (queryOverride?: string) => {
    const query = queryOverride || componentQuery;
    if (!query.trim()) {
      setError("Please enter a component to search for.");
      return;
    }
    
    setIsLoading(true);
    resetForNewSearch();

    try {
      const foundCompanies = await findCompaniesWithComponent(query);
      if (foundCompanies.length === 0) {
        setError("No companies found for this component. Try a different query.");
      } else {
        const newRecentSearches = [query, ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, 5);
        setRecentSearches(newRecentSearches);
        localStorage.setItem('leadScraperRecentSearches', JSON.stringify(newRecentSearches));
      }
      setResults(foundCompanies);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [componentQuery, recentSearches]);

  const handleScrapeContacts = async () => {
    if (results.length === 0) return;
    setIsScraping(true);
    setError(null);
    setScrapingProgress(0);
    const filteredResults = results.filter(chunk => chunk.web.title.toLowerCase().includes(companyFilter.toLowerCase()));
    
    try {
      await scrapeContactInfoFromUrls(filteredResults, async (scrapedItem) => {
        setScrapedData((prevData) => [...prevData, scrapedItem]);
        setScrapingProgress((prevProgress) => prevProgress + 1);
        
        // Save to database
        try {
          const savedCompany = await databaseService.saveScrapedCompany(user.id!, {
            url: scrapedItem.url,
            title: filteredResults.find(r => r.web.uri === scrapedItem.url)?.web.title,
            emails: scrapedItem.emails,
            socialMedia: scrapedItem.socialMedia,
            searchQuery: componentQuery,
          });

          // Save contacts
          for (const person of scrapedItem.people) {
            await databaseService.saveScrapedContact(user.id!, savedCompany.id, {
              name: person.name,
              role: person.role,
              email: person.email,
              socialMedia: person.socialMedia || {},
            });
          }
        } catch (dbError) {
          console.error('Failed to save scraped data to database:', dbError);
        }
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while scraping.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleClearContacts = async () => {
    setScrapedData([]);
    try {
      await databaseService.clearAllScrapedData(user.id!);
    } catch (error) {
      console.error('Failed to clear scraped data from database:', error);
    }
  }

  const handleRemoveRecentSearch = (searchToRemove: string) => {
    const newRecentSearches = recentSearches.filter(s => s.toLowerCase() !== searchToRemove.toLowerCase());
    setRecentSearches(newRecentSearches);
    localStorage.setItem('leadScraperRecentSearches', JSON.stringify(newRecentSearches));
  };

  const handleClearRecentSearches = () => {
      setRecentSearches([]);
      localStorage.removeItem('leadScraperRecentSearches');
  };

  const handleDownloadCSV = () => {
    if (scrapedData.length === 0) return;

    const allPeople = scrapedData.flatMap(company => 
      company.people.map(person => ({ ...person, companyUrl: company.url }))
    );

    const headers = ["Company URL", "Name", "Role", "Email", "Social Media"];
    
    const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) {
            return '""';
        }
        const stringField = String(field).replace(/"/g, '""');
        return `"${stringField}"`;
    };

    const csvRows = allPeople.map(person => {
      const socialMediaString = Object.entries(person.socialMedia || {})
        .map(([platform, link]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${link}`)
        .join('; ');
        
      const row = [
        person.companyUrl,
        person.name,
        person.role,
        person.email || 'N/A',
        socialMediaString || 'N/A'
      ];
      return row.map(escapeCsvField).join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `scraped_contacts_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleKeywordsGenerated = (keywords: string[]) => {
    setKeywordQueue(keywords);
    setCompletedKeywords(new Set()); // Reset completion status
    setIsKeywordModalOpen(false);
  };

  const handleQueueSearch = async (keyword: string) => {
    if (processingKeyword) return; // Prevent concurrent scrapes from queue

    setProcessingKeyword(keyword);
    setError(null);
    
    // Clear the main search results so it doesn't confuse the user
    setResults([]);
    setCompanyFilter('');

    try {
      const foundCompanies = await findCompaniesWithComponent(keyword);
      
      if (foundCompanies.length > 0) {
        // Scrape contacts for the found companies
        await scrapeContactInfoFromUrls(foundCompanies, async (scrapedItem) => {
          setScrapedData((prevData) => [...prevData, scrapedItem]);
          
          // Save to database
          try {
            const savedCompany = await databaseService.saveScrapedCompany(user.id!, {
              url: scrapedItem.url,
              title: foundCompanies.find(r => r.web.uri === scrapedItem.url)?.web.title,
              emails: scrapedItem.emails,
              socialMedia: scrapedItem.socialMedia,
              searchQuery: keyword,
            });

            // Save contacts
            for (const person of scrapedItem.people) {
              await databaseService.saveScrapedContact(user.id!, savedCompany.id, {
                name: person.name,
                role: person.role,
                email: person.email,
                socialMedia: person.socialMedia || {},
              });
            }
          } catch (dbError) {
            console.error('Failed to save scraped data to database:', dbError);
          }
        });
      }
      // Mark as completed after successful processing
      setCompletedKeywords(prev => new Set(prev).add(keyword));
    } catch (err: any) {
      setError(`Error processing "${keyword}": ${err.message || "An unexpected error occurred."}`);
      // Visually mark as completed even on error so user knows it was attempted
      setCompletedKeywords(prev => new Set(prev).add(keyword));
    } finally {
      setProcessingKeyword(null);
    }
  };

  const handleRemoveFromQueue = (keywordToRemove: string) => {
      setKeywordQueue(q => q.filter(k => k !== keywordToRemove));
      setCompletedKeywords(prev => {
          const newSet = new Set(prev);
          newSet.delete(keywordToRemove);
          return newSet;
      });
  };

  const handleClearQueue = () => {
      setKeywordQueue([]);
      setCompletedKeywords(new Set());
  };
  
  const filteredCompanyResults = results.filter(chunk => chunk.web.title.toLowerCase().includes(companyFilter.toLowerCase()));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <Header />

        <main className="mt-8">
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={componentQuery}
                  onChange={(e) => setComponentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                  placeholder="e.g., 'React date picker' or 'Stripe payment gateway'"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg py-3 pl-4 pr-32 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Component or service to search for"
                  disabled={isLoading || isScraping || !!processingKeyword}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                        onClick={() => setIsKeywordModalOpen(true)}
                        className="p-2 text-[var(--text-secondary)] hover:text-cyan-300 transition-colors"
                        title="Generate search ideas"
                        aria-label="Generate search ideas"
                        disabled={isLoading || isScraping || !!processingKeyword}
                    >
                        <SearchIcon className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => handleSearch()}
                        className="p-2 text-[var(--text-secondary)] hover:text-cyan-300 transition-colors"
                        aria-label="Search"
                        disabled={isLoading || isScraping || !!processingKeyword}
                    >
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>
              </div>
            </div>
            {recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                    <span className="text-[var(--text-secondary)] font-semibold">Recent:</span>
                    {recentSearches.map((search, index) => (
                        <div key={index} className="flex items-center bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
                            <button
                                onClick={() => {
                                    setComponentQuery(search);
                                    handleSearch(search);
                                }}
                                className="text-cyan-200 pl-3 pr-2 py-1"
                                title={`Search for ${search}`}
                            >
                                {search}
                            </button>
                            <button
                                onClick={() => handleRemoveRecentSearch(search)}
                                className="pr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                aria-label={`Remove ${search} from recent searches`}
                                title={`Remove ${search}`}
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleClearRecentSearches}
                        className="text-[var(--text-secondary)] hover:text-red-400 text-xs underline ml-2"
                        aria-label="Clear all recent searches"
                    >
                        Clear
                    </button>
                </div>
            )}
          </div>

          <div className="max-w-2xl mx-auto w-full mt-6">
            <label htmlFor="user-offer" className="block text-lg font-semibold text-[var(--text-primary)] mb-2">
              Your Product/Service Offer
            </label>
            <textarea
                id="user-offer"
                rows={3}
                value={userOffer}
                onChange={(e) => setUserOffer(e.target.value)}
                placeholder="Describe your product or service here. This will be used to generate personalized outreach messages. e.g., 'I provide a service that automates customer support tickets using AI...'"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                disabled={isLoading || isScraping || !!processingKeyword}
            />
          </div>
          
          {keywordQueue.length > 0 && (
              <div className="max-w-2xl mx-auto w-full p-4 mt-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-cyan-200">Keyword Queue</h3>
                      <button
                          onClick={handleClearQueue}
                          className="text-[var(--text-secondary)] hover:text-red-400 text-xs underline"
                          aria-label="Clear keyword queue"
                      >
                          Clear Queue
                      </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywordQueue.map((keyword, index) => {
                        const isProcessing = processingKeyword === keyword;
                        const isCompleted = completedKeywords.has(keyword);
                        return (
                          <div key={index} className={`flex items-center rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-800/60' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]'}`}>
                              <button
                                  onClick={() => handleQueueSearch(keyword)}
                                  disabled={isProcessing || !!processingKeyword}
                                  className={`pl-3 pr-2 py-1 text-left flex items-center gap-2 ${isCompleted ? 'text-green-200 line-through' : 'text-cyan-200'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  title={`Search & Scrape for ${keyword}`}
                              >
                                  {isProcessing && <LoadingSpinner />}
                                  <span>{keyword}</span>
                              </button>
                              <button
                                  onClick={() => handleRemoveFromQueue(keyword)}
                                  disabled={isProcessing}
                                  className="pr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                                  aria-label={`Remove ${keyword} from queue`}
                                  title={`Remove ${keyword}`}
                              >
                                  <CloseIcon className="w-4 h-4" />
                              </button>
                          </div>
                        );
                    })}
                  </div>
              </div>
          )}

          {isLoading && <div className="flex justify-center items-center p-8"><LoadingSpinner /></div>}
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg relative text-center mt-4 max-w-2xl mx-auto" role="alert">
                <strong className="font-bold">An error occurred: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
          )}

          {results.length > 0 && !isScraping && (
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold">Found Companies ({filteredCompanyResults.length})</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        placeholder="Filter by name..."
                        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-cyan-400 w-full md:w-48"
                        aria-label="Filter found companies by name"
                    />
                    <button 
                      onClick={handleScrapeContacts}
                      disabled={isScraping}
                      className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
                      aria-label="Find contact information for these companies"
                    >
                      <SearchIcon className="w-5 h-5" />
                      <span>Find Contacts</span>
                    </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanyResults.map((chunk, index) => (
                  <SearchResultCard key={index} chunk={chunk} />
                ))}
              </div>
            </div>
          )}

          {isScraping && (
            <div className="mt-8 w-full">
              <p className="text-center text-cyan-300">Scraping contact info... please wait.</p>
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5 mt-2">
                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(scrapingProgress / (filteredCompanyResults.length || 1)) * 100}%` }}></div>
              </div>
              <p className="text-center text-sm text-[var(--text-secondary)] mt-1">{scrapingProgress} / {filteredCompanyResults.length} sites scraped.</p>
            </div>
          )}

          {scrapedData.length > 0 && (
            <div className="mt-12 w-full">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold">All Scraped Contacts</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={handleDownloadCSV}
                    className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Download all scraped contacts as CSV"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    <span>CSV</span>
                  </button>
                   <button 
                    onClick={handleClearContacts}
                    className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Clear all scraped contacts"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
              <ScrapingResultsTable data={scrapedData} onPersonClick={handlePersonClick} />
            </div>
          )}
        </main>
        <KeywordGeneratorModal
          isOpen={isKeywordModalOpen}
          onClose={() => setIsKeywordModalOpen(false)}
          onKeywordsGenerated={handleKeywordsGenerated}
        />
        <OutreachModal
          isOpen={isOutreachModalOpen}
          onClose={() => setIsOutreachModalOpen(false)}
          contact={selectedContact}
          userOffer={userOffer}
        />
      </div>
    </div>
  );
};

export default LeadScraperPage;