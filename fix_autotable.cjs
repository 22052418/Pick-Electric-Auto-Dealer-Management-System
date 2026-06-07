const fs = require('fs');
let lines = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

lines = lines.replace(
  "import 'jspdf-autotable';",
  "import autoTable from 'jspdf-autotable';"
);

lines = lines.replace(
  "(doc as any).autoTable({",
  "autoTable(doc, {"
);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', lines, 'utf8');
