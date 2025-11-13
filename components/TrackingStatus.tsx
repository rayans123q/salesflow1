import React, { useState, useEffect } from 'react';
import { visitorTrackingService } from '../services/visitorTrackingService';

interface TrackingStatusProps {
  className?: string;
}

const TrackingStatus: React.FC<TrackingStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState(visitorTrackingService.getTrackingStatus());
  const [isTestingTracking, setIsTestingTracking] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(visitorTrackingService.getTrackingStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleTestTracking = async () => {
    setIsTestingTracking(true);
    setTestResult(null);
    
    try {
      const result = await visitorTrackingService.testTracking();
      setTestResult(result);
      setStatus(visitorTrackingService.getTrackingStatus());
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingTracking(false);
    }
  };

  const handleResetSession = () => {
    visitorTrackingService.resetSession();
    setStatus(visitorTrackingService.getTrackingStatus());
    setTestResult(null);
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">📊 Visitor Tracking Status</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          status.isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {status.isEnabled ? '✅ Enabled' : '❌ Disabled'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Session ID:</span>
          <span className="text-white font-mono text-xs">{status.sessionId.substring(0, 20)}...</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Visits Tracked:</span>
          <span className="text-white font-semibold">{status.totalTracked}</span>
        </div>

        {status.lastError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-xs">
              <strong>Last Error:</strong> {status.lastError}
            </p>
          </div>
        )}

        {testResult && (
          <div className={`border rounded-lg p-3 ${
            testResult.success 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <p className={`text-xs ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              <strong>Test Result:</strong> {testResult.message}
            </p>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleTestTracking}
            disabled={isTestingTracking}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-sm transition-colors"
          >
            {isTestingTracking ? 'Testing...' : '🧪 Test Tracking'}
          </button>
          
          <button
            onClick={handleResetSession}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            🔄 Reset
          </button>
        </div>

        {!status.isEnabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
            <p className="text-yellow-400 text-xs">
              <strong>⚠️ Tracking Disabled:</strong> Run the SQL migration to create the visitor_analytics table.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingStatus;