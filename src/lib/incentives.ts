import { FUNCTIONS } from './supabase';

// Interface for incentive
export interface Incentive {
  id: string;
  name: string;
  description: string;
  type: 'voucher' | 'discount' | 'points' | 'lucky_draw' | 'free_item';
  value?: number;
  code_prefix?: string;
  expires_at?: string;
  active: boolean;
  min_rating?: number;
  min_review_length?: number;
  max_per_user?: number;
  redemption_instructions?: string;
  merchant_id: string;
  created_at: string;
  updated_at: string;
  issued_count?: number;
}

// Interface for issued reward
export interface IssuedReward {
  id: string;
  user_id: string;
  incentive_id: string;
  merchant_id: string;
  review_session_id?: string;
  code: string;
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED';
  issued_at: string;
  redeemed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Interface for incentive statistics
export interface IncentiveStats {
  issued: number;
  redeemed: number;
  expired: number;
  active: number;
  dailyIssuance: { date: string; count: number }[];
}

/**
 * Get all incentives for a merchant
 */
export const getIncentives = async (merchantId: string, activeOnly?: boolean): Promise<Incentive[]> => {
  try {
    let url = `${FUNCTIONS.MANAGE_INCENTIVES}?merchantId=${merchantId}`;
    if (activeOnly !== undefined) {
      url += `&active=${activeOnly}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error retrieving incentives: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.incentives;
  } catch (error) {
    console.error('Error in getIncentives:', error);
    throw error;
  }
};

/**
 * Get a single incentive by ID
 */
export const getIncentive = async (id: string): Promise<Incentive> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error retrieving incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.incentive;
  } catch (error) {
    console.error('Error in getIncentive:', error);
    throw error;
  }
};

/**
 * Create a new incentive
 */
export const createIncentive = async (incentiveData: Partial<Incentive>): Promise<Incentive> => {
  try {
    const response = await fetch(FUNCTIONS.MANAGE_INCENTIVES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incentiveData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error creating incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.incentive;
  } catch (error) {
    console.error('Error in createIncentive:', error);
    throw error;
  }
};

/**
 * Update an existing incentive
 */
export const updateIncentive = async (id: string, incentiveData: Partial<Incentive>): Promise<Incentive> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incentiveData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error updating incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.incentive;
  } catch (error) {
    console.error('Error in updateIncentive:', error);
    throw error;
  }
};

/**
 * Delete an incentive
 */
export const deleteIncentive = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error deleting incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error in deleteIncentive:', error);
    throw error;
  }
};

/**
 * Get statistics for an incentive
 */
export const getIncentiveStats = async (id: string): Promise<IncentiveStats> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/${id}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error retrieving incentive stats: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Error in getIncentiveStats:', error);
    throw error;
  }
};

/**
 * Issue an incentive to a user manually
 */
export const issueIncentive = async (
  incentiveId: string, 
  recipientEmail: string, 
  customCode?: string, 
  expiresAt?: string
): Promise<IssuedReward> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incentiveId,
        recipientEmail,
        customCode,
        expiresAt
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error issuing incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.reward;
  } catch (error) {
    console.error('Error in issueIncentive:', error);
    throw error;
  }
};

/**
 * Redeem an incentive
 */
export const redeemIncentive = async (code: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await fetch(`${FUNCTIONS.MANAGE_INCENTIVES}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error redeeming incentive: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in redeemIncentive:', error);
    throw error;
  }
};