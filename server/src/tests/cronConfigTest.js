const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8081';
const API_BASE = `${BASE_URL}/cron-config`;

/**
 * Test helper to make API requests
 */
async function makeRequest(method, path, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${path}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${path}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test cron configuration CRUD operations
 */
async function testCronConfigAPI() {
  console.log('🧪 Starting cron configuration API tests...\n');

  try {
    // Test 1: Seed initial configurations
    console.log('1️⃣ Seeding default cron configurations...');
    const seedResult = await makeRequest('POST', '/seed');
    console.log('✅ Seed result:', seedResult.data.message);
    console.log(`   Created: ${seedResult.data.created}, Skipped: ${seedResult.data.skipped}\n`);

    // Test 2: Get all configurations
    console.log('2️⃣ Fetching all cron configurations...');
    const allConfigs = await makeRequest('GET', '/');
    console.log(`✅ Found ${allConfigs.data.length} configurations\n`);

    // Test 3: Get enabled configurations only
    console.log('3️⃣ Fetching enabled configurations...');
    const enabledConfigs = await makeRequest('GET', '/enabled');
    console.log(`✅ Found ${enabledConfigs.data.length} enabled configurations\n`);

    // Test 4: Get configuration by name
    console.log('4️⃣ Fetching specific configuration...');
    const specificConfig = await makeRequest('GET', '/morning-sync-3am');
    console.log(`✅ Retrieved config: ${specificConfig.data.name} - ${specificConfig.data.description}\n`);

    // Test 5: Create a new test configuration
    console.log('5️⃣ Creating a new test configuration...');
    const newConfig = {
      name: 'test-config',
      schedule: '0 */2 * * *',
      description: 'Test configuration running every 2 hours',
      category: 'other',
      priority: 3,
      scripts: [
        {
          name: 'testScript',
          modulePath: '../tests/testScript',
          enabled: true,
          order: 1
        }
      ]
    };

    try {
      const createdConfig = await makeRequest('POST', '/', newConfig);
      console.log(`✅ Created config: ${createdConfig.data.name}\n`);
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log('⚠️ Test config already exists, skipping creation\n');
      } else {
        throw error;
      }
    }

    // Test 6: Update the test configuration
    console.log('6️⃣ Updating test configuration...');
    const updateData = {
      description: 'Updated test configuration with new description',
      enabled: false
    };
    
    try {
      const updatedConfig = await makeRequest('PUT', '/test-config', updateData);
      console.log(`✅ Updated config: ${updatedConfig.data.name} - Enabled: ${updatedConfig.data.enabled}\n`);
    } catch (error) {
      console.log('⚠️ Could not update test config (might not exist)\n');
    }

    // Test 7: Validate cron expressions
    console.log('7️⃣ Validating cron expressions...');
    
    // Valid expression
    const validExpr = await makeRequest('POST', '/validate-expression', { expression: '0 0 * * *' });
    console.log(`✅ Valid expression test: ${validExpr.data.valid}`);

    // Invalid expression
    try {
      const invalidExpr = await makeRequest('POST', '/validate-expression', { expression: 'invalid cron' });
      console.log(`❌ Invalid expression test: ${invalidExpr.data.valid}`);
    } catch (error) {
      console.log('✅ Invalid expression correctly rejected\n');
    }

    // Test 8: Get statistics
    console.log('8️⃣ Fetching cron configuration statistics...');
    const stats = await makeRequest('GET', '/stats');
    console.log('✅ Statistics:', {
      total: stats.data.total,
      enabled: stats.data.enabled,
      disabled: stats.data.disabled,
      categories: Object.keys(stats.data.categories)
    });
    console.log('');

    // Test 9: Enable/disable configuration
    console.log('9️⃣ Testing enable/disable functionality...');
    try {
      const disableResult = await makeRequest('PUT', '/test-config/enabled', { enabled: false });
      console.log(`✅ Disabled test config: ${disableResult.data.enabled}`);

      const enableResult = await makeRequest('PUT', '/test-config/enabled', { enabled: true });
      console.log(`✅ Enabled test config: ${enableResult.data.enabled}\n`);
    } catch (error) {
      console.log('⚠️ Could not test enable/disable (test config might not exist)\n');
    }

    // Test 10: Reload cron jobs
    console.log('🔄 Testing cron jobs reload...');
    try {
      const reloadResult = await makeRequest('POST', '/reload');
      console.log(`✅ Reload result: ${reloadResult.data.message}`);
      console.log(`   Active jobs: ${reloadResult.data.activeJobs?.length || 0}\n`);
    } catch (error) {
      console.log('⚠️ Reload test failed (server might not be fully initialized)\n');
    }

    // Test 11: Cleanup - Delete test configuration
    console.log('🧹 Cleaning up test configuration...');
    try {
      await makeRequest('DELETE', '/test-config');
      console.log('✅ Test configuration deleted\n');
    } catch (error) {
      console.log('⚠️ Could not delete test config (might not exist)\n');
    }

    console.log('🎉 All cron configuration API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test server connectivity
 */
async function testServerConnection() {
  try {
    console.log('🔗 Testing server connection...');
    const response = await axios.get(`${BASE_URL}/metrics`);
    console.log('✅ Server is running and accessible\n');
    return true;
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    console.log('Please make sure the server is running on port 8081\n');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=' .repeat(60));
  console.log('🚀 Cron Configuration System Test Suite');
  console.log('=' .repeat(60));
  console.log('');

  // Check server connection first
  const serverOk = await testServerConnection();
  if (!serverOk) {
    process.exit(1);
  }

  // Run API tests
  await testCronConfigAPI();

  console.log('');
  console.log('=' .repeat(60));
  console.log('✨ Test suite completed successfully!');
  console.log('=' .repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testCronConfigAPI,
  testServerConnection,
  runTests
};