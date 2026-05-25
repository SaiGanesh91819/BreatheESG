import React, { useState, useRef } from 'react';
import './ManualUpload.css';

export default function ManualUpload({ onFileUpload }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files[0]);
    }
  };

  const handleFiles = (file) => {
    // Check supported file formats
    const fileName = file.name;
    const extension = fileName.split('.').pop().toLowerCase();
    if (['csv', 'xlsx', 'pdf'].includes(extension)) {
      onFileUpload(file);
    } else {
      alert('Unsupported file format. Please upload a .csv, .xlsx, or .pdf file.');
    }
  };

  return (
    <div className="manual-upload-section">
      <h3 className="upload-section-title">Manual Upload</h3>
      <div
        className={`upload-drop-zone ${isDragOver ? 'dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="upload-icon-box">
          <span className="material-symbols-outlined upload-cloud-icon">cloud_upload</span>
        </div>
        <h4 className="upload-prompt">Drop files here to ingest raw data</h4>
        <p className="upload-specs">
          Supported formats: .csv, .xlsx, .pdf (OCR parsing available). Maximum file size 50MB.
        </p>
        <button className="upload-btn">Browse Files</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, .xlsx, .pdf"
          className="hidden-file-input"
        />
      </div>
    </div>
  );
}
