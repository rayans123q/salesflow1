import React, { useState, useRef, useCallback, useEffect } from 'react';
import { findCompaniesWithComponent, scrapeContactInfoFromUrls, generateKeywords } from './services/geminiService';
import { GroundingChunk, ScrapedContactInfo, PersonInfo, SocialMediaHandles } from './types';
import MicIcon from './components/icons/MicIcon';
import SearchIcon from './components/icons/SearchIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import ScrapeIcon from './components/icons/ScrapeIcon';
import TrashIcon from './components/icons/TrashIcon';
import LoadingSpinner from './components/LoadingSpinner';
import LinkedInIcon from './components/icons/LinkedInIcon';
import XIcon from './components/icons/XIcon';
import FacebookIcon from './components/icons/FacebookIcon';
import InstagramIcon from './components/icons/InstagramIcon';
import YoutubeIcon from './components/icons/YoutubeIcon';
import CSVIcon from './components/icons/CSVIcon';
import GlobeIcon from './components/icons/GlobeIcon';
import TourGuide from './components/TourGuide';
import CloseIcon from './components/icons/CloseIcon';
import OutreachModal from './components/OutreachModal';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    jspdf: any;
  }
}

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
      self-flow extra
    </h1>
    <p className="text-gray-400 mt-2 text-base md:text-lg">
      Discover companies, then scrape their contact info.
    </p>
  </header>
);

const SearchResultCard: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => (
  <a
    href={chunk.web.uri}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-gray-800 p-4 rounded-lg border border-gray-700 hover:bg-gray-700 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105"
  >
    <p className="text-lg font-semibold text-cyan-300 truncate">{chunk.web.title || "Untitled"}</p>
    <p className="text-xs text-gray-500 mt-2">Source: Google Search Result</p>
  </a>
);

const SocialLinks: React.FC<{ social: SocialMediaHandles }> = ({ social }) => {
  if (!social || Object.keys(social).length === 0) return <span className="text-gray-500">N/A</span>;
  
  const iconMap: { [key in keyof SocialMediaHandles]: React.ReactNode } = {
    linkedin: <LinkedInIcon className="w-5 h-5" />,
    x: <XIcon className="w-5 h-5" />,
    facebook: <FacebookIcon className="w-5 h-5" />,
    instagram: <InstagramIcon className="w-5 h-5" />,
    youtube: <YoutubeIcon className="w-5 h-5" />,
  };
  
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
            className="text-gray-400 hover:text-cyan-300 transition-colors"
          >
            {iconMap[platform as keyof SocialMediaHandles]}
          </a>
        );
      })}
    </div>
  );
};

const ScrapingResultsTable: React.FC<{ data: ScrapedContactInfo[], onPersonClick: (person: PersonInfo, company: ScrapedContactInfo) => void; }> = ({ data, onPersonClick }) => {
  if (data.length === 0) {
    return <p className="text-center text-gray-400 mt-4">No contact information scraped yet.</p>;
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {data.map((company, companyIndex) => (
          <div key={companyIndex} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="border-b border-gray-600 pb-3 mb-3">
              <a href={company.url} target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-300 break-all hover:underline">{company.url}</a>
              <div className="text-xs text-gray-400 mt-2 space-y-2">
                <div>
                  <p className="font-semibold text-gray-300">Company Emails:</p>
                  <p className="break-all">{company.emails.length > 0 ? company.emails.join(', ') : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300">Company Socials:</p>
                  <SocialLinks social={company.socialMedia} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
                {company.people.length > 0 ? (
                    company.people.map((person, personIndex) => (
                        <div key={personIndex} onClick={() => onPersonClick(person, company)} className="p-2 -mx-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors">
                            <h4 className="font-semibold text-cyan-300">{person.name}</h4>
                            <p className="text-sm text-gray-300">{person.role}</p>
                            <p className="text-sm text-gray-400 break-all">{person.email || 'N/A'}</p>
                            <div className="mt-1">
                                <SocialLinks social={person.socialMedia || {}} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="px-2 text-sm italic text-gray-400">No individual contacts found.</p>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-cyan-200 uppercase bg-gray-700">
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
              const bottomBorderClass = "border-b border-gray-600";
              
              const firstPersonRow = (
                <tr 
                  className={people.length > 0 ? 'hover:bg-gray-700/50 cursor-pointer' : 'hover:bg-gray-700/50'}
                  onClick={() => people.length > 0 && onPersonClick(people[0], company)}
                >
                  <td className={`px-6 py-4 font-medium text-white align-top max-w-xs ${bottomBorderClass}`} rowSpan={rowSpan}>
                    <a href={company.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-cyan-300 truncate block">{company.url}</a>
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
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
                    <td colSpan={4} className={`px-6 py-4 text-center italic text-gray-400 align-top ${bottomBorderClass}`}>
                      No individual contacts found.
                    </td>
                  )}
                </tr>
              );

              const subsequentPersonRows = people.slice(1).map((person, personIndex) => (
                <tr 
                  key={`${companyIndex}-${personIndex}`} 
                  className="hover:bg-gray-700/50 cursor-pointer"
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
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl p-6 w-full max-w-2xl transform transition-all relative">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 id="modal-title" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
                    Generate Search Ideas
                </h2>
                <p className="text-gray-400 mb-6">Get keyword ideas by analyzing your website or business description.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-1">From your Website URL</label>
                        <input
                            id="url-input"
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            disabled={isGenerating}
                        />
                    </div>
                    <div className="text-center text-gray-500 font-semibold">OR</div>
                    <div>
                         <label htmlFor="desc-input" className="block text-sm font-medium text-gray-300 mb-1">From your Business Description</label>
                        <textarea
                            id="desc-input"
                            rows={4}
                            value={sourceDescription}
                            onChange={(e) => setSourceDescription(e.target.value)}
                            placeholder="Describe what your business does, your offers, and who your target customers are..."
                             className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                        {isGenerating ? <div className="w-5 h-5 border-2 border-t-transparent border-dashed rounded-full animate-spin border-white"></div> : <GlobeIcon className="w-5 h-5" />}
                        <span>Generate Keywords</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg text-center mt-4" role="alert">
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
                                    className="bg-gray-700/80 text-cyan-200 px-3 py-1.5 rounded-full text-sm"
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

const TourPlaceholder: React.FC<{text: string}> = ({text}) => (
    <div className="mt-8 border-2 border-dashed border-gray-700 rounded-lg p-12 text-center text-gray-500">
        <p>{text}</p>
    </div>
);

const App: React.FC = () => {
  const [componentQuery, setComponentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapingProgress, setScrapingProgress] = useState<number>(0);
  const [results, setResults] = useState<GroundingChunk[]>([]);
  const [scrapedData, setScrapedData] = useState<ScrapedContactInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [keywordQueue, setKeywordQueue] = useState<string[]>([]);
  const [completedKeywords, setCompletedKeywords] = useState<Set<string>>(new Set());
  const [processingKeyword, setProcessingKeyword] = useState<string | null>(null);
  const [userOffer, setUserOffer] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<{ person: PersonInfo, company: ScrapedContactInfo } | null>(null);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem('recentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
      const hasSeenTour = localStorage.getItem('componentFinderTourSeen');
      if (!hasSeenTour) {
        setShowTour(true);
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  }, []);

  const handleTourNext = () => setTourStep(prev => prev + 1);
  const handleTourPrev = () => setTourStep(prev => prev - 1);
  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('componentFinderTourSeen', 'true');
  };

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
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
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
      await scrapeContactInfoFromUrls(filteredResults, (scrapedItem) => {
        setScrapedData((prevData) => [...prevData, scrapedItem]);
        setScrapingProgress((prevProgress) => prevProgress + 1);
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while scraping.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleClearContacts = () => {
    setScrapedData([]);
  }

  const handleRemoveRecentSearch = (searchToRemove: string) => {
    const newRecentSearches = recentSearches.filter(s => s.toLowerCase() !== searchToRemove.toLowerCase());
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  const handleClearRecentSearches = () => {
      setRecentSearches([]);
      localStorage.removeItem('recentSearches');
  };
  
  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setComponentQuery(transcript);
    };
    
    recognitionRef.current.start();
  }, [isListening]);

  useEffect(() => {
      if (componentQuery && isListening) {
          handleSearch(componentQuery);
      }
  }, [componentQuery, isListening, handleSearch]);

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


  const handleDownloadPDF = () => {
    if (!window.jspdf || scrapedData.length === 0) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(18);
    doc.text(`self-flow extra: All Scraped Contacts`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on ${new Date().toLocaleDateString()}`, 14, 30);

    const allPeople = scrapedData.flatMap(company => 
      company.people.map(person => ({ ...person, companyUrl: company.url }))
    );
      
    const body = allPeople.map(person => [
      person.companyUrl,
      person.name,
      person.role,
      person.email || 'N/A',
      Object.entries(person.socialMedia || {})
        .map(([platform, link]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${link}`)
        .join('\n') || 'N/A'
    ]);

    (doc as any).autoTable({
      startY: 40,
      theme: 'grid',
      styles: { overflow: 'linebreak', cellPadding: 2, fontSize: 8 },
      headStyles: { fillColor: '#1e40af', textColor: '#ffffff', fontStyle: 'bold' },
      head: [["Company URL", "Name", "Role", "Email", "Social Media"]],
      body,
      columnStyles: { 
        0: { cellWidth: 50 }, 
        1: { cellWidth: 40 }, 
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }, 
        4: { cellWidth: 'auto' } 
      },
    });
    doc.save(`all_contact_data_${new Date().getTime()}.pdf`);
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
        await scrapeContactInfoFromUrls(foundCompanies, (scrapedItem) => {
          setScrapedData((prevData) => [...prevData, scrapedItem]);
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
  const tourActiveAndOnStep = (step: number) => showTour && tourStep === step;
  const showRecentSearches = recentSearches.length > 0 || tourActiveAndOnStep(4);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {showTour && <TourGuide step={tourStep} onNext={handleTourNext} onPrev={handleTourPrev} onSkip={handleTourSkip} />}
      <div className="w-full max-w-6xl mx-auto">
        <Header />

        <main className="mt-8">
          <div id="tour-search-bar" className="max-w-2xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={componentQuery}
                  onChange={(e) => setComponentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                  placeholder="e.g., 'React date picker' or 'Stripe payment gateway'"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 pl-4 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Component or service to search for"
                  disabled={isLoading || isScraping || !!processingKeyword}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                        id="tour-generate-ideas"
                        onClick={() => setIsKeywordModalOpen(true)}
                        className="p-2 text-gray-400 hover:text-cyan-300 transition-colors"
                        title="Generate search ideas"
                        aria-label="Generate search ideas"
                        disabled={isLoading || isScraping || !!processingKeyword}
                    >
                        <GlobeIcon className="h-6 w-6" />
                    </button>
                    <button
                        id="tour-voice-search"
                        onClick={handleVoiceSearch}
                        className={`p-2 text-gray-400 hover:text-cyan-300 transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                        aria-label={isListening ? 'Stop listening' : 'Start voice search'}
                        disabled={isLoading || isScraping || !!processingKeyword}
                    >
                        <MicIcon className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => handleSearch()}
                        className="p-2 text-gray-400 hover:text-cyan-300 transition-colors"
                        aria-label="Search"
                        disabled={isLoading || isScraping || !!processingKeyword}
                    >
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>
              </div>
            </div>
            {showRecentSearches && (
                <div id="tour-recent-searches" className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                    <span className="text-gray-400 font-semibold">Recent:</span>
                    {recentSearches.length > 0 ? (
                        <>
                            {recentSearches.map((search, index) => (
                                <div key={index} className="flex items-center bg-gray-700/60 rounded-full hover:bg-gray-700 transition-colors">
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
                                        className="pr-2 text-gray-500 hover:text-white"
                                        aria-label={`Remove ${search} from recent searches`}
                                        title={`Remove ${search}`}
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleClearRecentSearches}
                                className="text-gray-500 hover:text-red-400 text-xs underline ml-2"
                                aria-label="Clear all recent searches"
                            >
                                Clear
                            </button>
                        </>
                    ) : (
                         <div className="flex items-center bg-gray-700/60 rounded-full">
                            <span className="text-cyan-200 pl-3 pr-2 py-1">Example Search</span>
                            <button className="pr-2 text-gray-500 cursor-default" aria-hidden="true">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>

          <div id="tour-user-offer" className="max-w-2xl mx-auto w-full mt-6">
            <label htmlFor="user-offer" className="block text-lg font-semibold text-gray-300 mb-2">
              Your Product/Service Offer
            </label>
            <textarea
                id="user-offer"
                rows={3}
                value={userOffer}
                onChange={(e) => setUserOffer(e.target.value)}
                placeholder="Describe your product or service here. This will be used to generate personalized outreach messages. e.g., 'I provide a service that automates customer support tickets using AI...'"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                disabled={isLoading || isScraping || !!processingKeyword}
            />
          </div>
          
          {keywordQueue.length > 0 && (
              <div id="tour-keyword-queue" className="max-w-2xl mx-auto w-full p-4 mt-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-cyan-200">Keyword Queue</h3>
                      <button
                          onClick={handleClearQueue}
                          className="text-gray-500 hover:text-red-400 text-xs underline"
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
                          <div key={index} className={`flex items-center rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-800/60' : 'bg-gray-700/60 hover:bg-gray-700'}`}>
                              <button
                                  onClick={() => handleQueueSearch(keyword)}
                                  disabled={isProcessing || !!processingKeyword}
                                  className={`pl-3 pr-2 py-1 text-left flex items-center gap-2 ${isCompleted ? 'text-green-200 line-through' : 'text-cyan-200'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                  title={`Search & Scrape for ${keyword}`}
                              >
                                  {isProcessing && <div className="w-4 h-4 border-2 border-t-transparent border-dashed rounded-full animate-spin border-white"></div>}
                                  <span>{keyword}</span>
                              </button>
                              <button
                                  onClick={() => handleRemoveFromQueue(keyword)}
                                  disabled={isProcessing}
                                  className="pr-2 text-gray-500 hover:text-white disabled:opacity-50"
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
            <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg relative text-center mt-4 max-w-2xl mx-auto" role="alert">
                <strong className="font-bold">An error occurred: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div id="tour-results-section">
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
                          className="bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-full md:w-48"
                          aria-label="Filter found companies by name"
                      />
                      <button 
                        onClick={handleScrapeContacts}
                        disabled={isScraping}
                        className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
                        aria-label="Find contact information for these companies"
                      >
                        <ScrapeIcon className="w-5 h-5" />
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
            {tourActiveAndOnStep(6) && results.length === 0 && <TourPlaceholder text="Companies you find will be listed here." />}
          </div>

          <div id="tour-scraped-data-section">
            {isScraping && (
              <div className="mt-8 w-full">
                <p className="text-center text-cyan-300">Scraping contact info... please wait.</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(scrapingProgress / (filteredCompanyResults.length || 1)) * 100}%` }}></div>
                </div>
                <p className="text-center text-sm text-gray-400 mt-1">{scrapingProgress} / {filteredCompanyResults.length} sites scraped.</p>
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
                      <CSVIcon className="w-5 h-5" />
                      <span>CSV</span>
                    </button>
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      aria-label="Download all scraped contacts as PDF"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      <span>PDF</span>
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
            {tourActiveAndOnStep(7) && !isScraping && scrapedData.length === 0 && <TourPlaceholder text="Detailed contact information will appear in a table here. Click on a person to generate outreach." />}
          </div>
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

export default App;