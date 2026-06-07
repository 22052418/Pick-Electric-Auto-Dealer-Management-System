const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

const mappingCode = `
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey === alias || normalizedRowKey === alias + 's' || normalizedRowKey === alias + ' num' || normalizedRowKey === alias + ' number')) {
                matchedKey = standardKey;
                break;
              }
            }
`;
c = c.replace(/let matchedKey = rawKey\.trim\(\);\s*for \(const \[standardKey, aliases\] of Object\.entries\(columnMap\)\) \{\s*if \(aliases\.some\(alias => normalizedRowKey\.includes\(alias\)\)\) \{\s*matchedKey = standardKey;\s*break;\s*\}\s*\}/m, mappingCode.trim());

const displayCode = `<td className="px-3 py-2 border-r border-slate-300 text-slate-600 max-w-[200px] truncate" title={vehicle.batteryNumbers?.filter(b => !!b).join(', ')}>
                        {vehicle.batteryNumbers?.filter(b => !!b).length 
                           ? vehicle.batteryNumbers.filter(b => !!b).join(', ') 
                           : (vehicle.batteryNumbers?.length ? batteryName : 'None')}
                      </td>`;
c = c.replace(/<td className="px-3 py-2 border-r border-slate-300 text-slate-600">\s*\{vehicle\.batteryNumbers\?\.length \? batteryName : 'None'\}\s*<\/td>/m, displayCode.trim());

fs.writeFileSync('src/components/VehicleProduction.tsx', c);
