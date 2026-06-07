const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/usedQuantity: increment\(-addAmt\) - addAmt\)/g, 'usedQuantity: increment(-addAmt)');
c = c.replace(/usedQuantity: increment\(-addAmt\) - p\.quantity\)/g, 'usedQuantity: increment(-p.quantity)');
c = c.replace(/quantity: invPart\.quantity \+ p\.quantity,/g, 'quantity: increment(p.quantity),');

fs.writeFileSync('src/App.tsx', c);
