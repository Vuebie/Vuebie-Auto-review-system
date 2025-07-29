import { FUNCTIONS } from './supabase';
import { ReviewSession } from './supabase';

// Interface for AI review generation response
export interface GenerateReviewResponse {
  review: string;
  alternatives: string[];
  language: string;
  rating: number;
  merchant_id: string;
  outlet_id: string;
  outlet_name: string;
}

// Interface for QR code information
export interface QRCodeInfo {
  id: string;
  code: string;
  merchantId: string;
  merchantName: string;
  outletId: string;
  outletName: string;
  outletCity: string;
  outletCountry: string;
  incentiveId?: string;
  incentiveDescription?: string;
}

// Interface for review submission data
export interface ReviewSubmissionData {
  qrCodeId: string;
  merchantId: string;
  outletId: string;
  rating: number;
  comment: string;
  userId?: string;
  deviceFingerprint?: string;
}

/**
 * Get QR code information by code
 */
export const getQRCodeInfo = async (code: string): Promise<QRCodeInfo> => {
  try {
    const response = await fetch(FUNCTIONS.GET_QR_CODE_INFO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error retrieving QR code info: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getQRCodeInfo:', error);
    throw error;
  }
};

/**
 * Submit a review for a merchant outlet
 */
export const submitReview = async (data: ReviewSubmissionData): Promise<void> => {
  try {
    const response = await fetch(FUNCTIONS.SUBMIT_REVIEW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error submitting review: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return;
  } catch (error) {
    console.error('Error in submitReview:', error);
    throw error;
  }
};

// Interface for review session with incentive information
export interface ReviewSessionWithIncentive {
  session: ReviewSession;
  incentive?: {
    id: string;
    name: string;
    description?: string;
    type: 'voucher' | 'points' | 'lucky_draw';
    value?: number;
    code: string;
    expires_at?: string;
  };
}

/**
 * Generate an AI review suggestion
 */
export const generateReview = async (
  qrCodeId: string,
  rating: number = 5,
  language: string = 'en',
  customPrompt?: string
): Promise<GenerateReviewResponse> => {
  try {
    const response = await fetch(FUNCTIONS.GENERATE_REVIEW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrCodeId,
        rating,
        language,
        customPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error generating review: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in generateReview:', error);
    throw error;
  }
};

/**
 * Create a new review session
 */
export const createReviewSession = async (
  qrCodeId: string,
  outletId: string,
  merchantId: string,
  deviceFingerprint: string,
  sessionLanguage: string,
  reviewText?: string
): Promise<ReviewSession> => {
  try {
    const response = await fetch(FUNCTIONS.PROCESS_REVIEW_SESSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrCodeId,
        outletId,
        merchantId,
        deviceFingerprint,
        sessionLanguage,
        reviewText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error creating review session: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.session;
  } catch (error) {
    console.error('Error in createReviewSession:', error);
    throw error;
  }
};

/**
 * Update a review session and claim incentive if requested
 */
export const updateReviewSession = async (
  sessionId: string,
  qrCodeId: string,
  outletId: string,
  merchantId: string,
  deviceFingerprint: string,
  sessionLanguage: string,
  reviewText?: string,
  reviewPosted?: boolean,
  requestIncentive?: boolean
): Promise<ReviewSessionWithIncentive> => {
  try {
    const response = await fetch(FUNCTIONS.PROCESS_REVIEW_SESSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        qrCodeId,
        outletId,
        merchantId,
        deviceFingerprint,
        sessionLanguage,
        reviewText,
        reviewPosted,
        requestIncentive,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error updating review session: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateReviewSession:', error);
    throw error;
  }
};

/**
 * Check rate limits for various actions
 */
export const checkRateLimits = async (
  deviceFingerprint: string,
  outletId: string,
  actionType: 'qr_scan' | 'review_session' | 'incentive_claim',
  qrCodeId?: string
): Promise<{
  allowed: boolean;
  message: string;
  count: number;
  maxCount: number;
  resetAfter: number;
}> => {
  try {
    const response = await fetch(FUNCTIONS.CHECK_RATE_LIMITS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceFingerprint,
        outletId,
        qrCodeId,
        actionType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error checking rate limits: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in checkRateLimits:', error);
    throw {
      allowed: false,
      message: 'Error checking rate limits, please try again later',
      count: 0,
      maxCount: 0,
      resetAfter: 24,
    };
  }
};