// Import fingerprintjs (Note: we're using the older version as per installation)
import Fingerprint2 from 'fingerprintjs';

// Function to generate a device fingerprint
export const getDeviceFingerprint = async (): Promise<string> => {
  // Return a promise that resolves with the fingerprint
  return new Promise((resolve) => {
    // Wait for page to fully load
    if (window.requestIdleCallback) {
      requestIdleCallback(() => {
        generateFingerprint().then(resolve);
      });
    } else {
      // Fallback for browsers not supporting requestIdleCallback
      setTimeout(() => {
        generateFingerprint().then(resolve);
      }, 500);
    }
  });
};

// Helper function to actually generate the fingerprint
const generateFingerprint = async (): Promise<string> => {
  // Create new fingerprint instance
  const fp = new Fingerprint2();
  
  return new Promise((resolve) => {
    // Get components and generate hash
    fp.get((result: string) => {
      resolve(result);
    });
  });
};

// Check rate limits using the edge function
export const checkRateLimit = async (
  deviceFingerprint: string,
  outletId: string,
  qrCodeId: string | null,
  actionType: 'qr_scan' | 'review_session' | 'incentive_claim'
): Promise<{ 
  allowed: boolean;
  message: string;
  count: number;
  maxCount: number;
  resetAfter: number;
}> => {
  try {
    const response = await fetch(
      'https://puldndhrobcaeogmjfij.supabase.co/functions/v1/app_363c640910_check_rate_limits',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceFingerprint,
          outletId,
          qrCodeId,
          actionType
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Rate limit check failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Default response assuming rate limit is exceeded
    return {
      allowed: false,
      message: 'Error checking rate limits, please try again later',
      count: 0,
      maxCount: 0,
      resetAfter: 24
    };
  }
};