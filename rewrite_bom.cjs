const fs = require('fs');
let c = fs.readFileSync('src/components/VehicleSpecifications.tsx', 'utf8');

const s = c.indexOf('return filteredBom.map(({ item: bomItem, originalIndex: idx }) => {');
const e = c.indexOf('});\n                })()}\n                </div>\n              )\n            </div>');

const newCode = `return filteredBom.map(({ item: bomItem, originalIndex: idx }) => {
                      const matchedPart = parts.find(p => p.name === bomItem.partName);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white p-2 border border-slate-300 rounded-sm mb-2 shadow-sm hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="bg-slate-50 text-slate-500 w-8 h-8 flex items-center justify-center rounded-sm text-[12px] font-bold shrink-0 shadow-inner border border-slate-200">
                              {idx + 1}
                            </div>
                            {matchedPart?.partNumber && (
                              <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-2 flex flex-col justify-center h-8 rounded-sm border border-slate-200 shrink-0 uppercase tracking-widest">
                                {matchedPart.partNumber}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex items-center h-8">
                              <div className="text-[13px] font-bold text-[#006699] truncate uppercase tracking-wide">{bomItem.partName || 'Unknown Part'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end gap-1.5 shrink-0 pl-10 sm:pl-0">
                            <input
                              type="number" step="0.001"
                              required
                              min="0.001"
                              value={bomItem.quantity === 0 && Boolean((bomItem as any)._isEmpty) ? '' : bomItem.quantity}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 const updated = [...formData.bom];
                                 if (val === '') {
                                   updated[idx] = { ...updated[idx], quantity: 0, _isEmpty: true } as any;
                                 } else {
                                   updated[idx] = { ...updated[idx], quantity: Number(val), _isEmpty: false } as any;
                                 }
                                 setFormData({ ...formData, bom: updated });
                              }}
                              className="w-[84px] px-2 py-1 h-8 text-[13px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 focus:border-slate-400 font-bold text-[#006699] text-center"
                            />
                            <select
                              value={bomItem.unit || 'Pieces'}
                              onChange={(e) => {
                                 const updated = [...formData.bom];
                                 updated[idx] = { ...updated[idx], unit: e.target.value as any };
                                 setFormData({ ...formData, bom: updated });
                              }}
                              className="w-[64px] px-1 h-8 py-1 text-[11px] border border-slate-300 rounded-sm focus:outline-none focus:border-blue-400 bg-slate-50 font-bold text-slate-500 uppercase tracking-widest"
                            >
                              <option value="Pieces">PCS</option>
                              <option value="Litres">L</option>
                              <option value="ML">ML</option>
                              <option value="KGs">KG</option>
                              <option value="Grams">G</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveBOMPart(idx)}
                              className="w-8 h-8 flex items-center justify-center text-white bg-red-600 border border-red-700 hover:bg-red-700 rounded-sm transition-colors shadow-sm ml-1"
                              title="Remove Part"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
`;

c = c.substring(0, s) + newCode + c.substring(e);
fs.writeFileSync('src/components/VehicleSpecifications.tsx', c, 'utf8');
