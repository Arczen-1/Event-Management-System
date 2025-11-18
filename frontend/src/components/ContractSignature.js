import React, { useState } from 'react';
import './ContractSignature.css'; // Optional CSS file

const ContractSignature = ({ contractData, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contractPdf, setContractPdf] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationPreview, setValidationPreview] = useState(null);
  const [error, setError] = useState('');

  // Step 1: Generate Contract
  const handleGenerateContract = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/contracts/generate-for-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setContractPdf(result);
        setStep(2);
      } else {
        setError(result.message || 'Failed to generate contract');
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      setError('Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownload = () => {
    if (contractPdf?.pdfData) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${contractPdf.pdfData}`;
      link.download = contractPdf.fileName;
      link.click();
    }
  };

  // Handle file upload with preview
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setError('');
    setValidationPreview(null);

    if (file) {
      // Basic client-side validation
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, JPEG)');
        return;
      }

      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setValidationPreview({
            width: img.width,
            height: img.height,
            aspectRatio: (img.width / img.height).toFixed(2),
            size: (file.size / 1024).toFixed(2) + ' KB',
            previewUrl: e.target.result
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload signed contract
  const handleUploadSigned = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('signedContract', uploadedFile);
    formData.append('contractId', contractPdf.contractId);
    formData.append('clientName', contractData.celebratorName);

    try {
      const response = await fetch('http://localhost:5000/api/contracts/upload-signed', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep(3);
        if (onComplete) onComplete(result);
      } else {
        setError(result.message || 'Upload failed');
        if (result.suggestions) {
          setError(prev => prev + ' ' + result.suggestions.join(' '));
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload signed contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-signature">
      {/* Step 1: Generate Contract */}
      {step === 1 && (
        <div className="step step-1">
          <div className="step-header">
            <div className="step-number">1</div>
            <h3>Review and Sign Contract</h3>
          </div>
          <p>Generate your contract document for review and signature.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            onClick={handleGenerateContract} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Generating Contract...' : 'Review and Sign'}
          </button>
        </div>
      )}

      {/* Step 2: Download & Upload */}
      {step === 2 && contractPdf && (
        <div className="step step-2">
          <div className="step-header">
            <div className="step-number">2</div>
            <h3>Sign and Upload Contract</h3>
          </div>
          
          <div className="guidelines">
            <h4>📝 Signature Guidelines:</h4>
            <ul>
              <li>✅ Upload a clear image of your <strong>actual signature</strong></li>
              <li>✅ Sign on white paper and take a clear photo</li>
              <li>✅ Or create a digital signature</li>
              <li>✅ Use PNG, JPG, or JPEG format</li>
              <li>❌ Do not upload random images or blank files</li>
            </ul>
          </div>

          <div className="actions">
            <div className="download-section">
              <button onClick={handleDownload} className="btn btn-secondary">
                📄 Download Contract PDF
              </button>
            </div>
            
            <div className="upload-section">
              <h5>Upload Your Signed Contract:</h5>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
                id="signature-upload"
              />
              <label htmlFor="signature-upload" className="file-input-label">
                Choose Signature Image
              </label>
              <small>Accepted: PNG, JPG, JPEG (Max 5MB)</small>
              
              {validationPreview && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img src={validationPreview.previewUrl} alt="Signature preview" />
                    <div className="preview-info">
                      <p><strong>Dimensions:</strong> {validationPreview.width} × {validationPreview.height}px</p>
                      <p><strong>File Size:</strong> {validationPreview.size}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {uploadedFile && !validationPreview && (
                <div className="file-info">
                  <strong>Selected:</strong> {uploadedFile.name}
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <button 
                onClick={handleUploadSigned} 
                disabled={!uploadedFile || loading}
                className="btn btn-primary upload-btn"
              >
                {loading ? 'Validating and Uploading...' : 'Submit Signed Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="step step-3">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Signature Validated Successfully!</h3>
            <p>Your signed contract has been received and validated.</p>
            
            <div className="next-steps">
              <h5>Next Steps:</h5>
              <ul>
                <li>Our team will process your contract</li>
                <li>You will receive confirmation within 24 hours</li>
                <li>Check your email for updates</li>
              </ul>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-secondary"
            >
              Start New Contract
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSignature;