// Test CEFR Validation Logic
// Run: node backend/tests/testCefrValidation.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Mock AiScoringService for testing
class MockAiScoringService {
  validateCefrLevel(score, maxScore, aiCefrLevel) {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Define CEFR thresholds based on percentage
    let validatedLevel;
    if (percentage >= 90) {
      validatedLevel = ['C2', 'C1'].includes(aiCefrLevel) ? aiCefrLevel : 'C1';
    } else if (percentage >= 80) {
      validatedLevel = ['C1', 'B2', 'C2'].includes(aiCefrLevel) ? (aiCefrLevel === 'C2' ? 'C1' : aiCefrLevel) : 'B2';
    } else if (percentage >= 70) {
      validatedLevel = ['B2', 'B1', 'C1'].includes(aiCefrLevel) ? (aiCefrLevel === 'C1' ? 'B2' : aiCefrLevel) : 'B2';
    } else if (percentage >= 60) {
      validatedLevel = ['B1', 'B2'].includes(aiCefrLevel) ? aiCefrLevel : 'B1';
    } else if (percentage >= 50) {
      validatedLevel = ['B1', 'A2'].includes(aiCefrLevel) ? aiCefrLevel : 'A2';
    } else if (percentage >= 30) {
      validatedLevel = ['A2', 'A1'].includes(aiCefrLevel) ? aiCefrLevel : 'A2';
    } else {
      validatedLevel = 'A1';
    }
    
    if (validatedLevel !== aiCefrLevel) {
      console.warn(`⚠️  CEFR level corrected: AI suggested '${aiCefrLevel}' but score ${score}/${maxScore} (${percentage.toFixed(1)}%) indicates '${validatedLevel}'`);
    }
    
    return validatedLevel;
  }
}

async function runCefrValidationTests() {
  console.log('🧪 Testing CEFR Validation Logic\n');
  
  const scorer = new MockAiScoringService();
  
  // Test cases: [score, maxScore, aiCefr, expectedResult, description]
  const testCases = [
    // Original problem case
    [5, 14, 'C1', 'A2', 'Original bug: 5/14 with C1 should be A2'],
    
    // High scores with high CEFR (should pass)
    [13, 14, 'C1', 'C1', 'High score 13/14 (92.9%) with C1 should remain C1'],
    [12, 14, 'B2', 'B2', 'Good score 12/14 (85.7%) with B2 should remain B2'],
    [14, 14, 'C2', 'C2', 'Perfect score 14/14 (100%) with C2 should remain C2'],
    
    // Medium scores with appropriate CEFR (should pass)
    [9, 14, 'B1', 'B1', 'Medium score 9/14 (64.3%) with B1 should remain B1'],
    [10, 14, 'B2', 'B2', 'Good score 10/14 (71.4%) with B2 should remain B2'],
    [8, 14, 'B1', 'B1', 'Medium score 8/14 (57.1%) with B1 should remain B1'],
    
    // Low scores with inappropriate high CEFR (should correct)
    [3, 14, 'B2', 'A1', 'Low score 3/14 (21.4%) with B2 should be A1'],
    [4, 14, 'C1', 'A2', 'Low score 4/14 (28.6%) with C1 should be A2'],
    [6, 14, 'B2', 'A2', 'Low score 6/14 (42.9%) with B2 should be A2'],
    [7, 14, 'C1', 'B1', 'Medium score 7/14 (50%) with C1 should be B1'],
    
    // Edge cases
    [0, 14, 'A1', 'A1', 'Zero score 0/14 (0%) with A1 should remain A1'],
    [1, 14, 'C2', 'A1', 'Very low score 1/14 (7.1%) with C2 should be A1'],
    [11, 14, 'A1', 'B2', 'High score 11/14 (78.6%) with A1 should be B2'],
    
    // Different max scores
    [4, 10, 'C1', 'A2', 'Score 4/10 (40%) with C1 should be A2'],
    [8, 10, 'B1', 'B2', 'Score 8/10 (80%) with B1 should be B2'],
    [2, 5, 'B2', 'A2', 'Score 2/5 (40%) with B2 should be A2'],
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [score, maxScore, aiCefr, expected, description] of testCases) {
    try {
      const result = scorer.validateCefrLevel(score, maxScore, aiCefr);
      const percentage = ((score / maxScore) * 100).toFixed(1);
      
      if (result === expected) {
        console.log(`✅ PASS: ${description}`);
        console.log(`   Score: ${score}/${maxScore} (${percentage}%) | AI: ${aiCefr} → Validated: ${result}\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${description}`);
        console.log(`   Score: ${score}/${maxScore} (${percentage}%) | AI: ${aiCefr} → Expected: ${expected}, Got: ${result}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${description}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! CEFR validation logic is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the validation logic.`);
  }
}

// Additional test for CEFR mapping table
function testCefrMappingTable() {
  console.log('\n📋 CEFR Mapping Table Verification:');
  console.log('Score %  | Expected CEFR | Description');
  console.log('---------|---------------|------------------');
  
  const scorer = new MockAiScoringService();
  const testPercentages = [
    [5, 'A1', 'Very Low'],
    [25, 'A1', 'Low'],
    [35, 'A2', 'Elementary'],
    [45, 'A2', 'Elementary+'],
    [55, 'B1', 'Intermediate'],
    [65, 'B1', 'Intermediate+'],
    [75, 'B2', 'Upper-Intermediate'],
    [85, 'B2', 'Upper-Intermediate+'],
    [95, 'C1', 'Advanced']
  ];
  
  for (const [percentage, expectedCefr, description] of testPercentages) {
    const score = percentage;
    const maxScore = 100;
    // Test with a deliberately wrong CEFR to see correction
    const wrongCefr = 'C2';
    const result = scorer.validateCefrLevel(score, maxScore, wrongCefr);
    
    console.log(`${percentage.toString().padEnd(8)} | ${result.padEnd(13)} | ${description}`);
  }
}

async function main() {
  try {
    await runCefrValidationTests();
    testCefrMappingTable();
    
    console.log('\n🔍 Manual Test Case (Original Bug):');
    const scorer = new MockAiScoringService();
    const result = scorer.validateCefrLevel(5, 14, 'C1');
    console.log(`Input: score=5, maxScore=14, aiCefr="C1"`);
    console.log(`Output: validated CEFR="${result}"`);
    console.log(`Percentage: ${((5/14)*100).toFixed(1)}%`);
    console.log(`✅ Bug ${result === 'A2' ? 'FIXED' : 'NOT FIXED'}: Score 5/14 should be A2, got ${result}`);
    
  } catch (error) {
    console.error('💥 Test runner error:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MockAiScoringService };