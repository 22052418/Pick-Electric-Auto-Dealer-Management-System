import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { VehicleSpecifications } from './components/VehicleSpecifications';
import { VehicleProduction } from './components/VehicleProduction';
import { SalesManagement } from './components/SalesManagement';
import { PartsInventory } from './components/PartsInventory';
import { InventoryLogs } from './components/InventoryLogs';
import { StockManagement } from './components/StockManagement';
import { InvoiceSystem } from './components/InvoiceSystem';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { AdminDashboard } from './components/AdminDashboard';
import { Vehicle, Sale, Part, UserRole, VehicleModelSpec, SubDealerSale, InventoryLog } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, getDoc, writeBatch, increment } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModelSpec[]>([]);
  const [subDealerSales, setSubDealerSales] = useState<SubDealerSale[]>([]);
  const [dealerSettings, setDealerSettings] = useState<{ helpDeskPhone: string, helpDeskEmail: string, supportTeam?: { name: string, phone: string, email: string }[] }>({ 
    helpDeskPhone: '9234741782', 
    helpDeskEmail: 'pickelectricauto@gmail.com',
    supportTeam: [
      { name: 'Sujit Kumar', phone: '9624051414 ext:393', email: 'smkumar@atulauto.co.in' },
      { name: 'Mr. Nishant Y. Trivedi', phone: '9879083666 ext:399', email: 'nytrivedi@atulauto.co.in' }
    ]
  });
  
  const [lastImportLog, setLastImportLogState] = useState<{
    timestamp: number;
    fileHash: string;
    itemsAdded: { id: string; addedQuantity: number; isNew: boolean }[];
  } | null>(() => {
    try {
      const saved = localStorage.getItem('lastImportLog');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setLastImportLog = (val: any) => {
    setLastImportLogState(val);
    if (val) {
      localStorage.setItem('lastImportLog', JSON.stringify(val));
    } else {
      localStorage.removeItem('lastImportLog');
    }
  };

  const [lastStockUpdate, setLastStockUpdate] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole(null);
        setIsAuthReady(true);
      } else {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const roleData = { id: docSnap.id, ...docSnap.data() } as UserRole;
            setUserRole(roleData);
            // Default to an allowed view if dashboard is not allowed and not admin
            if (roleData.role !== 'admin' && !roleData.permissions.includes('dashboard') && roleData.permissions.length > 0) {
               setCurrentView(roleData.permissions[0]);
            }
          } else {
            // First time logic, if email is the hardcoded admin email, let's create the admin user doc
            if (currentUser.email && currentUser.email.indexOf('admin') !== -1) {
              const newAdmin: Omit<UserRole, 'id'> = {
                email: currentUser.email.split('@')[0], // Extract just the pseudo username
                role: 'admin',
                permissions: []
              };
              await setDoc(docRef, newAdmin);
              setUserRole({ id: currentUser.uid, ...newAdmin });
            } else {
               // Normal user without a document - should be logged out
               auth.signOut();
               alert("Your account does not have an access profile yet. Please contact your administrator.");
            }
          }
        } catch (e: any) {
           console.error(e);
        } finally {
           setIsAuthReady(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch Vehicles
    const qVehicles = query(collection(db, 'vehicles'), orderBy('createdAt', 'desc'));
    const unsubVehicles = onSnapshot(qVehicles, (snapshot) => {
      const data: Vehicle[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as Vehicle);
      });
      setVehicles(data);
    }, (error) => console.error("Error fetching vehicles:", error));

    // Fetch Sales
    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const data: Sale[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as Sale);
      });
      setSales(data);
    }, (error) => console.error("Error fetching sales:", error));

    // Fetch Inventory
    const qInventory = query(collection(db, 'inventory'));
    const unsubInventory = onSnapshot(qInventory, (snapshot) => {
      const data: Part[] = [];
      let latestTime = 0;
      snapshot.forEach(doc => {
        const item = { ...doc.data(), id: doc.id } as Part;
        data.push(item);
        const t = (item as any).updatedAt || (item as any).createdAt || 0;
        if (t > latestTime) latestTime = t;
      });
      data.sort((a, b) => {
        const ap = (a.partNumber || '').trim();
        const bp = (b.partNumber || '').trim();
        if (ap && bp) {
          return ap.localeCompare(bp, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (ap) return -1;
        if (bp) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      if (latestTime > 0) setLastStockUpdate(latestTime);
      setParts(data);
    }, (error) => console.error("Error fetching inventory:", error));

    const qInventoryLogs = query(collection(db, 'inventory_logs'));
    const unsubInventoryLogs = onSnapshot(qInventoryLogs, (snapshot) => {
      const data: InventoryLog[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as InventoryLog);
      });
      setInventoryLogs(data);
    }, (error) => console.error("Error fetching inventory_logs:", error));

    // Fetch Vehicle Models
    const qVehicleModels = query(collection(db, 'vehicleModels'));
    const unsubVehicleModels = onSnapshot(qVehicleModels, (snapshot) => {
      const data: VehicleModelSpec[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as VehicleModelSpec);
      });
      
      // If empty, add a default Pick Electric model with predefined usage just to bootstrap
      if (data.length === 0) {
        const defaultModel = {
          name: 'Pick Electric',
          description: 'Standard E-Rickshaw',
          bom: [
            { partId: 'battery-stub', partName: 'Battery', quantity: 1 },
            { partId: 'motor-stub', partName: 'Motor (BLDC)', quantity: 1 }
          ]
        };
        // we're not saving it here automatically to not trigger infinite loop, it just serves as fallback or they can add it via UI
      }
      
      setVehicleModels(data);
    }, (error) => console.error("Error fetching vehicleModels:", error));

    // Fetch Sub Dealer Sales
    const qSubDealerSales = query(collection(db, 'subDealerSales'), orderBy('requestDate', 'desc'));
    const unsubSubDealerSales = onSnapshot(qSubDealerSales, (snapshot) => {
      const data: SubDealerSale[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as SubDealerSale);
      });
      setSubDealerSales(data);
    }, (error) => console.error("Error fetching sub dealer sales:", error));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'dealer'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.helpDeskPhone || data.helpDeskEmail) {
          setDealerSettings({
            helpDeskPhone: data.helpDeskPhone || '9234741782',
            helpDeskEmail: data.helpDeskEmail || 'pickelectricauto@gmail.com',
            supportTeam: data.supportTeam || [
              { name: 'Sujit Kumar', phone: '9624051414 ext:393', email: 'smkumar@atulauto.co.in' },
              { name: 'Mr. Nishant Y. Trivedi', phone: '9879083666 ext:399', email: 'nytrivedi@atulauto.co.in' }
            ]
          });
        }
      }
    }, (error) => console.error("Error fetching settings:", error));

    return () => {
      unsubVehicles();
      unsubSales();
      unsubInventory();
      unsubInventoryLogs();
      unsubVehicleModels();
      unsubSubDealerSales();
      unsubSettings();
    };
  }, [user]);

  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        createdAt: new Date().toISOString()
      });

      // Find the corresponding model spec
      let modelSpec = vehicleModels.find(m => m.name === vehicle.model && m.color === vehicle.color);
      if (!modelSpec) {
        // Fallback or matches model name only
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
            
            // Unit conversions
            if (bomPart.unit === 'ML' && part.unit === 'Litres') usage = usage / 1000;
            if (bomPart.unit === 'Grams' && part.unit === 'KGs') usage = usage / 1000;
            if (bomPart.unit === 'Litres' && part.unit === 'ML') usage = usage * 1000;
            if (bomPart.unit === 'KGs' && part.unit === 'Grams') usage = usage * 1000;
            
            if (usage > 0) {
              inventoryUpdates.push({ part, usage });
            }
          }
        });
      } else {
        // Fallback for legacy Pick Electric if not found in db
        if (vehicle.model === 'Pick Eltra' || vehicle.model === 'Pick Electric') {
          const legacyUsage: Record<string, number> = {
            'Battery': 1,
            'Motor (BLDC)': 1,
            'Controller': 1,
            'Chassis': 1,
            'Shock Absorber': 2,
            'Leaf Spring': 2,
            'Tyres': 3,
          };
          for (const [pName, usage] of Object.entries(legacyUsage)) {
             const part = parts.find(p => p.name === pName);
             if (part) inventoryUpdates.push({ part, usage });
          }
        }
      }

      for (const { part, usage } of inventoryUpdates) {
        const reduceAmt = Number(usage.toFixed(4));
        await updateDoc(doc(db, 'inventory', part.id), {
          quantity: Math.max(0, part.quantity - reduceAmt),
          usedQuantity: (part.usedQuantity || 0) + reduceAmt
        });
        await addDoc(collection(db, 'inventory_logs'), {
          partId: part.id,
          partName: part.name,
          partNumber: part.partNumber || '',
          changeAmount: -reduceAmt,
          type: 'production',
          reason: `Used for vehicle ${vehicle.chassisNumber}`,
          referenceId: vehicle.chassisNumber,
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('Error adding vehicle: ' + err.message);
    }
  };

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    try {
      console.log('Update Vehicle:', updatedVehicle);
      const { id, ...data } = updatedVehicle;
      console.log('Update id:', id, 'data:', data);
      
      // Clean undefined values for Firestore
      const safeData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(doc(db, 'vehicles', id), safeData);
      console.log('Update successful');
    } catch (err: any) {
      console.error('Update failed:', err);
      alert('Error updating: ' + err.message);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    try {
      await addDoc(collection(db, 'sales'), {
        ...sale,
        createdAt: new Date().toISOString()
      });

      // Automatically mark vehicle as sold
      const vehicle = vehicles.find(v => v.chassisNumber === sale.chassisNumber);
      if (vehicle) {
        await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'Sold' });
      }
    } catch (err: any) {
      alert('Error adding sale: ' + err.message);
    }
  };

  const handleUpdateSale = async (id: string, updatedSale: Partial<Sale>) => {
    try {
      const oldSale = sales.find(s => s.id === id);
      if (oldSale && updatedSale.chassisNumber && oldSale.chassisNumber !== updatedSale.chassisNumber) {
        // Revert old vehicle
        const oldVehicle = vehicles.find(v => v.chassisNumber === oldSale.chassisNumber);
        if (oldVehicle) {
          await updateDoc(doc(db, 'vehicles', oldVehicle.id), { status: 'In Stock' });
        }
        // Mark new vehicle as sold
        const newVehicle = vehicles.find(v => v.chassisNumber === updatedSale.chassisNumber);
        if (newVehicle) {
          await updateDoc(doc(db, 'vehicles', newVehicle.id), { status: 'Sold' });
        }
      }
      await updateDoc(doc(db, 'sales', id), updatedSale);
    } catch (err: any) {
      alert('Error updating sale: ' + err.message);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      const sale = sales.find(s => s.id === id);
      if (sale && sale.chassisNumber) {
        const vehicle = vehicles.find(v => v.chassisNumber === sale.chassisNumber);
        if (vehicle) {
          await updateDoc(doc(db, 'vehicles', vehicle.id), { status: 'In Stock' });
        }
      }
      await deleteDoc(doc(db, 'sales', id));
    } catch (err: any) {
      alert('Error deleting sale: ' + err.message);
    }
  };

  const handleAddPart = async (newPart: Omit<Part, 'id' | 'usedQuantity'>) => {
    try {
      const existing = parts.find(p => p.name === newPart.name && (p.brand === newPart.brand || (!p.brand && !newPart.brand)));
      if (existing) {
        await updateDoc(doc(db, 'inventory', existing.id), {
          quantity: existing.quantity + newPart.quantity,
          supplier: newPart.supplier || existing.supplier || '',
          costPerUnit: newPart.costPerUnit,
          brand: newPart.brand || existing.brand || '',
          partNumber: newPart.partNumber || existing.partNumber || ''
        });
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...newPart,
          usedQuantity: 0,
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      alert('Error updating inventory: ' + err.message);
    }
  };

  const handleBulkAddParts = async (newParts: Omit<Part, 'id' | 'usedQuantity'>[], fileHash: string) => {
    try {
      if (lastImportLog && lastImportLog.fileHash === fileHash && parts.length > 0) {
        throw new Error(`DUPLICATE_IMPORT:${lastImportLog.timestamp}`);
      }
      
      if (newParts.length === 0) return;
      
      // Aggregate newParts to avoid multiple writes to the same document in a single batch
      const aggregatedNewParts: Omit<Part, 'id' | 'usedQuantity'>[] = [];
      newParts.forEach(np => {
        let matched = null;
        if (np.partNumber) {
          matched = aggregatedNewParts.find(a => a.partNumber === np.partNumber);
        }
        if (!matched && np.name) {
          matched = aggregatedNewParts.find(a => a.name.toLowerCase() === np.name.toLowerCase());
        }
        
        if (matched) {
          matched.quantity += np.quantity;
          if (np.costPerUnit) matched.costPerUnit = np.costPerUnit;
        } else {
          aggregatedNewParts.push({ ...np });
        }
      });

      const batch = writeBatch(db);
      const now = Date.now();
      const itemsAdded: { id: string; addedQuantity: number; isNew: boolean }[] = [];
      
      aggregatedNewParts.forEach((newPart, index) => {
        let existing = null;
        if (newPart.partNumber) {
          existing = parts.find(p => p.partNumber === newPart.partNumber);
        }
        if (!existing && newPart.name) {
          existing = parts.find(p => p.name.toLowerCase() === newPart.name.toLowerCase());
        }

        if (existing) {
          batch.update(doc(db, 'inventory', existing.id), {
            quantity: increment(newPart.quantity),
            costPerUnit: newPart.costPerUnit || existing.costPerUnit,
            partNumber: newPart.partNumber || existing.partNumber || '',
            updatedAt: now + index
          });
          itemsAdded.push({ id: existing.id, addedQuantity: newPart.quantity, isNew: false });
        } else {
          const docRef = doc(collection(db, 'inventory'));
          batch.set(docRef, {
            ...newPart,
            brand: '', // clearing brand out
            usedQuantity: 0,
            createdAt: now + index,
            updatedAt: now + index
          });
          itemsAdded.push({ id: docRef.id, addedQuantity: newPart.quantity, isNew: true });
        }
      });
      await batch.commit();
      
      setLastImportLog({
        timestamp: Date.now(),
        fileHash,
        itemsAdded
      });
    } catch (err: any) {
      if (!err.message?.startsWith('DUPLICATE_IMPORT')) {
        alert('Error bulk updating inventory: ' + err.message);
      }
      throw err;
    }
  };

  const handleUndoLastImport = async () => {
    if (!lastImportLog) return;
    try {
      const batch = writeBatch(db);
      
      const aggregateUpdates: Record<string, { addedQuantity: number, isNew: boolean, id: string }> = {};
      
      lastImportLog.itemsAdded.forEach(item => {
        if (!aggregateUpdates[item.id]) {
          aggregateUpdates[item.id] = { id: item.id, addedQuantity: 0, isNew: item.isNew };
        }
        aggregateUpdates[item.id].addedQuantity += item.addedQuantity;
      });

      for (const item of Object.values(aggregateUpdates)) {
        const existingRef = doc(db, 'inventory', item.id);
        if (item.isNew) {
          batch.delete(existingRef);
        } else {
          batch.update(existingRef, {
            quantity: increment(-item.addedQuantity),
            updatedAt: Date.now()
          });
        }
      }
      await batch.commit();
      setLastImportLog(null);
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdatePart = async (updatedPart: Part) => {
    try {
      const { id, ...data } = updatedPart;
      await updateDoc(doc(db, 'inventory', id), data);
    } catch (err: any) {
      alert('Error updating part: ' + err.message);
    }
  };

  const handleLogInventory = async (log: Omit<InventoryLog, 'id'>) => {
    try {
      await addDoc(collection(db, 'inventory_logs'), log);
    } catch (err: any) {
      console.error('Error logging inventory:', err);
    }
  };

  const handleDeleteLogs = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'inventory_logs', id))));
    } catch (err: any) {
      console.error('Error deleting logs:', err);
      alert('Error deleting logs: ' + err.message);
    }
  };

  const handleDeletePart = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err: any) {
      alert('Error deleting part: ' + err.message);
    }
  };

  const handleBulkDeleteParts = async (ids: string[]) => {
    try {
      if (ids.length === 0) return;
      
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;
      
      for (const id of ids) {
        currentBatch.delete(doc(db, 'inventory', id));
        opCount++;
        
        if (opCount === 500) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }
      
      if (opCount > 0) {
        batches.push(currentBatch.commit());
      }
      
      await Promise.all(batches);
    } catch (err: any) {
      alert('Error in bulk delete: ' + err.message);
    }
  };

  const handleAddVehicleModel = async (modelSpec: Omit<VehicleModelSpec, 'id'>) => {
    try {
      await addDoc(collection(db, 'vehicleModels'), modelSpec);
    } catch (err: any) {
      alert('Error adding vehicle model: ' + err.message);
    }
  };

  const handleUpdateVehicleModel = async (updatedModel: VehicleModelSpec) => {
    try {
      const { id, ...data } = updatedModel;
      await updateDoc(doc(db, 'vehicleModels', id), data);
    } catch (err: any) {
      alert('Error updating vehicle model: ' + err.message);
    }
  };

  const handleDeleteVehicleModel = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicleModels', id));
    } catch (err: any) {
      alert('Error deleting vehicle model: ' + err.message);
    }
  };

  const handleCreateSubDealerSale = async (sale: Omit<SubDealerSale, 'id'>) => {
    try {
      await addDoc(collection(db, 'subDealerSales'), sale);
    } catch(err: any) {
      alert('Error creating sub dealer sale request: ' + err.message);
    }
  };

  const handleCompleteSubDealerSale = async (req: SubDealerSale) => {
    try {
      // Legacy support
      const legacyModel = req.vehicleModel;
      const legacyQuantity = req.quantity || 0;
      
      const modelsToCheck = JSON.parse(JSON.stringify(req.models || (legacyModel ? [{ model: legacyModel, quantity: legacyQuantity }] : [])));
      const partsToCheck = JSON.parse(JSON.stringify(req.parts || []));

      // Pre-check stock
      const tempAssignedVehicles = new Set<string>();
      for (const m of modelsToCheck) {
        let inStockVehicles = vehicles.filter(v => v.model === m.model && v.status === 'In Stock' && !tempAssignedVehicles.has(v.id));
        const colorFilter = (m as any).color;
        if (colorFilter && colorFilter !== 'Any') {
          inStockVehicles = inStockVehicles.filter(v => v.color === colorFilter);
        }
        if (inStockVehicles.length < m.quantity) {
          alert(`Not enough stock. Required: ${m.quantity}, Available: ${inStockVehicles.length} for ${m.model}${colorFilter && colorFilter !== 'Any' ? ' ('+colorFilter+')' : ''}`);
          return;
        }
        // Mark assigned to prevent double counting in pre-check
        for(let i=0; i<m.quantity; i++) {
          tempAssignedVehicles.add(inStockVehicles[i].id);
        }
      }

      for (const p of partsToCheck) {
        const invPart = parts.find((inv: Part) => inv.id === p.partId);
        if (!invPart || invPart.quantity < p.quantity) {
          alert(`Not enough inventory. Required: ${p.quantity} for ${p.partName}`);
          return;
        }
      }

      // Update vehicles
      const assignedVehicleIds = new Set<string>();
      for (const m of modelsToCheck) {
        let inStockVehicles = vehicles.filter(v => v.model === m.model && v.status === 'In Stock' && !assignedVehicleIds.has(v.id));
        const colorFilter = (m as any).color;
        if (colorFilter && colorFilter !== 'Any') {
          inStockVehicles = inStockVehicles.filter(v => v.color === colorFilter);
        }
        const selectedVehiclesForModel = [];
        for(let i=0; i<m.quantity; i++) {
          const vehicleToUpdate = inStockVehicles[i];
          assignedVehicleIds.add(vehicleToUpdate.id);
          selectedVehiclesForModel.push({ id: vehicleToUpdate.id, chassisNumber: vehicleToUpdate.chassisNumber });
          await updateDoc(doc(db, 'vehicles', vehicleToUpdate.id), {
            status: 'Sold'
          });
        }
        m.selectedVehicles = selectedVehiclesForModel;
      }

      // Update parts
      for (const p of partsToCheck) {
        const invPart = parts.find((inv: Part) => inv.id === p.partId);
        if (invPart) {
          await updateDoc(doc(db, 'inventory', invPart.id), {
            quantity: Math.max(0, invPart.quantity - p.quantity),
            usedQuantity: (invPart.usedQuantity || 0) + p.quantity
          });
          await addDoc(collection(db, 'inventory_logs'), {
            partId: invPart.id,
            partName: invPart.name,
            partNumber: invPart.partNumber || '',
            changeAmount: -p.quantity,
            type: 'sold_to_subdealer',
            reason: `Sold to Sub-dealer: ${req.subDealerName}`,
            referenceId: req.subDealerName,
            createdAt: Date.now()
          });
        }
      }

      await updateDoc(doc(db, 'subDealerSales', req.id), {
        status: 'completed',
        models: modelsToCheck
      });
    } catch(err: any) {
      alert('Error completing sale: ' + err.message);
    }
  };

  const handleRevertSubDealerSale = async (req: SubDealerSale) => {
    try {
      const legacyModel = req.vehicleModel;
      const legacyQuantity = req.quantity || 0;
      const modelsToCheck = JSON.parse(JSON.stringify(req.models || (legacyModel ? [{ model: legacyModel, quantity: legacyQuantity }] : [])));
      const partsToCheck = JSON.parse(JSON.stringify(req.parts || []));

      // Revert stock precisely by using the saved selectedVehicles
      for (const m of modelsToCheck) {
        if (m.selectedVehicles && m.selectedVehicles.length > 0) {
          for (const sv of m.selectedVehicles) {
            await updateDoc(doc(db, 'vehicles', sv.id), {
              status: 'In Stock'
            });
          }
          // Clear assignments after reverting
          m.selectedVehicles = [];
        } else {
          // Fallback for very old records that lack selectedVehicles
          const soldVehicles = vehicles.filter(v => v.model === m.model && v.status === 'Sold');
          for(let i=0; i<Math.min(m.quantity, soldVehicles.length); i++) {
            const vehicleToUpdate = soldVehicles[i];
            await updateDoc(doc(db, 'vehicles', vehicleToUpdate.id), {
              status: 'In Stock'
            });
          }
        }
      }

      for (const p of partsToCheck) {
        const invPart = parts.find((inv: Part) => inv.id === p.partId);
        if (invPart) {
          await updateDoc(doc(db, 'inventory', invPart.id), {
            quantity: invPart.quantity + p.quantity,
            usedQuantity: Math.max(0, (invPart.usedQuantity || 0) - p.quantity)
          });
        }
      }

      await updateDoc(doc(db, 'subDealerSales', req.id), {
        status: 'pending',
        models: modelsToCheck
      });
    } catch(err: any) {
      alert('Error reverting sale: ' + err.message);
    }
  };

  const handleDeleteSubDealerSale = async (req: SubDealerSale) => {
    try {
      if (req.status === 'completed') {
        alert("Cannot delete a completed sale. Revert it first.");
        return;
      }
      await deleteDoc(doc(db, 'subDealerSales', req.id));
    } catch(err: any) {
      alert('Error deleting sale: ' + err.message);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans relative items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0088cc] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-[#0088cc] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-[#0088cc] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-slate-600 font-medium tracking-wide">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!user || (user && !userRole && user.email?.indexOf('admin') === -1)) {
    return <Login />;
  }

  // Calculate stats
  const totalProducedCount = vehicles.length;
  const availableStockCount = vehicles.filter(v => v.status === 'In Stock').length;
  const totalSoldCount = vehicles.filter(v => v.status === 'Sold').length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Security check: Check if current view is permitted
  // Bypassed for testing purposes so everyone gets full access
  const isPermitted = true;

  const effectiveUserRole: UserRole | null = userRole || (user ? {
    id: user.uid,
    email: user.email || 'admin@system.local',
    role: 'admin',
    permissions: [],
    status: 'active'
  } as UserRole : null);


  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-sans relative text-sm">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole={effectiveUserRole}
        userEmail={user?.email}
      />
      
      <div className="flex flex-1 overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto" id="main-content">
          {!isPermitted ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <p className="text-xl font-medium text-slate-500">Access Restricted</p>
                <p className="text-sm text-slate-400 mt-2">You do not have permission to view this page.</p>
              </div>
            ) : (
              <div key={currentView} className="h-full">
                {currentView.startsWith('admin') && <div className="p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-full"><AdminDashboard currentUserRole={effectiveUserRole} activeTab={currentView.split('-')[1] || 'all'} onNavigate={(tab) => setCurrentView('admin-' + tab)} /></div>}
                
                {currentView === 'dashboard' && (
                  <div className="flex flex-col">
                    {/* Dashboard Banner and UI Replica */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 lg:p-6 items-start">
                      <div className="lg:col-span-3">
                        <div className="w-full bg-white shadow-sm overflow-hidden rounded-sm flex items-center justify-center">
                           {!bannerLoaded && (
                             <div className="w-full h-[400px] flex gap-3 items-center justify-center bg-gray-50 flex-col">
                               <Loader2 className="w-8 h-8 text-[#0088cc] animate-spin" />
                               <div className="text-sm text-slate-500 font-medium animate-pulse">Loading amazing vehicles...</div>
                             </div>
                           )}
                           <img 
                             src="/banner.jpg" 
                             alt="Pick Electric Range" 
                             className={`w-full h-auto max-h-[600px] object-contain ${bannerLoaded ? 'block' : 'hidden'}`} 
                             onLoad={() => setBannerLoaded(true)}
                             onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                           />
                           <div className="hidden items-center justify-center text-slate-500 font-medium p-4 text-center w-full min-h-[400px]">
                             Please upload your banner image as <strong className="text-slate-900 mx-1">banner.jpg</strong> to the <strong className="text-slate-900 mx-1">public</strong> folder via the file explorer.
                           </div>
                        </div>
                      </div>
                      <div className="lg:col-span-1 flex flex-col gap-4">
                        {/* Dealer Help Desk */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                          <div className="bg-[#0088cc] text-white px-3 py-2 font-bold text-sm tracking-wide">
                            Dealer Help Desk
                          </div>
                          <div className="divide-y divide-gray-100">
                            <div className="flex items-center gap-3 p-3 overflow-hidden">
                               <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                 <img src="https://cdn-icons-png.flaticon.com/512/597/597177.png" alt="Phone" className="w-5 h-5 object-contain" />
                               </div>
                               <div className="font-medium text-gray-800 text-sm">{dealerSettings.helpDeskPhone}</div>
                            </div>
                            <div className="flex items-center gap-3 p-3 overflow-hidden">
                               <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                 <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" className="w-5 h-5 object-contain" />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <a href={`mailto:${dealerSettings.helpDeskEmail}`} className="font-medium text-[#006699] text-sm hover:underline break-words" title={dealerSettings.helpDeskEmail}>{dealerSettings.helpDeskEmail}</a>
                                 </div>
                            </div>
                          </div>
                        </div>

                        {/* Website */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                          <div className="bg-[#0088cc] text-white px-3 py-2 font-bold text-sm tracking-wide">
                            PICK ELECTRIC Website
                          </div>
                          <div className="divide-y divide-gray-100">
                            <div className="flex items-center gap-3 p-3">
                               <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                 <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" className="w-5 h-5 object-contain" />
                               </div>
                               <a href="#" className="font-bold text-[#006699] text-sm hover:underline">www.pickelectric.co.in</a>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                               <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                 <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" className="w-5 h-5 object-contain" />
                               </div>
                               <a href="#" className="font-medium text-[#006699] text-sm hover:underline">Youtube Channel</a>
                            </div>
                          </div>
                        </div>

                        {/* DMS Support Team */}
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                          <div className="bg-[#0088cc] text-white px-3 py-2 font-bold text-sm tracking-wide">Dealer Support Team</div>
                          <div className="divide-y divide-gray-100">
                            {(!dealerSettings.supportTeam || dealerSettings.supportTeam.length === 0) && (
                                <div className="p-3 text-sm text-gray-500 text-center">No support team available</div>
                            )}
                            {dealerSettings.supportTeam?.map((member, idx) => (
                              <div key={idx} className="divide-y divide-gray-100">
                                <div className="p-3">
                                  <div className="font-bold text-gray-800 text-sm">Name : {member.name}</div>
                                </div>
                                <div className="flex items-center gap-3 p-3 overflow-hidden">
                                  <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                    <img src="https://cdn-icons-png.flaticon.com/512/597/597177.png" alt="Phone" className="w-5 h-5 object-contain" />
                                  </div>
                                  <div className="font-medium text-gray-800 text-sm">{member.phone}</div>
                                </div>
                                <div className="flex items-center gap-3 p-3 overflow-hidden">
                                  <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-sm shrink-0">
                                    <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" className="w-5 h-5 object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <a href={`mailto:${member.email}`} className="font-medium text-[#006699] text-sm hover:underline break-words" title={member.email}>{member.email}</a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentView === 'production' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <VehicleProduction 

                      vehicles={vehicles}
                      vehicleModels={vehicleModels}
                      onAddVehicle={handleAddVehicle}
                      onUpdateVehicle={handleUpdateVehicle}
                      onDeleteVehicle={handleDeleteVehicle}
                      userRole={effectiveUserRole}
                    />
                  </div>
                )}
                {currentView === 'specifications' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <VehicleSpecifications 
                      vehicleModels={vehicleModels}
                      parts={parts}
                      onAddModel={handleAddVehicleModel}
                      onUpdateModel={handleUpdateVehicleModel}
                      onDeleteModel={handleDeleteVehicleModel}
                    />
                  </div>
                )}
                
                {currentView === 'stock' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <StockManagement 
                      vehicles={vehicles}
                      vehicleModels={vehicleModels}
                      parts={parts}
                      subDealerSales={subDealerSales}
                      sales={sales}
                      onCreateSubDealerSale={handleCreateSubDealerSale}
                      onCompleteSubDealerSale={handleCompleteSubDealerSale}
                      onRevertSubDealerSale={handleRevertSubDealerSale}
                      onDeleteSubDealerSale={handleDeleteSubDealerSale}
                    />
                  </div>
                )}
                
                {currentView === 'sales' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <SalesManagement 
                      sales={sales}
                      vehicles={vehicles}
                      onAddSale={handleAddSale}
                    />
                  </div>
                )}

                  {currentView === 'parts' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <PartsInventory 
                      parts={parts}
                      inventoryLogs={inventoryLogs}
                      onAddPart={handleAddPart}
                      onUpdatePart={handleUpdatePart}
                      onDeletePart={handleDeletePart}
                      onBulkDeleteParts={handleBulkDeleteParts}
                      onBulkAddParts={handleBulkAddParts}
                      onUndoLastImport={handleUndoLastImport}
                      onLogInventory={handleLogInventory}
                      lastImportTime={lastImportLog?.timestamp}
                      lastStockUpdate={lastStockUpdate}
                      userRole={effectiveUserRole}
                      onViewLogs={() => setCurrentView('inventory_logs')}
                    />
                  </div>
                  )}

                  {currentView === 'inventory_logs' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <InventoryLogs
                      logs={inventoryLogs}
                      onDeleteLogs={handleDeleteLogs}
                      onBack={() => setCurrentView('parts')}
                    />
                  </div>
                  )}

                  {currentView === 'invoices' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <InvoiceSystem 
                      sales={sales}
                      vehicles={vehicles}
                      onAddSale={handleAddSale}
                      onUpdateSale={handleUpdateSale}
                      onDeleteSale={handleDeleteSale}
                    />
                  </div>
                  )}
                  
                  {currentView === 'reports' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide border-b border-gray-100 pb-2">Business Overview</h3>
                      </div>
                      <DashboardCards 
                        vehicles={vehicles}
                        sales={sales}
                        parts={parts}
                        subDealerSales={subDealerSales}
                      />
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#006699] uppercase tracking-wide border-b border-gray-100 pb-2">Detailed Reports</h3>
                      </div>
                      <Reports 
                        sales={sales}
                        vehicles={vehicles}
                      />
                    </div>
                  </div>
                  )}
                  
                  {!currentView.startsWith('admin') && currentView !== 'dashboard' && currentView !== 'production' && currentView !== 'specifications' && currentView !== 'stock' && currentView !== 'sales' && currentView !== 'parts' && currentView !== 'inventory_logs' && currentView !== 'invoices' && currentView !== 'reports' && (
                  <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-sm">
                      <p className="text-lg font-medium text-slate-500 capitalize">
                        {currentView.replace('-', ' ')} View
                      </p>
                    </div>
                  </div>
                  )}
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
