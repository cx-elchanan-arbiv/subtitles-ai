/**
 * Smoke Test: API Metadata Endpoints
 *
 * Verifies that all metadata endpoints return valid data.
 * These endpoints provide configuration options for the frontend.
 *
 * Expected duration: ~5-10 seconds
 */

import { test, expect } from '@playwright/test';

test.describe('API Metadata Endpoints', () => {
  const apiUrl = process.env.API_BASE_URL || 'https://api.subs.sayai.io';

  test('GET /languages returns supported languages', async ({ request }) => {
    console.log('🔍 Testing /languages endpoint...');

    const response = await request.get(`${apiUrl}/languages`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Languages count: ${Object.keys(data).length}`);

    // Verify response is an object with language codes
    expect(typeof data).toBe('object');
    expect(Object.keys(data).length).toBeGreaterThan(0);

    // Check for expected languages
    const languageCodes = Object.keys(data);
    console.log(`   Sample languages: ${languageCodes.slice(0, 5).join(', ')}`);

    // Should have common languages like 'en', 'he', etc.
    expect(languageCodes.length).toBeGreaterThanOrEqual(5);

    console.log('   ✅ Languages endpoint OK');
  });

  test('GET /translation-services returns available services', async ({ request }) => {
    console.log('🔍 Testing /translation-services endpoint...');

    const response = await request.get(`${apiUrl}/translation-services`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Translation services:`, data);

    // Verify response is an object with service information
    expect(typeof data).toBe('object');
    expect(Object.keys(data).length).toBeGreaterThan(0);

    // Should have services like 'openai', 'google', etc.
    const services = Object.keys(data);
    console.log(`   Available services: ${services.join(', ')}`);
    expect(services.length).toBeGreaterThanOrEqual(1);

    console.log('   ✅ Translation services endpoint OK');
  });

  test('GET /whisper-models returns available models', async ({ request }) => {
    console.log('🔍 Testing /whisper-models endpoint...');

    const response = await request.get(`${apiUrl}/whisper-models`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Whisper models:`, data);

    // Verify response is an object with model information
    expect(typeof data).toBe('object');
    expect(Object.keys(data).length).toBeGreaterThan(0);

    // Should have models like 'tiny', 'base', 'medium', 'large'
    const models = Object.keys(data);
    console.log(`   Available models: ${models.join(', ')}`);
    expect(models.length).toBeGreaterThanOrEqual(2);

    console.log('   ✅ Whisper models endpoint OK');
  });

  test('GET /ping endpoint responds', async ({ request }) => {
    console.log('🔍 Testing /ping endpoint...');

    const response = await request.get(`${apiUrl}/ping`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Ping returns plain text "pong", not JSON
    const text = await response.text();
    console.log(`   Ping response: "${text}"`);

    // Verify ping response
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(0);

    console.log('   ✅ Ping endpoint OK');
  });

  test('GET /healthz endpoint responds (alias for /health)', async ({ request }) => {
    console.log('🔍 Testing /healthz endpoint...');

    const response = await request.get(`${apiUrl}/healthz`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Healthz response:`, data);

    // Should be same as /health
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');

    console.log('   ✅ Healthz endpoint OK');
  });

  test('GET /status with invalid task_id returns appropriate response', async ({ request }) => {
    console.log('🔍 Testing /status/<task_id> with invalid ID...');

    const fakeTaskId = 'nonexistent-task-id-12345';
    const response = await request.get(`${apiUrl}/status/${fakeTaskId}`);

    console.log(`   Status: ${response.status()}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Status response:`, data);

    // For nonexistent tasks, backend returns PENDING state
    expect(data).toHaveProperty('task_id');
    expect(data.task_id).toBe(fakeTaskId);
    expect(data).toHaveProperty('state');
    expect(data.state).toBe('PENDING');

    console.log('   ✅ Status endpoint returns valid structure');
  });
});
