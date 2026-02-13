/**
 * KisanMind Orchestrator - Entry Point
 *
 * This is the main entry point for the orchestration system.
 * All agents report to the orchestrator, which reports progress to you.
 *
 * Usage:
 *   import { createOrchestrator } from './orchestrator/index.js';
 *   const orchestrator = createOrchestrator();
 *   const report = await orchestrator.process("I am a farmer from Vidarbha...");
 */
import dotenv from 'dotenv';
import { Orchestrator, type ProgressCallback, type PipelineResult, type PipelineOptions } from './orchestrator.js';
import type { OrchestratorConfig, FarmingDecisionReport } from './types.js';

// Load environment variables
dotenv.config();

/**
 * Create orchestrator with default configuration.
 * Reads ANTHROPIC_API_KEY from environment.
 */
export function createOrchestrator(progressCallback?: ProgressCallback): Orchestrator {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required. ' +
      'Set it in your .env file or environment.'
    );
  }

  const config: OrchestratorConfig = {
    anthropicApiKey: apiKey,
    mcpServerTimeout_ms: 30000, // 30 second timeout per MCP server
    intakeModel: 'claude-haiku-4-5-20251001', // Fast intake parsing
    synthesisModel: 'claude-opus-4-6', // Extended thinking for synthesis
    extendedThinkingBudget: 10000, // 10k tokens for deep reasoning
    maxRetries: 2,
  };

  return new Orchestrator(config, progressCallback);
}

/**
 * Console progress reporter (default for CLI usage)
 */
const consoleProgressCallback: ProgressCallback = (stage, message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Stage: ${stage}`);
  console.log(`   ${message}`);
  if (data && process.env.VERBOSE === 'true') {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
};

/**
 * Main execution function - runs the full pipeline with the demo test case
 */
async function main() {
  console.log('========================================================');
  console.log('           KisanMind Orchestrator                       ');
  console.log('  AI-Powered Agricultural Intelligence System           ');
  console.log('========================================================\n');

  // Create orchestrator with progress reporting
  const orchestrator = createOrchestrator(consoleProgressCallback);

  // Test farmer input (Vidarbha region, Maharashtra)
  // This is the demo test case from the project requirements
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
    const reportPath = './orchestrator/output-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);
  } catch (error) {
    console.error('\nPipeline failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Public API exports
export { Orchestrator };
export type { ProgressCallback, PipelineResult, PipelineOptions, OrchestratorConfig, FarmingDecisionReport };
export type { VisualIntelligence, AggregatedIntelligence } from './types.js';
