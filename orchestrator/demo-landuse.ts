/**
 * Demo script to showcase land-use validation functionality
 *
 * Run with: npx ts-node orchestrator/demo-landuse.ts
 */
import { IntakeAgent } from './intake-agent.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_INPUTS = [
  {
    description: 'Agricultural region (Vidarbha)',
    input: 'I am a farmer from Vidarbha, Maharashtra. I have 5 acres with borewell water. Last year I grew cotton but it failed.',
  },
  {
    description: 'Agricultural region (Punjab)',
    input: 'Punjab farmer here, 10 acres, canal irrigation, growing wheat and rice',
  },
  {
    description: 'Urban area (Mumbai)',
    input: 'I live in Mumbai, Andheri. I have a small plot near my building.',
  },
  {
    description: 'Urban area (Delhi)',
    input: 'Delhi में रहता हूं, 2 एकड़ जमीन है घर के पास',
  },
  {
    description: 'Desert region (Rajasthan)',
    input: 'Jaisalmer district farmer, Rajasthan, 3 acres, well water available',
  },
  {
    description: 'Coastal region (Kerala)',
    input: 'Farmer from Kochi, Kerala, near coast, 4 acres, growing coconut and paddy',
  },
  {
    description: 'Out of India (should warn)',
    input: 'I am in New York City, want to start farming',
  },
];

async function runDemo() {
  console.log('='.repeat(80));
  console.log('KisanMind - Land Use Validation Demo');
  console.log('='.repeat(80));
  console.log('');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in .env file');
    process.exit(1);
  }

  const agent = new IntakeAgent(apiKey);

  for (const demo of DEMO_INPUTS) {
    console.log('\n' + '─'.repeat(80));
    console.log(`📍 Testing: ${demo.description}`);
    console.log('─'.repeat(80));
    console.log(`Input: "${demo.input}"\n`);

    try {
      const profile = await agent.parseInput(demo.input);

      console.log('✅ Profile Created:');
      console.log(`   Location: ${profile.location.state}, ${profile.location.district}`);
      console.log(`   Coordinates: ${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}`);
      console.log(`   Land: ${profile.landSize.acres} acres`);
      console.log(`   Water: ${profile.waterSource}`);
      console.log(`   Confidence: ${(profile.confidence * 100).toFixed(0)}%`);

      if (profile.landUseValidation) {
        console.log('\n🌍 Land Use Validation:');
        console.log(`   Agricultural: ${profile.landUseValidation.isAgricultural ? '✓ Yes' : '✗ No'}`);
        console.log(`   Land Type: ${profile.landUseValidation.landCoverType}`);
        console.log(`   Confidence: ${profile.landUseValidation.confidence}`);
        console.log(`   Source: ${profile.landUseValidation.source}`);

        if (profile.landUseValidation.warning) {
          console.log(`\n   ⚠️  WARNING: ${profile.landUseValidation.warning}`);
        } else {
          console.log('\n   ✓ No warnings - suitable for agriculture');
        }
      } else {
        console.log('\n⚠️  Land use validation unavailable (proceeding anyway)');
      }

      console.log('\n💡 System Behavior:');
      if (profile.landUseValidation?.isAgricultural === false) {
        console.log('   - Warning will be included in final report');
        console.log('   - Analysis will still proceed');
        console.log('   - Recommendations will include verification advice');
      } else {
        console.log('   - Standard agricultural analysis');
        console.log('   - All 5 intelligence agents will run');
        console.log('   - Full recommendations generated');
      }
    } catch (error) {
      console.error(`❌ Error processing input: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('Demo Complete');
  console.log('='.repeat(80));
  console.log('\nKey Takeaways:');
  console.log('✓ Land use validation is non-blocking');
  console.log('✓ Warnings are provided for non-agricultural areas');
  console.log('✓ System proceeds with analysis regardless of land type');
  console.log('✓ Farmers get actionable information even in edge cases');
  console.log('');
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
