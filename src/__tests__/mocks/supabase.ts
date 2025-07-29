import { describe, it } from '@jest/globals';

// This is just a dummy test to make sure the file is recognized as a test file
describe('Supabase mock', () => {
  it('should have at least one test', () => {
    expect(true).toBe(true);
  });
});

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(callback => Promise.resolve(callback({ data: null, error: null }))),
  }),
  rpc: jest.fn().mockImplementation(() => ({
    then: jest.fn().mockImplementation(callback => Promise.resolve(callback({ data: null, error: null }))),
  })),
};

// Mock createClient function that returns the mock client
export const mockCreateClient = jest.fn().mockReturnValue(mockSupabaseClient);

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}));

export default mockSupabaseClient;