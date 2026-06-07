export interface SubDealerSale {
  id: string;
  subDealerName: string;
  subDealerAddress?: string;
  subDealerPhone?: string;
  vehicleModel?: string; // legacy
  quantity?: number; // legacy
  models: { model: string; color?: string; quantity: number; selectedVehicles?: { id: string; chassisNumber: string }[] }[];
  parts: { partId: string; partName: string; quantity: number }[];
  totalAmount?: number;
  remarks?: string;
  status: 'pending' | 'completed';
  requestDate: string;
}

export interface BOMPart {
  partId: string;
  partName: string;
  quantity: number;
  unit?: 'Pieces' | 'Litres' | 'ML' | 'KGs' | 'Grams';
}

export interface VehicleModelSpec {
  id: string;
  name: string;
  color?: string;
  bom: BOMPart[];
  description?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  chassisNumber: string;
  motorNumber: string;
  batteryNumbers?: string[];
  productionDate: string;
  color: string;
  technicianName?: string;
  costPrice: number | string;
  status: "In Stock" | "Sold";
  remarks?: string;
}

export interface Sale {
  id: string;
  invoiceId: string;
  customerName: string;
  relationName?: string;
  phoneNumber: string;
  address: string;
  postOffice?: string;
  policeStation?: string;
  districtPin?: string;
  chassisNumber: string;
  vehicleModel: string;
  sellingPrice: number;
  gstAmount: number;
  totalAmount: number;
  saleDate: string;
  wrcBookNo?: string;
  keyNumber?: string;
  batteryNumber?: string;
  tyresMake?: string;
  tyresNumber?: string;
  hypothecation?: string;
  salesPerson?: string;
  deliveryFrom?: string;
}

export interface Part {
  id: string;
  partNumber?: string;
  name: string;
  brand?: string;
  unit?: 'Pieces' | 'Litres' | 'KGs';
  quantity: number;
  usedQuantity: number;
  supplier: string;
  costPerUnit: number;
}

export interface InventoryLog {
  id: string;
  partId: string;
  partName: string;
  partNumber?: string;
  changeAmount: number; // positive for added, negative for reduced
  type: 'added_stock' | 'sold_to_subdealer' | 'defective' | 'production' | 'manual_adjustment' | 'import_stock' | 'undo_import';
  reason?: string;
  referenceId?: string; // vehicle chassis or subdealer name
  createdAt: number;
}

export interface UserRole {
  id: string;
  email: string;
  name?: string;
  branchName?: string;
  branchCode?: string;
  dealershipName?: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

export interface PasswordRequest {
  id: string;
  email: string;
  status: 'pending' | 'resolved';
  requestedAt: string;
}

export interface LoginBanner {
  id: string;
  imageUrl: string;
  createdAt: number;
}

export interface SupportTeamMember {
  id: string;
  name: string;
  phone: string;
  email: string;
}
