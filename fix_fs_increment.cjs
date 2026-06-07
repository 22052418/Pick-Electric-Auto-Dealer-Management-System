const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/import \{.*?\} from 'firebase\/firestore';/, (match) => {
   if (!match.includes('increment')) {
      return match.replace('}', ', increment }');
   }
   return match;
});

// Update handles to use increment for quantity & usedQuantity
c = c.replace(/quantity: part\.quantity \+ addAmt,/g, 'quantity: increment(addAmt),');
c = c.replace(/usedQuantity: Math\.max\([^)]+\)/g, 'usedQuantity: increment(-addAmt)');

c = c.replace(/quantity: Math\.max\(0, part\.quantity - reduceAmt\),/g, 'quantity: increment(-reduceAmt),');
c = c.replace(/usedQuantity: \(part\.usedQuantity \|\| 0\) \+ reduceAmt/g, 'usedQuantity: increment(reduceAmt)');

fs.writeFileSync('src/App.tsx', c);
