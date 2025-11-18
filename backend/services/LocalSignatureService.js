const PDFDocument = require('pdfkit');

class LocalSignatureService {
  async generateContractPDF(contractData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Debug: Log the incoming data structure
        console.log('Contract Data Received:', JSON.stringify(contractData, null, 2));

        // Helper function to safely access nested properties
        const get = (obj, path, defaultValue = 'N/A') => {
          const value = path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
          }, obj);
          return value !== undefined ? value : defaultValue;
        };

        // Helper function to format keys to titles
        const toTitle = (key) => {
          return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (c) => c.toUpperCase());
        };

        // Helper function to render sections
        const renderSection = (title, data, startY) => {
          let currentY = startY;
          
          // Section header
          doc.fontSize(14).font('Helvetica-Bold')
             .text(title.toUpperCase(), 50, currentY);
          currentY += 25;
          
          // Filter out empty values
          const entries = Object.entries(data || {}).filter(([_, v]) => 
            v !== undefined && v !== null && v !== 'N/A' && String(v).trim() !== ""
          );
          
          if (entries.length === 0) {
            doc.fontSize(10).font('Helvetica')
               .text('No data available', 50, currentY);
            currentY += 20;
          } else {
            entries.forEach(([key, value]) => {
              doc.fontSize(10).font('Helvetica-Bold')
                 .text(`${toTitle(key)}:`, 50, currentY);
              doc.fontSize(10).font('Helvetica')
                 .text(String(value), 150, currentY);
              currentY += 20;
              
              // Check if we need a new page
              if (currentY > 700) {
                doc.addPage();
                currentY = 50;
              }
            });
          }
          
          return currentY + 10;
        };

        // Header Section
        doc.fontSize(20).font('Helvetica-Bold')
           .text('EVENT CONTRACT AGREEMENT', 50, 50, { align: 'center' });
        
        const contractDate = new Date().toLocaleDateString();
        const contractNumber = get(contractData, 'contractNumber', `CONTRACT-${Date.now()}`);
        const status = get(contractData, 'status', 'Draft');
        
        doc.fontSize(12).font('Helvetica')
           .text(`Contract Date: ${contractDate}`, 50, 80)
           .text(`Contract Number: ${contractNumber}`, 50, 95)
           .text(`Status: ${status}`, 50, 110);

        let currentY = 140;

        // Contract Details Section
        const contractDetails = {
          'Contract Number': contractNumber,
          'Contract Date': contractDate,
          'Status': status,
          'Department': get(contractData, 'department'),
          'Occasion': get(contractData, 'page1.occasion'),
          'Event Date': get(contractData, 'page1.eventDate'),
          'Service Style': get(contractData, 'page1.serviceStyle'),
          'Venue': get(contractData, 'page1.venue'),
          'Hall': get(contractData, 'page1.hall')
        };
        
        currentY = renderSection('Contract Details', contractDetails, currentY);

        // Client Information Section
        const clientInfo = {
          'Celebrator Name': get(contractData, 'page1.celebratorName'),
          'Celebrator Email': get(contractData, 'page1.celebratorEmail'),
          'Celebrator Mobile': get(contractData, 'page1.celebratorMobile'),
          'Celebrator Address': get(contractData, 'page1.celebratorAddress'),
          'Representative Name': get(contractData, 'page1.representativeName'),
          'Representative Relationship': get(contractData, 'page1.representativeRelationship'),
          'Coordinator Name': get(contractData, 'page1.coordinatorName'),
          'Coordinator Mobile': get(contractData, 'page1.coordinatorMobile')
        };
        
        currentY = renderSection('Client Information', clientInfo, currentY);

        // Event Details Section
        const eventDetails = {
          'Total Guests': get(contractData, 'page1.totalGuests'),
          'Total VIP': get(contractData, 'page1.totalVIP'),
          'Total Regular': get(contractData, 'page1.totalRegular'),
          'Ingress Time': get(contractData, 'page1.ingressTime'),
          'Cocktail Time': get(contractData, 'page1.cocktailTime'),
          'Arrival of Guests': get(contractData, 'page1.arrivalOfGuests'),
          'Serving Time': get(contractData, 'page1.servingTime'),
          'Theme Setup': get(contractData, 'page1.themeSetup'),
          'Color Motif': get(contractData, 'page1.colorMotif'),
          'Venue Address': get(contractData, 'page1.address')
        };
        
        currentY = renderSection('Event Details', eventDetails, currentY);

        // PACKAGE & SERVICES SECTION
        doc.fontSize(14).font('Helvetica-Bold')
           .text('PACKAGE & SERVICES', 50, currentY);
        currentY += 25;

        // Selected Package
        const selectedPackage = get(contractData, 'pageBuffet.selectedPackage');
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Selected Package:', 50, currentY);
        doc.fontSize(12).font('Helvetica')
           .text(selectedPackage, 180, currentY);
        currentY += 20;

        // Price Information
        const pricePerPlate = get(contractData, 'page3.pricePerPlate');
        const totalMenuCost = get(contractData, 'page3.totalMenuCost');
        
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Price per Plate:', 50, currentY);
        doc.fontSize(12).font('Helvetica')
           .text(pricePerPlate !== 'N/A' ? `₱${pricePerPlate}` : '₱0.00', 180, currentY);
        currentY += 20;

        doc.fontSize(12).font('Helvetica-Bold')
           .text('Total Menu Cost:', 50, currentY);
        doc.fontSize(12).font('Helvetica')
           .text(totalMenuCost !== 'N/A' ? `₱${totalMenuCost}` : '₱0', 180, currentY);
        currentY += 25;

        // Menu Selections Helper Function
        const renderMenuSection = (title, items, priceInfo = '') => {
          if (!items || items.length === 0 || (Array.isArray(items) && items.every(item => !item))) {
            return currentY;
          }
          
          doc.fontSize(11).font('Helvetica-Bold')
             .text(`${title}:`, 50, currentY);
          currentY += 15;
          
          items.forEach(item => {
            if (item) {
              doc.fontSize(10).font('Helvetica')
                 .text(`• ${item} ${priceInfo}`, 60, currentY, { width: 500 });
              currentY += 15;
            }
          });
          
          currentY += 5;
          return currentY;
        };

        // Get all menu selections
        const cocktailSelections = get(contractData, 'pageBuffet.cocktailSelections', []);
        const foodStations = get(contractData, 'pageBuffet.foodStations', []);
        const appetizer125 = get(contractData, 'pageBuffet.appetizerUpgradeSelections125', []);
        const soupSelections = get(contractData, 'pageBuffet.soupSelections', []);
        const salad125 = get(contractData, 'pageBuffet.saladUpgradeSelections125', []);
        const beefSelections = get(contractData, 'pageBuffet.mainBeefSelections', []);
        const fishSelections = get(contractData, 'pageBuffet.mainFishSelections', []);
        const chickenSelections = get(contractData, 'pageBuffet.mainChickenSelections', []);
        const pastaSelections = get(contractData, 'pageBuffet.mainPastaSelections', []);
        const riceSelections = get(contractData, 'pageBuffet.riceSelections', []);
        const dessertSelections = get(contractData, 'pageBuffet.dessertSelections', []);
        const drinksSelections = get(contractData, 'pageBuffet.drinksSelections', []);

        // Render menu sections
        currentY = renderMenuSection('Cocktail Hour', cocktailSelections);
        
        // Food Stations
        if (foodStations.length > 0) {
          doc.fontSize(11).font('Helvetica-Bold')
             .text('Food Stations:', 50, currentY);
          currentY += 15;
          
          foodStations.forEach(station => {
            const cost = station.cost ? `(+₱${station.cost})` : '';
            const name = station.name || 'Unnamed Station';
            doc.fontSize(10).font('Helvetica')
               .text(`• ${name} ${cost}`, 60, currentY, { width: 500 });
            currentY += 15;
          });
          currentY += 5;
        }

        // Other menu sections
        currentY = renderMenuSection('Appetizers', appetizer125, '(+₱125)');
        currentY = renderMenuSection('Soup', soupSelections);
        currentY = renderMenuSection('Salad', salad125, '(+₱125)');
        currentY = renderMenuSection('Beef Entrees', beefSelections);
        currentY = renderMenuSection('Fish Entrees', fishSelections);
        currentY = renderMenuSection('Chicken Entrees', chickenSelections);
        currentY = renderMenuSection('Pasta', pastaSelections);
        currentY = renderMenuSection('Rice', riceSelections);
        currentY = renderMenuSection('Dessert', dessertSelections);
        currentY = renderMenuSection('Drinks', drinksSelections);

        // Creative Requirements Section
        if (currentY > 600) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.fontSize(14).font('Helvetica-Bold')
           .text('CREATIVE REQUIREMENTS', 50, currentY);
        currentY += 25;

        const creativeRequirements = {
          'Backdrop': get(contractData, 'page2.backdrop'),
          'Flowers': get(contractData, 'page2.flower'),
          'Decor': get(contractData, 'page2.decor'),
          'Entrance': get(contractData, 'page2.entrance'),
          'Staging': get(contractData, 'page2.staging'),
          'Equipment': get(contractData, 'page2.equipment'),
          'Miscellaneous': get(contractData, 'page2.miscellaneous'),
          'VIP Table Type': get(contractData, 'page1.vipTableType'),
          'VIP Chairs': get(contractData, 'page1.vipChairs'),
          'Regular Table Type': get(contractData, 'page1.regularTableType'),
          'Regular Chairs': get(contractData, 'page1.regularChairs')
        };
        
        currentY = renderSection('Creative Setup', creativeRequirements, currentY);

        // Creative Costs Breakdown
        const creativeCosts = get(contractData, 'page2.creativeCosts');
        if (creativeCosts && creativeCosts !== 'N/A') {
          doc.fontSize(12).font('Helvetica-Bold')
             .text('Creative Costs Breakdown:', 50, currentY);
          currentY += 20;

          Object.entries(creativeCosts).forEach(([item, cost]) => {
            if (cost > 0) {
              doc.fontSize(10).font('Helvetica')
                 .text(`• ${toTitle(item)}: ₱${cost}`, 60, currentY);
              currentY += 15;
            }
          });
          
          const totalCreativeCost = get(contractData, 'page2.totalCreativeRequirementCost');
          doc.fontSize(11).font('Helvetica-Bold')
             .text(`Total Creative Requirements Cost: ₱${totalCreativeCost !== 'N/A' ? totalCreativeCost : 0}`, 50, currentY);
          currentY += 25;
        }

        // Payment Information Section
        const paymentInfo = {
          'Grand Total': get(contractData, 'page3.grandTotal') !== 'N/A' ? `₱${get(contractData, 'page3.grandTotal')}` : '₱0.00',
          'Mobilization Charge': get(contractData, 'page3.mobilizationCharge') !== 'N/A' ? `₱${get(contractData, 'page3.mobilizationCharge')}` : undefined,
          'Taxes': get(contractData, 'page3.taxes') !== 'N/A' ? `₱${get(contractData, 'page3.taxes')}` : undefined,
          '40% Payment Due': get(contractData, 'page3.fortyPercentDueOn'),
          '40% Amount': get(contractData, 'page3.fortyPercentAmount') !== 'N/A' ? `₱${get(contractData, 'page3.fortyPercentAmount')}` : undefined,
          'Full Payment Due': get(contractData, 'page3.fullPaymentDueOn'),
          'Full Payment Amount': get(contractData, 'page3.fullPaymentAmount') !== 'N/A' ? `₱${get(contractData, 'page3.fullPaymentAmount')}` : undefined
        };
        
        currentY = renderSection('Payment Information', paymentInfo, currentY);

        // Terms & Conditions Section
        doc.addPage();
        currentY = 50;
        
        doc.fontSize(14).font('Helvetica-Bold')
           .text('TERMS AND CONDITIONS', 50, currentY);
        currentY += 30;
        
        const terms = [
          '1. TEST.',
          '2. The balance (60%) must be paid in full on or before the specified due date.',
          '3. Any changes to the package must be requested at least 14 days before the event.',
          '4. Cancellations made less than 30 days before the event will forfeit the down payment.',
          '5. The client is responsible for providing access to the venue and necessary facilities.',
          '6. Additional charges may apply for services beyond the agreed package scope.',
          '7. Force majeure events may result in rescheduling without penalties.',
          '8. Both parties agree to resolve disputes through mutual discussion primarily.',
          '9. Menu selections are subject to ingredient availability and may be substituted with items of equal value.',
          '10. Setup and teardown times must be strictly adhered to as per the agreed schedule.'
        ];
        
        terms.forEach(term => {
          doc.fontSize(10).font('Helvetica')
             .text(term, 50, currentY, { width: 500, align: 'justify' });
          currentY += 25;
        });

        // Signature Section
        currentY += 20;
        doc.fontSize(14).font('Helvetica-Bold')
           .text('SIGNATURES', 50, currentY);
        currentY += 30;

        // Client signature area
        const celebratorName = get(contractData, 'page1.celebratorName');
        doc.fontSize(12).font('Helvetica-Bold').text('CLIENT:', 50, currentY);
        doc.fontSize(10).font('Helvetica')
           .text(`Name: ${celebratorName}`, 50, currentY + 20);
        doc.text('Signature:', 50, currentY + 40);
        doc.moveTo(50, currentY + 60).lineTo(300, currentY + 60).stroke();
        doc.text('Date: _________________________', 50, currentY + 70);

        // Company signature area
        doc.fontSize(12).font('Helvetica-Bold').text('COMPANY REPRESENTATIVE:', 350, currentY);
        doc.fontSize(10).font('Helvetica')
           .text('Name: _________________________', 350, currentY + 20);
        doc.text('Signature:', 350, currentY + 40);
        doc.moveTo(350, currentY + 60).lineTo(600, currentY + 60).stroke();
        doc.text('Date: _________________________', 350, currentY + 70);

        // Footer
        doc.fontSize(8).font('Helvetica')
           .text(`Generated on ${new Date().toLocaleString()} | Contract ID: ${contractNumber}`, 
                 50, 750, { align: 'center' });

        doc.end();
      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  async createSignatureRequest(contractData) {
    try {
      console.log('Creating signature request with data:', {
        contractNumber: contractData.contractNumber,
        hasPage1: !!contractData.page1,
        hasPage2: !!contractData.page2,
        hasPageBuffet: !!contractData.pageBuffet,
        hasPage3: !!contractData.page3
      });

      const pdfBuffer = await this.generateContractPDF(contractData);
      const fileName = `Contract-${contractData.contractNumber || Date.now()}.pdf`;
      
      return {
        success: true,
        contractId: 'local-' + Date.now(),
        status: 'ready_for_signature',
        fileName: fileName,
        pdfData: pdfBuffer.toString('base64'),
        message: 'Contract generated successfully. Please review and sign.',
        instructions: [
          '1. Review the contract terms carefully',
          '2. Download the PDF contract',
          '3. Sign manually or digitally',
          '4. Upload the signed copy using the form below'
        ]
      };
    } catch (error) {
      console.error('Contract generation error:', error);
      throw new Error(`Failed to generate contract: ${error.message}`);
    }
  }
}

module.exports = new LocalSignatureService();