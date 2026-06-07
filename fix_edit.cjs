const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

c = c.replace(
  /const handleEdit = \(model: VehicleModelSpec\) => \{\n    setSelectedGroupName\(null\);/g,
  `const handleEdit = (model: VehicleModelSpec) => {`
);

fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
