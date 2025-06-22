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
import { Download } from 'lucide-react';
import { useState } from 'react';

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
}

interface FileTableProps {
  files: FileData[];
  isLoading?: boolean;
}

export function FileTable({ files, isLoading }: FileTableProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
        statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {status}
      </span>
    );
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

  return (
    <div className="w-full px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {/* <TableHead>Rows</TableHead>
            <TableHead>Columns</TableHead> */}
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Download</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file._id}>
              <TableCell className="text-sm text-muted-foreground">{file.csv_filename}</TableCell>
              {/* <TableCell className="text-sm">{file.row_count.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{file.columns.length}</TableCell> */}
              <TableCell>{getStatusBadge(file.status)}</TableCell>
              <TableCell className="text-sm">{formatDate(file.upload_date)}</TableCell>
              <TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
