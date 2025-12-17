/**
 * Test utilities for Facebook Conversions API server events
 */

import { trackRegistrationServerEvent, trackRegistrationStartServerEvent, trackEnhancedRegistrationServerEvent } from './facebookServerEvents';

const TEST_EVENT_CODE = 'TEST6827';

/**
 * Test registration start event
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function testRegistrationStartEvent(): Promise<boolean> {
  console.log('🧪 Testing Facebook server event: Registration Start');
  
  return await trackRegistrationStartServerEvent(
    {
      phone: '555123456' // Test phone number
    },
    TEST_EVENT_CODE
  );
}

/**
 * Test registration complete event
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function testRegistrationCompleteEvent(): Promise<boolean> {
  console.log('🧪 Testing Facebook server event: Registration Complete');
  
  return await trackRegistrationServerEvent(
    {
      phone: '555123456', // Test phone number
      firstName: 'Test',
      lastName: 'User'
    },
    TEST_EVENT_CODE
  );
}

/**
 * Test enhanced registration complete event with all tracking parameters
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function testEnhancedRegistrationCompleteEvent(): Promise<boolean> {
  console.log('🧪 Testing Enhanced Facebook server event: Registration Complete');
  
  return await trackEnhancedRegistrationServerEvent(
    {
      email: 'test@example.com',
      phone: '555123456',
      firstName: 'Test',
      lastName: 'User',
      clickId: 'fb.1.1234567890.1234567890',
      browserId: 'fb.1.1234567890.1234567890',
      externalId: 'ext_test_user_123',
      facebookLoginId: 'fb_login_123456'
    },
    TEST_EVENT_CODE
  );
}

/**
 * Run all Facebook server event tests
 * @returns Promise<boolean> - True if all tests successful, false otherwise
 */
export async function runAllFacebookEventTests(): Promise<boolean> {
  console.log('🚀 Starting Facebook Conversions API tests...');
  
  try {
    // Test registration start
    const startResult = await testRegistrationStartEvent();
    console.log('Registration Start Test:', startResult ? '✅ PASSED' : '❌ FAILED');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test registration complete
    const completeResult = await testRegistrationCompleteEvent();
    console.log('Registration Complete Test:', completeResult ? '✅ PASSED' : '❌ FAILED');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test enhanced registration complete
    const enhancedResult = await testEnhancedRegistrationCompleteEvent();
    console.log('Enhanced Registration Complete Test:', enhancedResult ? '✅ PASSED' : '❌ FAILED');
    
    const allPassed = startResult && completeResult && enhancedResult;
    console.log('🎯 All Tests:', allPassed ? '✅ PASSED' : '❌ FAILED');
    
    return allPassed;
  } catch (error) {
    console.error('❌ Test Error:', error);
    return false;
  }
}

// Make functions available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as unknown as { testFacebookEvents: unknown }).testFacebookEvents = {
    testRegistrationStartEvent,
    testRegistrationCompleteEvent,
    testEnhancedRegistrationCompleteEvent,
    runAllFacebookEventTests
  };
}
