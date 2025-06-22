'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FileData {
  _id: string;
  original_filename: string;
  csv_filename: string;
  gridfs_file_id: string;
  upload_date: string;
  file_size: number;
  row_count: number;
  columns: string[];
  status: string;
  financial_analysis?: string;
  financial_model?: string;
}

interface FileTableProps {
  files: FileData[];
  isLoading?: boolean;
}

export function FileTable({ files, isLoading }: FileTableProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Sort files by upload_date in descending order (most recent first)
  const sortedFiles = [...files].sort((a, b) => 
    new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );

  if (isLoading) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        Loading files...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        No files found.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (file: FileData) => {
    setDownloadingFiles(prev => new Set(prev).add(file._id));
    
    try {
      const response = await fetch(`/api/download/${file.gridfs_file_id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.csv_filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file._id);
        return newSet;
      });
    }
  };

  const handleViewAnalysis = (fileId: string) => {
    router.push(`/pages/analysis/${fileId}`);
  };

  const handleViewModel = (fileId: string) => {
    router.push(`/pages/model/${fileId}`);
  };

  return (
    <div className="w-full px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Name</TableHead>
            <TableHead className="text-center">Analysis</TableHead>
            <TableHead className="text-center">Model</TableHead>
            <TableHead className="text-center">Download</TableHead>
            <TableHead className="">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiles.map((file) => (
            <TableRow key={file._id}>
              <TableCell className="text-sm text-muted-foreground text-center">{file.csv_filename}</TableCell>
              <TableCell className="text-center">
                {file.financial_analysis ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewAnalysis(file._id)}
                    className="h-8 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {file.financial_model ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewModel(file._id)}
                    className="h-8 px-3 text-green-600 hover:text-green-800 hover:bg-green-50"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {file.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFiles.has(file._id)}
                    className="h-8 w-8 p-0"
                  >
                    {downloadingFiles.has(file._id) ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </TableCell>
              <TableCell className="text-sm text-center">{formatDate(file.upload_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
