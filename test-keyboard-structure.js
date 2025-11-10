// Quick test to see the structure of WorldAlphabets keyboard data
import { loadKeyboard } from 'worldalphabets';

async function testKeyboardStructure() {
  console.log('Loading GB-QWERTY keyboard...\n');
  
  const kb = await loadKeyboard('gb-qwerty');
  
  console.log('Keyboard object keys:', Object.keys(kb));
  console.log('\nKeyboard name:', kb.name);
  console.log('Keyboard id:', kb.id);
  console.log('Total keys:', kb.keys.length);
  
  console.log('\nFirst 5 keys structure:');
  for (let i = 0; i < Math.min(5, kb.keys.length); i++) {
    const key = kb.keys[i];
    console.log(`\nKey ${i}:`, {
      base: key.base,
      shift: key.shift,
      row: key.row,
      col: key.col,
      pos: key.pos,
      size: key.size,
      allKeys: Object.keys(key)
    });
  }
  
  // Check how many keys have position data
  const keysWithPosition = kb.keys.filter(k => 
    typeof k.row === 'number' && typeof k.col === 'number'
  );
  console.log(`\n✅ Keys with position data: ${keysWithPosition.length} / ${kb.keys.length}`);
  
  // Show some letter keys
  console.log('\nSample letter keys (a, s, d, f):');
  const letterKeys = kb.keys.filter(k => ['a', 's', 'd', 'f'].includes(k.base));
  for (const key of letterKeys) {
    console.log(`  ${key.base}: row=${key.row}, col=${key.col}, pos=${key.pos}`);
  }
}

testKeyboardStructure().catch(console.error);

