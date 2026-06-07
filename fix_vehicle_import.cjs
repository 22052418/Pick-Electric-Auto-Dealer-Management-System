const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

if (!c.includes('const [lastImportedIds, setLastImportedIds]')) {
    c = c.replace('const [showCancelConfirm, setShowCancelConfirm] = useState(false);', 
                  'const [showCancelConfirm, setShowCancelConfirm] = useState(false);\n  const [lastImportedIds, setLastImportedIds] = useState<string[]>([]);\n  const [isUndoing, setIsUndoing] = useState(false);');
}

const replacementImport = `  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
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
        
        for (const row of Object.values(data) as any[]) {
          const modelVal = row['Model'];
          let chassisVal = row['Chassis Number'];
          
          if (chassisVal && modelVal) {
            let prodDate = new Date().toISOString().split('T')[0];
            if (row['Production Date']) {
               const parsedD = new Date(row['Production Date']);
               if (!isNaN(parsedD.getTime())) {
                   // Offset timezone differences if cellDates: true shifts it
                   const z = parsedD.getTimezoneOffset() * 60000;
                   const correctDate = new Date(parsedD.getTime() - z);
                   prodDate = correctDate.toISOString().split('T')[0];
               }
            }

            try { 
              const newId = Date.now().toString() + Math.random().toString(36).substring(7);
              await onAddVehicle({
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
              importedCount++;
            } catch(e) { 
              console.error(e);
            }
          } else {
             skippedCount++;
          }
        }
        setLastImportedIds(prev => [...prev, ...newImportedIds]);
        alert(\`Successfully imported \${importedCount} vehicles!\${skippedCount > 0 ? \` Skipped \${skippedCount} items with missing Model or Chassis Number.\` : ''}\`);
      } catch (error) {
        console.error("Error importing file", error);
        alert('Failed to parse the file. Please ensure it matches the professional export format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };
  
  const handleUndoImport = async () => {
    if (lastImportedIds.length === 0) return;
    if (window.confirm(\`Are you sure you want to undo the last import? This will delete \${lastImportedIds.length} newly imported vehicles and restore their inventory.\`)) {
      setIsUndoing(true);
      try {
        await Promise.all(lastImportedIds.map(id => onDeleteVehicle(id)));
        setLastImportedIds([]);
        alert('Undo successful! Vehicles and inventory restored.');
      } catch (err: any) {
        alert('Failed to undo import completely: ' + err.message);
      } finally {
        setIsUndoing(false);
      }
    }
  };`;

c = c.replace(/const handleImport = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?e\.target\.value = ''; \/\/ Reset input\n  \};/, replacementImport);

const undoBtn = `          {lastImportedIds.length > 0 && canAdd && (
            <button
               onClick={handleUndoImport}
               disabled={isUndoing}
               className={\`px-4 py-1 text-[13px] font-bold border rounded-sm transition-colors shadow-sm flex items-center gap-1.5 \${isUndoing ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'}\`}
            >
               <RotateCcw className="w-3.5 h-3.5" />
               {isUndoing ? 'Undoing...' : 'Undo Import'}
            </button>
          )}
          {canAdd && (
            <button
              onClick={handleImportClick}
`;

c = c.replace(/\{\s*canAdd\s*&&\s*\(\s*<button\s*onClick=\{handleImportClick\}/, undoBtn);

fs.writeFileSync('src/components/VehicleProduction.tsx', c);
