const fs = require('fs');
const file = 'src/components/VehicleProduction.tsx';
let c = fs.readFileSync(file, 'utf8');

const replacement = `
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        const columnMap: Record<string, string[]> = {
          'Model': ['model', 'vehicle model', 'vehicle', 'item', 'product'],
          'Chassis Number': ['chassis number', 'chassis no', 'chassis', 'vin', 'chassis #', 'vin number'],
          'Motor Number': ['motor number', 'motor no', 'motor', 'engine no', 'engine number', 'motor #'],
          'Production Date': ['production date', 'date', 'mfg date', 'manufacturing date', 'date of production'],
          'Color': ['color', 'colour', 'paint'],
          'Remarks': ['remarks', 'notes', 'comment', 'comments', 'description'],
          'Cost Price': ['cost price', 'cost', 'price', 'amount', 'value'],
          'Status': ['status', 'state']
        };

        const data = rawData.map((row: any) => {
          const cleanRow: any = {};
          
          for (const rawKey of Object.keys(row)) {
            const val = typeof row[rawKey] === 'string' ? row[rawKey].trim() : row[rawKey];
            const normalizedRowKey = rawKey.trim().toLowerCase();
            
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey.includes(alias))) {
                matchedKey = standardKey;
                break;
              }
            }
            cleanRow[matchedKey] = val;
          }
          return cleanRow;
        });

        let importedCount = 0;
        let skippedCount = 0;
        for (const row of Object.values(data) as any[]) {
          // Check for fallback columns if exact matches aren't found
          const modelVal = row['Model'];
          let chassisVal = row['Chassis Number'];
          
          // Sometimes Excel treats numbers as strings, or vice versa
          if (chassisVal && modelVal) {
            let prodDate = new Date().toISOString().split('T')[0];
            if (row['Production Date']) {
               const parsedD = new Date(row['Production Date']);
               if (!isNaN(parsedD.getTime())) prodDate = parsedD.toISOString().split('T')[0];
            }

            try { 
              await onAddVehicle({
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                model: String(modelVal),
                chassisNumber: String(chassisVal),
                motorNumber: row['Motor Number'] ? String(row['Motor Number']) : '',
                batteryNumbers: [],
                productionDate: prodDate,
                color: row['Color'] ? String(row['Color']) : 'Red',
                remarks: row['Remarks'] ? String(row['Remarks']) : '',
                costPrice: row['Cost Price'] ? Number(row['Cost Price']) : '',
                status: row['Status'] === 'Sold' ? 'Sold' : 'In Stock'
              });
              importedCount++;
            } catch(e) { 
              console.error(e);
            }
          } else {
             skippedCount++;
          }
        }`;

const regex = /const rawData = XLSX\.utils\.sheet_to_json\(ws\);[\s\S]*?skippedCount\+\+;\n\s*\}/;
if(regex.test(c)) {
   c = c.replace(regex, replacement.trim());
   fs.writeFileSync(file, c);
   console.log('replaced successfully');
} else {
   console.log('regex did not match');
}
