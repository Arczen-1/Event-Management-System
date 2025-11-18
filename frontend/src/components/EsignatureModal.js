import React, { useState } from 'react';

const ESignatureModal = ({ isOpen, onClose, onSign, contractData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [signingUrl, setSigningUrl] = useState(null);

  const handleCreateEnvelope = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/docusign/create-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractData,
          signer: {
            name: contractData.representativeName,
            email: contractData.representativeEmail
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create envelope');
      }

      // Store the signing URL and envelope ID
      setSigningUrl(result.signingUrl);
      
      const signedDocument = {
        envelopeId: result.envelopeId,
        status: 'pending',
        signingUrl: result.signingUrl,
        createdAt: new Date().toISOString(),
        signer: contractData.representativeName
      };

      onSign(signedDocument);
      
      // Open DocuSign signing ceremony in new tab
      window.open(result.signingUrl, '_blank');
      
      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('DocuSign error:', error);
      alert(`DocuSign Error: ${error.message}. Using local signature instead.`);
      
      // Fallback to local signature
      const signedDocument = {
        signature: 'signed_locally',
        signedAt: new Date().toISOString(),
        signer: contractData.representativeName,
        status: 'signed_locally'
      };
      
      onSign(signedDocument);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Sign Contract with DocuSign</h2>
        
        <div className="contract-summary">
          <h4>Contract Details:</h4>
          <p><strong>Contract #:</strong> {contractData.contractNumber}</p>
          <p><strong>Event:</strong> {contractData.occasion}</p>
          <p><strong>Client:</strong> {contractData.celebratorName}</p>
          <p><strong>Total Amount:</strong> ₱{contractData.grandTotal}</p>
        </div>

        <div className="docusign-info">
          <p>You'll be redirected to DocuSign to complete your signature securely.</p>
          <p><strong>Signer:</strong> {contractData.representativeName}</p>
          <p><strong>Email:</strong> {contractData.representativeEmail}</p>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleCreateEnvelope}
            disabled={isCreating}
            className="btn-primary"
          >
            {isCreating ? 'Creating Document...' : 'Sign with DocuSign'}
          </button>
        </div>

        {signingUrl && (
          <div className="signing-info">
            <p>✅ Document sent to DocuSign. Check your email or the new tab to sign.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ESignatureModal;