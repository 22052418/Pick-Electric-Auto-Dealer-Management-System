const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/m => m\.name === vehicle\.model && m\.color === vehicle\.color/g, 
              'm => m.name.toLowerCase() === vehicle.model.toLowerCase() && m.color?.toLowerCase() === vehicle.color.toLowerCase()');
c = c.replace(/m => m\.name === vehicle\.model && !m\.color/g, 
              'm => m.name.toLowerCase() === vehicle.model.toLowerCase() && !m.color');
c = c.replace(/m => m\.name === vehicle\.model/g, 
              'm => m.name.toLowerCase() === vehicle.model.toLowerCase()');

fs.writeFileSync('src/App.tsx', c);
