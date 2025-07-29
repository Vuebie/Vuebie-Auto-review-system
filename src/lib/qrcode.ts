import QRCode from 'qrcode';

// Function to generate a URL for a QR code
export const generateQrCodeUrl = (qrId: string): string => {
  // Use the current domain with the QR ID as a parameter
  // This will work for both development and production environments
  const baseUrl = window.location.origin;
  return `${baseUrl}/review?qr=${qrId}`;
};

// Generate a QR code as a data URL
export const generateQrCodeDataUrl = async (qrId: string): Promise<string> => {
  try {
    const url = generateQrCodeUrl(qrId);
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Download a QR code as a PNG
export const downloadQrCode = async (qrId: string, qrName: string): Promise<void> => {
  try {
    const qrDataUrl = await generateQrCodeDataUrl(qrId);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${qrName.replace(/\s+/g, '_')}_QRCode.png`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

// Print a QR code
export const printQrCode = async (qrId: string, qrName: string, outletName: string): Promise<void> => {
  try {
    const qrDataUrl = await generateQrCodeDataUrl(qrId);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please check your popup blocker settings.');
    }
    
    // Generate the HTML content for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qrName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              display: inline-block;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .qr-image {
              width: 200px;
              height: 200px;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin: 15px 0 5px;
            }
            .qr-subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            }
            .qr-instructions {
              font-size: 12px;
              color: #888;
              margin-top: 10px;
              max-width: 200px;
              margin-left: auto;
              margin-right: auto;
            }
            @media print {
              @page {
                size: auto;
                margin: 10mm;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-image" />
            <div class="qr-title">${outletName}</div>
            <div class="qr-subtitle">${qrName}</div>
            <div class="qr-instructions">
              Scan to review us on Google
            </div>
          </div>
          <script>
            // Auto print once loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing QR code:', error);
    throw error;
  }
};

// Extract QR code ID from URL parameters
export const extractQrIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('qr');
};