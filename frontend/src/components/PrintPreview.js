import React from 'react';

const PrintPreview = ({ contractData, onClose, onPrint }) => {
  const handlePrint = () => {
    window.print();
    onPrint();
  };

  return (
    <div className="print-preview">
      <div className="print-preview-header">
        <button onClick={onClose} className="btn-secondary">Close</button>
        <button onClick={handlePrint} className="btn-primary">Print Contract</button>
      </div>

      <div className="contract-document">
        {/* Contract Header */}
        <div className="contract-header">
          <h1>EVENT CONTRACT AGREEMENT</h1>
          <div className="contract-meta">
            <p><strong>Contract #:</strong> {contractData.contractNumber}</p>
            <p><strong>Date Created:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Client Information */}
        <section className="contract-section">
          <h2>CLIENT INFORMATION</h2>
          <div className="contract-grid">
            <div>
              <p><strong>Celebrator/Corporate Name:</strong> {contractData.celebratorName}</p>
              <p><strong>Email:</strong> {contractData.celebratorEmail}</p>
              <p><strong>Mobile:</strong> {contractData.celebratorMobile}</p>
            </div>
            <div>
              <p><strong>Representative:</strong> {contractData.representativeName}</p>
              <p><strong>Relationship:</strong> {contractData.representativeRelationship}</p>
              <p><strong>Email:</strong> {contractData.representativeEmail}</p>
            </div>
          </div>
        </section>

        {/* Event Details */}
        <section className="contract-section">
          <h2>EVENT DETAILS</h2>
          <div className="contract-grid">
            <div>
              <p><strong>Occasion:</strong> {contractData.occasion}</p>
              <p><strong>Date:</strong> {contractData.eventDate}</p>
              <p><strong>Venue:</strong> {contractData.venue}</p>
            </div>
            <div>
              <p><strong>Hall:</strong> {contractData.hall}</p>
              <p><strong>Total Guests:</strong> {contractData.totalGuests}</p>
              <p><strong>Service Style:</strong> {contractData.serviceStyle}</p>
            </div>
          </div>
        </section>

        {/* Menu Details */}
        <section className="contract-section">
          <h2>MENU & SERVICES</h2>
          <div className="menu-breakdown">
            <p><strong>Selected Package:</strong> {contractData.selectedPackage}</p>
            <p><strong>Price Per Plate:</strong> ₱{contractData.pricePerPlate}</p>
            
            {/* Creative Requirements */}
            <div className="cost-breakdown">
              <h4>Creative Requirements</h4>
              {Object.entries(contractData.creativeCosts || {}).map(([key, value]) => (
                value > 0 && (
                  <p key={key}><strong>{key}:</strong> ₱{value}</p>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Financial Summary */}
        <section className="contract-section financial-summary">
          <h2>FINANCIAL SUMMARY</h2>
          <table className="financial-table">
            <tbody>
              <tr>
                <td>Base Menu Cost:</td>
                <td>₱{contractData.totalMenuCost}</td>
              </tr>
              <tr>
                <td>Creative Requirements:</td>
                <td>₱{contractData.totalCreativeRequirementCost}</td>
              </tr>
              <tr>
                <td>Mobilization Charge:</td>
                <td>₱{contractData.mobilizationCharge}</td>
              </tr>
              <tr className="subtotal">
                <td><strong>Subtotal:</strong></td>
                <td><strong>₱{contractData.subtotal}</strong></td>
              </tr>
              <tr>
                <td>VAT (12%):</td>
                <td>₱{contractData.tax}</td>
              </tr>
              <tr>
                <td>Service Charge (10%):</td>
                <td>₱{contractData.serviceCharge}</td>
              </tr>
              <tr className="grand-total">
                <td><strong>GRAND TOTAL:</strong></td>
                <td><strong>₱{contractData.grandTotal}</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Terms and Conditions */}
        <section className="contract-section">
          <h2>TERMS & CONDITIONS</h2>
          <div className="terms-content">
            <p>1. A 50% downpayment is required upon signing to confirm the reservation.</p>
            <p>2. The remaining balance must be settled 7 days before the event date.</p>
            <p>3. Cancellations made 30 days before the event will receive a full refund of the downpayment.</p>
            <p>4. Changes to the menu must be communicated at least 14 days before the event.</p>
            <p>5. The client is responsible for any damages to equipment and venue property.</p>
          </div>
        </section>

        {/* Signatures */}
        <section className="contract-section signatures">
          <div className="signature-fields">
            <div className="signature-box">
              <p>_________________________</p>
              <p><strong>Client Signature</strong></p>
              <p>Name: {contractData.representativeName}</p>
              <p>Date: ___________________</p>
            </div>
            <div className="signature-box">
              <p>_________________________</p>
              <p><strong>Juan Carlo The Caterer</strong></p>
              <p>Authorized Representative</p>
              <p>Date: ___________________</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrintPreview;