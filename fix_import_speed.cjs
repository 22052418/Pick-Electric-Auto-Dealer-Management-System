const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

if (!c.includes('isImporting')) {
  c = c.replace('const [isUndoing, setIsUndoing] = useState(false);', 
                'const [isUndoing, setIsUndoing] = useState(false);\n  const [isImporting, setIsImporting] = useState(false);');
}

if (!c.includes('Loader2')) {
  c = c.replace('RotateCcw } from', 'RotateCcw, Loader2 } from');
}

const replacementImport = `  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        const columnMap: Record<string, string[]> = {
          'Model': ['model', 'vehicle model', 'vehicle', 'item'],
          'Chassis Number': ['chassis number', 'chassis no', 'chassis', 'vin', 'chassis #', 'vin number'],
          'Motor Number': ['motor number', 'motor no', 'motor', 'engine no', 'engine number', 'motor #'],
          'Production Date': ['production date', 'date', 'mfg date', 'manufacturing date', 'date of production'],
          'Color': ['color', 'colour', 'paint'],
          'Remarks': ['remarks', 'notes', 'comment', 'comments', 'description'],
          'Cost Price': ['cost price', 'cost', 'price', 'amount', 'value'],
          'Status': ['status', 'state']
        };

        const data = rawData.map((row: any) => {
          const cleanRow: any = { batteryNumbers: [] };
          let batteryIndexMap: {idx: number, val: string}[] = [];
          
          for (const rawKey of Object.keys(row)) {
            const val = typeof row[rawKey] === 'string' ? row[rawKey].trim() : String(row[rawKey]);
            const normalizedRowKey = rawKey.trim().toLowerCase();
            
            if (normalizedRowKey.includes('battery')) {
               const match = normalizedRowKey.match(/\\d+/);
               const idx = match ? parseInt(match[0], 10) : 999;
               batteryIndexMap.push({ idx, val });
               continue;
            }
            
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey.includes(alias))) {
                matchedKey = standardKey;
                break;
              }
            }
            cleanRow[matchedKey] = typeof row[rawKey] === 'string' ? row[rawKey].trim() : row[rawKey];
          }
          
          batteryIndexMap.sort((a,b) => a.idx - b.idx);
          cleanRow.batteryNumbers = batteryIndexMap.map(b => b.val);
          return cleanRow;
        });

        let importedCount = 0;
        let skippedCount = 0;
        const newImportedIds: string[] = [];
        const vehiclesToAdd: any[] = [];
        
        for (const row of Object.values(data) as any[]) {
          const modelVal = row['Model'];
          let chassisVal = row['Chassis Number'];
          
          if (chassisVal && modelVal) {
            let prodDate = new Date().toISOString().split('T')[0];
            if (row['Production Date']) {
               const parsedD = new Date(row['Production Date']);
               if (!isNaN(parsedD.getTime())) {
                   const z = parsedD.getTimezoneOffset() * 60000;
                   const correctDate = new Date(parsedD.getTime() - z);
                   prodDate = correctDate.toISOString().split('T')[0];
               }
            }

            const newId = Date.now().toString() + Math.random().toString(36).substring(7);
            vehiclesToAdd.push({
                id: newId,
                model: String(modelVal),
                chassisNumber: String(chassisVal),
                motorNumber: row['Motor Number'] ? String(row['Motor Number']) : '',
                batteryNumbers: row.batteryNumbers || [],
                productionDate: prodDate,
                color: row['Color'] ? String(row['Color']) : 'Red',
                remarks: row['Remarks'] ? String(row['Remarks']) : '',
                costPrice: row['Cost Price'] ? Number(row['Cost Price']) : '',
                status: row['Status'] === 'Sold' ? 'Sold' : 'In Stock'
            });
            newImportedIds.push(newId);
          } else {
             skippedCount++;
          }
        }
        
        // Chunk processing for speed
        const chunkSize = 25;
        for (let i = 0; i < vehiclesToAdd.length; i += chunkSize) {
            const chunk = vehiclesToAdd.slice(i, i + chunkSize);
            await Promise.all(chunk.map(v => onAddVehicle(v)));
            importedCount += chunk.length;
        }

        setLastImportedIds(prev => [...prev, ...newImportedIds]);
        alert(\`Successfully imported \${importedCount} vehicles!\${skippedCount > 0 ? \` Skipped \${skippedCount} items with missing Model or Chassis Number.\` : ''}\`);
      } catch (error) {
        console.error("Error importing file", error);
        alert('Failed to parse the file. Please ensure it matches the professional export format.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => setIsImporting(false);
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };`;

c = c.replace(/const handleImport = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?e\.target\.value = ''; \/\/ Reset input\n  \};/, replacementImport);

// Overlay UI
const overlayUI = `
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-md shadow-xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <div className="text-center">
                 <h3 className="text-lg font-bold text-slate-800">Importing Vehicles...</h3>
                 <p className="text-sm text-slate-500 mt-1">Please wait while verifying stock and allocating inventory. This might take a few moments for large files.</p>
              </div>
           </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">`;
c = c.replace(/<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-300 pb-2">/, overlayUI);

fs.writeFileSync('src/components/VehicleProduction.tsx', c);
