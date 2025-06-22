"use client"

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'next/navigation';

interface AnalysisFile {
  _id: string;
  csv_filename: string;
  financial_analysis: string;
}

export default function AnalysisPage() {
  const [file, setFile] = useState<AnalysisFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const fileId = params.id as string;

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${fileId}`);
        const data = await response.json();
        
        if (data.success) {
          setFile(data.file);
        } else {
          setError(data.error || 'Failed to fetch analysis data');
        }
      } catch (err) {
        setError('Error loading analysis');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchAnalysis();
    }
  }, [fileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No analysis found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4 tracking-tight text-blue-600">
            Financial Analysis
          </h1>
          <p className="text-lg text-slate-600 font-light">
            AI-powered insights from your financial statements
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-medium text-slate-900">
              {file.csv_filename}
            </h2>
          </div>
          <div className="px-6 py-6">
            {file.financial_analysis ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{file.financial_analysis}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No analysis available for this file.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
