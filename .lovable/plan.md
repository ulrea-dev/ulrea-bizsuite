

## Plan: Multi-Model Business Support (Service, Product, and Hybrid)

### Overview

This plan introduces a **business model selection system** that adapts the entire app experience based on whether a business is service-based, product-based, or hybrid. The UI, navigation, terminology, and features will dynamically adjust.

---

### Business Model Types

| Model | Description | Key Entities | Example Businesses |
|-------|-------------|--------------|-------------------|
| **Service** | Projects and client work | Projects, Clients, Retainers | Agencies, Consulting, Freelancing |
| **Product** | Physical goods | Products, Customers, Inventory | Manufacturing, Retail, Distribution |
| **Hybrid** | Both services and products | All entities available | Tech companies selling products + services |

---

### Part 1: Update Business Entity and Setup

**File: `src/types/business.ts`**

Add a new `businessModel` field to the Business interface:

```typescript
export type BusinessModel = 'service' | 'product' | 'hybrid';

export interface Business {
  id: string;
  name: string;
  type: string;              // Free text (e.g., "Digital Agency", "Manufacturing")
  businessModel: BusinessModel;  // NEW: Determines app behavior
  currency: Currency;
  currentBalance: number;
  minimumBalance: number;
  createdAt: string;
  updatedAt: string;
}
```

**File: `src/components/BusinessSetup.tsx`**

Add business model selection with clear descriptions:

```text
+------------------------------------------+
|  Business Model                          |
|  +------------------------------------+  |
|  | Service-Based                      |  |
|  | Projects, clients, retainers       |  |
|  +------------------------------------+  |
|  | Product-Based                      |  |
|  | Products, inventory, customers     |  |
|  +------------------------------------+  |
|  | Hybrid (Both)                      |  |
|  | Full features for both models      |  |
|  +------------------------------------+  |
+------------------------------------------+
```

---

### Part 2: New Product-Based Entities

**File: `src/types/business.ts`** - Add new interfaces:

```typescript
// Product Entity
export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;                    // Stock Keeping Unit
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice: number;              // For profit calculation
  currency: string;
  unit: string;                   // e.g., "pcs", "kg", "liters"
  currentStock: number;
  minimumStock: number;           // For reorder alerts
  status: 'active' | 'discontinued' | 'out-of-stock';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer/Distributor Entity (Product business equivalent of Client)
export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: 'retail' | 'wholesale' | 'distributor';
  address?: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

// Sales Order
export interface SalesOrder {
  id: string;
  businessId: string;
  customerId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Production Batch (for manufacturing)
export interface ProductionBatch {
  id: string;
  businessId: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startDate: string;
  completionDate?: string;
  productionCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Procurement/Purchase Order
export interface PurchaseOrder {
  id: string;
  businessId: string;
  supplierName: string;
  orderNumber: string;
  items: PurchaseItem[];
  total: number;
  currency: string;
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  productId?: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  total: number;
}
```

---

### Part 3: Update AppData to Include New Entities

**File: `src/types/business.ts`**

```typescript
export interface AppData {
  // ... existing fields ...
  
  // Product-based business entities
  products: Product[];
  customers: Customer[];
  salesOrders: SalesOrder[];
  productionBatches: ProductionBatch[];
  purchaseOrders: PurchaseOrder[];
  
  // ... rest of existing fields ...
}
```

---

### Part 4: Dynamic Navigation Based on Business Model

**File: `src/components/AppSidebar.tsx`**

The navigation will change based on `currentBusiness.businessModel`:

**Service-Based Navigation (Current):**
```text
- Dashboard
- Works (Projects, Quick Tasks, Retainers, Renewals)
- Team
- Clients
- Financials
- Analytics
- Settings
```

**Product-Based Navigation:**
```text
- Dashboard
- Products (Catalog, Categories)
- Sales (Orders, Invoices)
- Customers (Retail, Wholesale, Distributors)
- Inventory (Stock, Reorder)
- Production (Batches, Planning)
- Procurement (Purchase Orders, Suppliers)
- Team
- Financials
- Analytics
- Settings
```

**Hybrid Navigation:**
```text
- Dashboard
- Works (Projects, Quick Tasks, Retainers, Renewals)
- Products (Catalog, Categories)
- Sales (Orders, Invoices)
- Clients & Customers
- Inventory
- Production
- Procurement
- Team
- Financials
- Analytics
- Settings
```

---

### Part 5: New Pages and Components

| Component | Purpose |
|-----------|---------|
| `ProductsPage.tsx` | List/manage products with filtering |
| `ProductModal.tsx` | Add/edit product details |
| `ProductDetailPage.tsx` | Individual product view with stock history |
| `CustomersPage.tsx` | List customers/distributors |
| `CustomerModal.tsx` | Add/edit customer |
| `SalesOrdersPage.tsx` | List sales orders |
| `SalesOrderModal.tsx` | Create/edit sales order |
| `InventoryPage.tsx` | Stock overview, low-stock alerts |
| `ProductionPage.tsx` | Production batches management |
| `ProcurementPage.tsx` | Purchase orders, supplier management |

---

### Part 6: New Reducers and Actions

**Files to create:**
- `src/reducers/productReducer.ts`
- `src/reducers/customerReducer.ts`
- `src/reducers/salesReducer.ts`
- `src/reducers/inventoryReducer.ts`
- `src/reducers/productionReducer.ts`
- `src/reducers/procurementReducer.ts`

**New action types in `src/reducers/types.ts`:**
```typescript
// Product actions
| { type: 'ADD_PRODUCT'; payload: Product }
| { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
| { type: 'DELETE_PRODUCT'; payload: string }
| { type: 'UPDATE_PRODUCT_STOCK'; payload: { id: string; quantity: number; type: 'add' | 'subtract' } }

// Customer actions
| { type: 'ADD_CUSTOMER'; payload: Customer }
| { type: 'UPDATE_CUSTOMER'; payload: { id: string; updates: Partial<Customer> } }
| { type: 'DELETE_CUSTOMER'; payload: string }

// Sales Order actions
| { type: 'ADD_SALES_ORDER'; payload: SalesOrder }
| { type: 'UPDATE_SALES_ORDER'; payload: { id: string; updates: Partial<SalesOrder> } }
| { type: 'DELETE_SALES_ORDER'; payload: string }

// Production actions
| { type: 'ADD_PRODUCTION_BATCH'; payload: ProductionBatch }
| { type: 'UPDATE_PRODUCTION_BATCH'; payload: { id: string; updates: Partial<ProductionBatch> } }
| { type: 'DELETE_PRODUCTION_BATCH'; payload: string }

// Purchase Order actions
| { type: 'ADD_PURCHASE_ORDER'; payload: PurchaseOrder }
| { type: 'UPDATE_PURCHASE_ORDER'; payload: { id: string; updates: Partial<PurchaseOrder> } }
| { type: 'DELETE_PURCHASE_ORDER'; payload: string }
```

---

### Part 7: Dashboard Adaptation

The dashboard will show different widgets based on business model:

**Service Dashboard:**
- Active Projects
- Pending Payments
- Client Overview
- Revenue Chart

**Product Dashboard:**
- Sales Summary
- Low Stock Alerts
- Top Selling Products
- Recent Orders
- Production Status
- Revenue vs Cost Chart

**Hybrid Dashboard:**
- Combined metrics from both models
- Toggle between views

---

### Implementation Phases

**Phase 1 - Foundation ✅ COMPLETED**
1. ✅ Add `businessModel` field to Business entity
2. ✅ Update BusinessSetup with model selection
3. ✅ Create basic type definitions for product entities
4. ✅ Update AppData structure
5. ✅ Add empty arrays for new entities in repository

**Phase 2 - Product Catalog** (Next)
1. ProductsPage and ProductModal
2. Product reducer and actions
3. Basic CRUD for products

**Phase 3 - Customers and Sales**
1. CustomersPage and CustomerModal
2. SalesOrdersPage and SalesOrderModal
3. Order processing workflow

**Phase 4 - Inventory and Stock**
1. InventoryPage with stock overview
2. Low stock alerts
3. Stock adjustment history

**Phase 5 - Production and Procurement**
1. ProductionPage and batch management
2. ProcurementPage and purchase orders
3. Supplier management

**Phase 6 - Dynamic Navigation and Dashboard**
1. Conditional navigation based on business model
2. Model-specific dashboard widgets
3. Analytics for product businesses

---

### Files to Create/Modify Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/business.ts` | Modify | Add BusinessModel type and product entities |
| `src/components/BusinessSetup.tsx` | Modify | Add business model selection UI |
| `src/contexts/BusinessContext.tsx` | Modify | Update addBusiness to include model |
| `src/reducers/businessReducer.ts` | Modify | Handle new business model field |
| `src/repositories/LocalStorageRepository.ts` | Modify | Initialize new entity arrays |
| `src/components/AppSidebar.tsx` | Modify | Dynamic navigation based on model |
| `src/components/DashboardHome.tsx` | Modify | Model-specific dashboard |
| `src/reducers/productReducer.ts` | Create | Product CRUD reducer |
| `src/reducers/customerReducer.ts` | Create | Customer CRUD reducer |
| `src/reducers/salesReducer.ts` | Create | Sales order reducer |
| `src/components/ProductsPage.tsx` | Create | Products listing page |
| `src/components/ProductModal.tsx` | Create | Product form modal |
| `src/components/CustomersPage.tsx` | Create | Customers listing page |
| `src/components/CustomerModal.tsx` | Create | Customer form modal |
| `src/components/SalesOrdersPage.tsx` | Create | Sales orders page |

---

### Backward Compatibility

- Existing businesses without `businessModel` will default to `'service'`
- All current functionality remains unchanged for service businesses
- Data migration handled automatically in repository load

---

### Visual Flow: Business Setup

```text
Step 1: Business Name
+----------------------------------+
|  Business Name: [_______________]|
+----------------------------------+

Step 2: Business Model Selection
+----------------------------------+
|  What type of business is this?  |
|                                  |
|  [ ] Service-Based               |
|      For agencies, consulting,   |
|      freelancing. Manage         |
|      projects and clients.       |
|                                  |
|  [ ] Product-Based               |
|      For retail, manufacturing,  |
|      distribution. Manage        |
|      products and customers.     |
|                                  |
|  [ ] Hybrid (Both)               |
|      For businesses that offer   |
|      both services and products. |
+----------------------------------+

Step 3: Additional Details
+----------------------------------+
|  Business Type: [_______________]|
|  (e.g., "Furniture Manufacturing"|
|  "Clothing Retail", etc.)        |
|                                  |
|  Currency: [USD v]               |
|  Current Balance: [___________]  |
+----------------------------------+
```

