"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Upload, FileText, Check, AlertCircle, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileTable } from "@/components/file-table"

// Types
interface UploadedFile {
  id: string
  name: string
  size: number
  status: "uploading" | "success" | "error"
  statementType: "Income Statement" | "Balance Sheet" | "Cash Flow Statement"
  fiscalYear: string
  companyName: string
  error?: string
}

interface FileData {
  _id: string
  original_filename: string
  csv_filename: string
  gridfs_file_id: string
  upload_date: string
  file_size: number
  row_count: number
  columns: string[]
  status: string
}

// API functions
async function uploadPDF(file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload failed');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error('Upload failed');
  }

  return { id: result.id };
}

async function fetchFiles(): Promise<FileData[]> {
  const response = await fetch('/api/process', {
    method: 'GET',
  });

  const result = await response.json();

  return result.files;
}

// Mock data generators
function generateMockMetadata(): Pick<UploadedFile, "statementType" | "fiscalYear" | "companyName"> {
  const statementTypes: UploadedFile["statementType"][] = ["Income Statement", "Balance Sheet", "Cash Flow Statement"]
  const years = ["2023", "2022", "2021", "2020"]
  const companies = ["Acme Corp", "TechStart Inc", "Global Industries", "Innovation Ltd"]

  return {
    statementType: statementTypes[Math.floor(Math.random() * statementTypes.length)],
    fiscalYear: years[Math.floor(Math.random() * years.length)],
    companyName: companies[Math.floor(Math.random() * companies.length)],
  }
}

export default function Funnel() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dbFiles, setDbFiles] = useState<FileData[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Load files from database on component mount
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const filesData = await fetchFiles()
      setDbFiles(filesData)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // File upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")

    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [])

  const handleFileUpload = async (filesToUpload: File[]) => {
    const newFiles: UploadedFile[] = filesToUpload.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading" as const,
      ...generateMockMetadata(),
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Upload files
    for (const file of filesToUpload) {
      const fileIndex = files.length + filesToUpload.indexOf(file)
      try {
        const result = await uploadPDF(file)
        setFiles((prev) => prev.map((f, i) => (i === fileIndex ? { ...f, id: result.id, status: "success" } : f)))
        
        // Refresh the file table after successful upload
        await loadFiles()
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        )
      }
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="max-w-4xl mx-auto px-8 py-16">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-light mb-6 tracking-tight text-blue-600 font-inter">Funnel</h1>
            <p className="text-xl text-slate-600 font-light max-w-lg mx-auto leading-relaxed">
              Financial statements processed in seconds
            </p>
          </div>

          {/* Upload Section */}
          <div className="space-y-12">
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl text-center transition-all duration-300 cursor-pointer bg-white min-h-[280px] flex flex-col",
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 hover:border-blue-300 hover:bg-blue-50/30",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.multiple = true
                input.accept = ".pdf"
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || [])
                  if (files.length > 0) {
                    handleFileUpload(files)
                  }
                }
                input.click()
              }}
            >
              {files.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center p-16">
                  <Upload
                    className={cn(
                      "w-8 h-8 mx-auto mb-6 transition-colors duration-300",
                      dragActive ? "text-blue-500" : "text-slate-400",
                    )}
                    strokeWidth={1}
                  />
                  <p className="text-lg text-slate-700 mb-2 font-light">Add your statements</p>
                  <p className="text-sm text-slate-400 font-light">PDF files only</p>
                </div>
              ) : (
                <div className="flex-1 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Upload className="w-5 h-5 text-slate-400" strokeWidth={1} />
                      <p className="text-lg text-slate-700 font-light">Your statements</p>
                    </div>
                    <p className="text-sm text-slate-400 font-light">
                      {files.length} file{files.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100 group"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="w-4 h-4 text-slate-400" strokeWidth={1} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                            {file.status === "error" && file.error && (
                              <p className="text-xs text-red-500 mt-1">{file.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {file.status === "uploading" && (
                            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
                          )}
                          {file.status === "success" && (
                            <Check className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                          )}
                          {file.status === "error" && (
                            <AlertCircle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                            className="w-5 h-5 rounded-full border border-slate-400 bg-slate-100 flex items-center justify-center transition-all duration-200 hover:border-red-500 hover:bg-red-500 group/delete"
                            title="Remove file"
                          >
                            <Minus
                              className="w-2.5 h-2.5 text-slate-400 group-hover/delete:text-white transition-colors duration-200"
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400 font-light text-center">
                      Drop more files here or click to add
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* File Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">Recent Files</h3>
                <p className="text-sm text-slate-500 mt-1">Files stored in your database</p>
              </div>
              <FileTable files={dbFiles} isLoading={isLoadingFiles} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
