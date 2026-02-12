/**
 * Simple test runner for KisanMind orchestrator
 */
import { createOrchestrator } from './dist/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const consoleProgressCallback = (stage, message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Stage: ${stage}`);
  console.log(`   ${message}`);
  if (data && process.env.VERBOSE === 'true') {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
};

async function main() {
  console.log('========================================================');
  console.log('           KisanMind Orchestrator Test                  ');
  console.log('  AI-Powered Agricultural Intelligence System           ');
  console.log('========================================================\n');

  // Create orchestrator with progress reporting
  const orchestrator = createOrchestrator(consoleProgressCallback);

  // Test farmer input (Vidarbha region, Maharashtra)
  const testInput = `
    I am a farmer from Vidarbha region, Maharashtra.
    I have 3 acres of land with borewell water.
    Last year I planted cotton but it failed due to drought.
    I want to plant something profitable this season.
    My budget is around 50,000 rupees.
  `;

  console.log('Processing farmer input...\n');
  console.log('Input:', testInput.trim());
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    // Run the full pipeline with metadata
    const result = await orchestrator.processWithMeta(testInput);
    const report = result.report;

    // Display final report
    console.log('\n' + '='.repeat(60));
    console.log('FINAL FARMING DECISION REPORT');
    console.log('='.repeat(60) + '\n');

    console.log('Summary:', report.summary);
    console.log('\nPrimary Recommendation:');
    console.log(`   Crop: ${report.primaryRecommendation.crop} (${report.primaryRecommendation.variety})`);
    console.log(`   Expected Profit: INR ${report.primaryRecommendation.expectedProfit_per_acre}/acre`);
    console.log(`   Sowing Date: ${report.primaryRecommendation.sowingDate}`);
    console.log(`   Confidence: ${report.primaryRecommendation.confidence}`);

    if (report.alternativeOptions && report.alternativeOptions.length > 0) {
      console.log('\nAlternative Options:');
      report.alternativeOptions.forEach(alt => {
        console.log(`   - ${alt.crop}: INR ${alt.expectedProfit_per_acre}/acre (${alt.reason})`);
      });
    }

    console.log('\nGovernment Support:');
    report.governmentSupport.schemesToApply.forEach(scheme => {
      console.log(`   - ${scheme.name}: ${scheme.benefit}`);
    });
    console.log(`   Total Benefit: ${report.governmentSupport.totalBenefit}`);

    console.log('\nRisk Assessment:');
    report.riskAssessment.forEach(risk => {
      console.log(`   - [${risk.severity}] ${risk.risk}`);
      console.log(`     Mitigation: ${risk.mitigation}`);
    });

    console.log('\nMonthly Action Plan:');
    report.monthlyActionPlan.forEach(month => {
      console.log(`   ${month.month}:`);
      month.actions.forEach(action => console.log(`      - ${action}`));
    });

    console.log('\nPipeline Timing:');
    console.log(`   Intake: ${result.meta.intakeTime_ms}ms`);
    console.log(`   MCP Servers: ${result.meta.mcpTime_ms}ms (${result.meta.mcpSuccessCount}/5 succeeded)`);
    console.log(`   Synthesis: ${result.meta.synthesisTime_ms}ms`);
    console.log(`   Total: ${result.meta.totalTime_ms}ms`);

    console.log('\n' + '='.repeat(60));
    console.log('Pipeline completed successfully!');
    console.log('='.repeat(60) + '\n');

    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = './output-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);
  } catch (error) {
    console.error('\nPipeline failed:', error);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);
