const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleProduction.tsx', 'utf8');

const mappingCode = `
            let matchedKey = rawKey.trim();
            for (const [standardKey, aliases] of Object.entries(columnMap)) {
              if (aliases.some(alias => normalizedRowKey.includes(alias))) {
                matchedKey = standardKey;
                break;
              }
            }
`;
c = c.replace(/let matchedKey = rawKey\.trim\(\);\n\s*for \(const \[standardKey, aliases\] of Object\.entries\(columnMap\)\) \{\n\s*if \(aliases\.some\(alias => normalizedRowKey === alias \|\| normalizedRowKey\.startsWith\(alias \+ ' '\) \|\| normalizedRowKey\.startsWith\(alias \+ '\('\) \|\| normalizedRowKey\.endsWith\(' ' \+ alias\)\)\) \{\n\s*matchedKey = standardKey;\n\s*break;\n\s*\}\n\s*\}/m, mappingCode.trim());

fs.writeFileSync('src/components/VehicleProduction.tsx', c);
