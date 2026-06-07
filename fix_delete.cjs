const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const handleDeleteVehicle = async (id: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === id);
      if (vehicle) {
        // Find the corresponding model spec
        let modelSpec = vehicleModels.find(m => m.name === vehicle.model && m.color === vehicle.color);
        if (!modelSpec) {
          modelSpec = vehicleModels.find(m => m.name === vehicle.model && !m.color);
          if (!modelSpec) {
             modelSpec = vehicleModels.find(m => m.name === vehicle.model);
          }
        }
        
        const inventoryUpdates: { part: Part; usage: number }[] = [];

        if (modelSpec && modelSpec.bom) {
          modelSpec.bom.forEach(bomPart => {
            const part = parts.find(p => p.id === bomPart.partId || p.name === bomPart.partName);
            if (part) {
              let usage = bomPart.quantity;
              if (bomPart.unit === 'ML' && part.unit === 'Litres') usage = usage / 1000;
              if (bomPart.unit === 'Grams' && part.unit === 'KGs') usage = usage / 1000;
              if (bomPart.unit === 'Litres' && part.unit === 'ML') usage = usage * 1000;
              if (bomPart.unit === 'KGs' && part.unit === 'Grams') usage = usage * 1000;
              if (usage > 0) {
                inventoryUpdates.push({ part, usage });
              }
            }
          });
        }
        
        // Restore inventory
        for (const { part, usage } of inventoryUpdates) {
          const addAmt = Number(usage.toFixed(4));
          await updateDoc(doc(db, 'inventory', part.id), {
            quantity: part.quantity + addAmt,
            usedQuantity: Math.max(0, (part.usedQuantity || 0) - addAmt)
          });
          await addDoc(collection(db, 'inventory_logs'), {
            partId: part.id,
            partName: part.name,
            partNumber: part.partNumber || '',
            changeAmount: addAmt,
            type: 'production_reverted',
            reason: \`Reverted deletion for vehicle \${vehicle.chassisNumber}\`,
            referenceId: vehicle.chassisNumber,
            createdAt: Date.now()
          });
        }
      }
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };`;

c = c.replace(/const handleDeleteVehicle = async \(id: string\) => \{[\s\S]*?alert\('Error deleting: ' \+ err\.message\);\n    \}\n  \};/, replacement);
fs.writeFileSync('src/App.tsx', c);
