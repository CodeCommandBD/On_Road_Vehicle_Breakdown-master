"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// Configure worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer({ url, title = "Document" }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 rounded-lg min-h-[500px]">
      {/* Controls */}
      <div className="w-full flex items-center justify-between bg-white p-3 rounded-md shadow-sm mb-4">
        <h3 className="font-semibold text-gray-700 truncate max-w-[200px]">
          {title}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => changePage(-1)}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm">
            {pageNumber} / {numPages || "--"}
          </p>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => changePage(1)}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Warning if no URL */}
      {!url && (
        <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-400">No PDF URL provided</p>
        </div>
      )}

      {/* PDF Document */}
      {url && (
        <div className="relative border shadow-lg bg-white">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-[500px] w-[350px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            }
            error={
              <div className="p-10 text-center text-red-500">
                Failed to load PDF.
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="max-w-full"
            />
          </Document>
        </div>
      )}
    </div>
  );
}
