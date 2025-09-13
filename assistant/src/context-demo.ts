/**
 * Context Demo
 * 
 * This demo shows how the new context initialization system works.
 * It demonstrates fetching graph context and rendering templates.
 */

import { templateEngine } from './template';
import { generateInitialContext, generateMinimalContext, refreshContext } from './prompts';

async function runContextDemo() {
  console.log('🧪 Context System Demo\n');

  try {
    // Test 1: Fetch raw graph context
    console.log('1. Fetching raw graph context...');
    const graphContext = await templateEngine.fetchGraphContext();
    console.log('Graph Context:', JSON.stringify(graphContext, null, 2));
    console.log('');

    // Test 2: Generate full initial context
    console.log('2. Generating full initial context...');
    const fullContext = await generateInitialContext();
    console.log('Full Context:');
    console.log(fullContext);
    console.log('');

    // Test 3: Generate minimal context
    console.log('3. Generating minimal context...');
    const minimalContext = await generateMinimalContext();
    console.log('Minimal Context:');
    console.log(minimalContext);
    console.log('');

    // Test 4: Refresh context
    console.log('4. Refreshing context...');
    const refreshedContext = await refreshContext();
    console.log('Refreshed Context:');
    console.log(refreshedContext);
    console.log('');

    console.log('✅ Context system demo completed successfully!');

  } catch (error) {
    console.error('❌ Error in context demo:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runContextDemo();
}

export { runContextDemo };
