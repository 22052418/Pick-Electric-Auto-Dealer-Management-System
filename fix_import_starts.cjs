const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

const mappingCode = `
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey === alias || normalizedRowKey.startsWith(alias + ' ') || normalizedRowKey.startsWith(alias + '(') || normalizedRowKey.endsWith(' ' + alias))) {
                matchedKey = standardKey;
                break;
              }
            }
`;
c = c.replace(/let matchedKey = rawKey\.trim\(\);\s*for \(const \[standardKey, aliases\] of Object\.entries\(columnMap\)\) \{\s*if \(aliases\.some\(alias => normalizedRowKey === alias \|\| normalizedRowKey === alias \+ 's' \|\| normalizedRowKey === alias \+ ' num' \|\| normalizedRowKey === alias \+ ' number'\)\) \{\s*matchedKey = standardKey;\s*break;\s*\}\s*\}/m, mappingCode.trim());

// Also remove 'product' from aliases if it's there
c = c.replace(/'Model': \['model', 'vehicle model', 'vehicle', 'item', 'product'\],/,
              "'Model': ['model', 'vehicle model', 'vehicle', 'item'],");

fs.writeFileSync('src/components/VehicleProduction.tsx', c);
