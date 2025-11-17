// Copyright 2025 Will Wade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Example demonstrating multi-corpus training and prediction.
 *
 * This example shows how to:
 * - Load multiple domain-specific training corpora
 * - Switch between different corpora based on context
 * - Merge predictions from multiple active corpora
 *
 * Use case: AAC user who needs different vocabularies for different contexts
 * (medical appointments, work, personal conversations)
 */

import { createPredictor } from '../src/index.js';

// Sample training texts for different domains
const medicalText = `
The patient presents with symptoms of fever and cough.
The doctor prescribed antibiotics for the infection.
The nurse will administer the medication.
Please schedule a follow-up appointment.
The diagnosis indicates a respiratory infection.
The treatment plan includes rest and fluids.
The medical history shows previous allergies.
The prescription requires daily dosage.
`;

const workText = `
Please review the quarterly report.
The meeting is scheduled for tomorrow.
I will send the presentation slides.
The project deadline is next week.
The team completed the deliverables.
Please approve the budget proposal.
The client requested additional features.
The development cycle continues smoothly.
`;

const personalText = `
Hello, how are you today?
I would like to meet for coffee.
Thank you for your help yesterday.
I really enjoyed our conversation.
Let's plan something for the weekend.
I hope you have a great day.
I miss spending time with you.
Looking forward to seeing you soon.
`;

console.log('='.repeat(70));
console.log('Multi-Corpus Prediction Example');
console.log('='.repeat(70));
console.log();

// Create predictor
const predictor = createPredictor({
  maxPredictions: 5
});

// Add domain-specific training corpora
console.log('📚 Loading training corpora...');
console.log();

predictor.addTrainingCorpus('medical', medicalText, {
  description: 'Medical terminology and phrases'
});
console.log('✓ Added medical corpus');

predictor.addTrainingCorpus('work', workText, {
  description: 'Work-related vocabulary'
});
console.log('✓ Added work corpus');

predictor.addTrainingCorpus('personal', personalText, {
  description: 'Personal conversation vocabulary'
});
console.log('✓ Added personal corpus');

console.log();

// List all available corpora
console.log('📋 Available corpora:');
const allCorpora = predictor.getCorpora();
allCorpora.forEach(key => {
  const info = predictor.getCorpusInfo(key);
  console.log(`  - ${key}: ${info.description}`);
});

console.log();
console.log('='.repeat(70));
console.log();

// Example 1: Medical context
console.log('🏥 MEDICAL CONTEXT');
console.log('-'.repeat(70));
predictor.useCorpora('medical');
console.log('Active corpora:', predictor.getCorpora(true).join(', '));
console.log();

predictor.resetContext();
predictor.addToContext('The patient');
let predictions = predictor.predictNextCharacter();
console.log('Context: "The patient"');
console.log('Predictions:', predictions.slice(0, 5).map(p =>
  `"${p.text}" (${(p.probability * 100).toFixed(1)}%)`
).join(', '));

console.log();
console.log('='.repeat(70));
console.log();

// Example 2: Work context
console.log('💼 WORK CONTEXT');
console.log('-'.repeat(70));
predictor.useCorpora('work');
console.log('Active corpora:', predictor.getCorpora(true).join(', '));
console.log();

predictor.resetContext();
predictor.addToContext('Please review');
predictions = predictor.predictNextCharacter();
console.log('Context: "Please review"');
console.log('Predictions:', predictions.slice(0, 5).map(p =>
  `"${p.text}" (${(p.probability * 100).toFixed(1)}%)`
).join(', '));

console.log();
console.log('='.repeat(70));
console.log();

// Example 3: Personal context
console.log('👋 PERSONAL CONTEXT');
console.log('-'.repeat(70));
predictor.useCorpora('personal');
console.log('Active corpora:', predictor.getCorpora(true).join(', '));
console.log();

predictor.resetContext();
predictor.addToContext('Hello, how');
predictions = predictor.predictNextCharacter();
console.log('Context: "Hello, how"');
console.log('Predictions:', predictions.slice(0, 5).map(p =>
  `"${p.text}" (${(p.probability * 100).toFixed(1)}%)`
).join(', '));

console.log();
console.log('='.repeat(70));
console.log();

// Example 4: Multiple corpora (medical + personal)
console.log('🏥👋 COMBINED CONTEXT (Medical + Personal)');
console.log('-'.repeat(70));
predictor.useCorpora(['medical', 'personal']);
console.log('Active corpora:', predictor.getCorpora(true).join(', '));
console.log();

predictor.resetContext();
predictor.addToContext('The');
predictions = predictor.predictNextCharacter();
console.log('Context: "The"');
console.log('Predictions (merged from both corpora):');
predictions.slice(0, 5).forEach(p => {
  console.log(`  "${p.text}" - ${(p.probability * 100).toFixed(1)}%`);
});

console.log();
console.log('='.repeat(70));
console.log();

// Example 5: All corpora
console.log('🌍 ALL CONTEXTS (Medical + Work + Personal)');
console.log('-'.repeat(70));
predictor.useAllCorpora();
console.log('Active corpora:', predictor.getCorpora(true).join(', '));
console.log();

predictor.resetContext();
predictor.addToContext('I');
predictions = predictor.predictNextCharacter();
console.log('Context: "I"');
console.log('Predictions (merged from all corpora):');
predictions.slice(0, 5).forEach(p => {
  console.log(`  "${p.text}" - ${(p.probability * 100).toFixed(1)}%`);
});

console.log();
console.log('='.repeat(70));
console.log();

// Example 6: Dynamic context switching
console.log('🔄 DYNAMIC CONTEXT SWITCHING');
console.log('-'.repeat(70));
console.log();

const scenarios = [
  { context: 'At doctor\'s office', corpora: 'medical', input: 'The doctor' },
  { context: 'At work meeting', corpora: 'work', input: 'The meeting' },
  { context: 'Chatting with friend', corpora: 'personal', input: 'I hope' },
  { context: 'General conversation', corpora: ['medical', 'personal', 'work'], input: 'Please' }
];

scenarios.forEach(scenario => {
  console.log(`Scenario: ${scenario.context}`);
  predictor.useCorpora(scenario.corpora);
  predictor.resetContext();
  predictor.addToContext(scenario.input);
  predictions = predictor.predictNextCharacter();
  console.log(`  Input: "${scenario.input}"`);
  console.log(`  Active: ${Array.isArray(scenario.corpora) ? scenario.corpora.join(', ') : scenario.corpora}`);
  console.log(`  Top prediction: "${predictions[0].text}" (${(predictions[0].probability * 100).toFixed(1)}%)`);
  console.log();
});

console.log('='.repeat(70));
console.log();
console.log('✅ Multi-corpus example complete!');
console.log();
console.log('Key takeaways:');
console.log('  • Different corpora provide domain-specific predictions');
console.log('  • Multiple corpora can be combined for broader context');
console.log('  • Context switching enables adaptive AAC communication');
console.log('  • Predictions are merged by averaging probabilities');
console.log();

