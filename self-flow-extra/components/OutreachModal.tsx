import React, { useState, useEffect } from 'react';
import { PersonInfo, ScrapedContactInfo } from '../types';
import { generateOutreachMessage } from '../services/geminiService';
import EmailIcon from './icons/EmailIcon';
import XIcon from './icons/XIcon';
import CopyIcon from './icons/CopyIcon';
import CloseIcon from './icons/CloseIcon';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: { person: PersonInfo; company: ScrapedContactInfo } | null;
  userOffer: string;
}

const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, contact, userOffer }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setMessage('');
      setSubject('');
      setError(null);
      setCopyButtonText('Copy');
    }
  }, [isOpen]);

  if (!isOpen || !contact) return null;

  const { person, company } = contact;

  const handleGenerate = async (type: 'email' | 'dm') => {
    if (!userOffer.trim()) {
      setError("Please provide your product/service offer description first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage('');
    setSubject('');
    
    try {
      const result = await generateOutreachMessage(person.name, person.role, company.url, userOffer, type);
      if (type === 'email' && result.includes('---')) {
        const parts = result.split('---');
        let subjectLine = parts[0].replace(/subject:/i, '').trim();
        if (subjectLine.startsWith('"') && subjectLine.endsWith('"')) {
          subjectLine = subjectLine.slice(1, -1);
        }
        setSubject(subjectLine);
        setMessage(parts.slice(1).join('---').trim());
      } else {
        setMessage(result);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = subject ? `Subject: ${subject}\n\n${message}` : message;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" aria-labelledby="outreach-modal-title" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl p-6 w-full max-w-2xl transform transition-all relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 id="outreach-modal-title" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
          Outreach Assistant
        </h2>
        <div className="text-gray-300 mb-4">
          <p>For: <span className="font-semibold">{person.name}</span> ({person.role})</p>
          <p>At: <span className="font-semibold">{company.url}</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <button
            onClick={() => handleGenerate('dm')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-dashed rounded-full animate-spin border-white"></div> : <XIcon className="w-5 h-5" />}
            <span>Generate X/DM</span>
          </button>
          <button
            onClick={() => handleGenerate('email')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-dashed rounded-full animate-spin border-white"></div> : <EmailIcon className="w-5 h-5" />}
            <span>Generate Email</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg text-center mt-4" role="alert">
            {error}
          </div>
        )}

        {(message || isLoading) && (
          <div className="mt-4 space-y-2">
            {subject && (
              <div>
                  <label htmlFor="subject-output" className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                  <input
                      id="subject-output"
                      type="text"
                      readOnly
                      value={subject}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white"
                  />
              </div>
            )}
            <div>
                <label htmlFor="message-output" className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  id="message-output"
                  rows={10}
                  readOnly
                  value={isLoading ? "Generating..." : message}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500"
                />
            </div>
          </div>
        )}
        
        {message && !isLoading && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <CopyIcon className="w-5 h-5" />
              <span>{copyButtonText}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachModal;
