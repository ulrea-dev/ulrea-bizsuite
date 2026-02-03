

## Plan: Phase 2 - Dynamic Navigation and Product Catalog

### Overview

This phase will make the sidebar navigation dynamic based on the business model, and create the full product catalog functionality for product-based businesses.

---

### Part 1: Dynamic Navigation in AppSidebar

**File: `src/components/AppSidebar.tsx`**

Transform the static navigation items into dynamic ones based on `currentBusiness?.businessModel`:

**Service-Based Navigation (current behavior):**
- Dashboard
- Works (Projects, Quick Tasks, Retainers, Renewals)
- Team
- Clients
- Financials
- Analytics
- Settings

**Product-Based Navigation:**
- Dashboard
- Products (Catalog)
- Sales (Orders)
- Customers
- Inventory
- Production
- Procurement
- Team
- Financials
- Analytics
- Settings

**Hybrid Navigation:**
- All of the above combined

**Implementation approach:**
```typescript
// Use useMemo to compute navigation based on business model
const navigationItems = useMemo(() => {
  const businessModel = currentBusiness?.businessModel || 'service';
  
  // Base items for all models
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  ];
  
  // Service-specific items
  const serviceItems = [
    { id: 'works', label: 'Works', ... },
    { id: 'clients', label: 'Clients', ... },
  ];
  
  // Product-specific items
  const productItems = [
    { id: 'products', label: 'Products', icon: Package, path: '/products' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, path: '/inventory' },
    { id: 'production', label: 'Production', icon: Factory, path: '/production' },
    { id: 'procurement', label: 'Procurement', icon: Truck, path: '/procurement' },
  ];
  
  // Build navigation based on model
  if (businessModel === 'service') {
    return [...baseItems, ...serviceItems, ...commonItems];
  } else if (businessModel === 'product') {
    return [...baseItems, ...productItems, ...commonItems];
  } else {
    // Hybrid - show both
    return [...baseItems, ...serviceItems, ...productItems, ...commonItems];
  }
}, [currentBusiness?.businessModel]);
```

---

### Part 2: Product Reducer

**File: `src/reducers/productReducer.ts`** (NEW)

Create a reducer to handle product CRUD operations:

```typescript
import { AppData, Product } from '@/types/business';
import { BusinessAction } from './types';

export const productReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };
      
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
      
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
      
    case 'UPDATE_PRODUCT_STOCK':
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id === action.payload.id) {
            const newStock = action.payload.type === 'add'
              ? p.currentStock + action.payload.quantity
              : p.currentStock - action.payload.quantity;
            return { ...p, currentStock: Math.max(0, newStock) };
          }
          return p;
        }),
      };
      
    default:
      return null;
  }
};
```

---

### Part 3: Update Action Types

**File: `src/reducers/types.ts`**

Add product-related actions:

```typescript
import { Product, Customer, SalesOrder, ProductionBatch, PurchaseOrder } from '@/types/business';

// Add to BusinessAction union:
// Product actions
| { type: 'ADD_PRODUCT'; payload: Product }
| { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
| { type: 'DELETE_PRODUCT'; payload: string }
| { type: 'UPDATE_PRODUCT_STOCK'; payload: { id: string; quantity: number; type: 'add' | 'subtract' } }

// Customer actions
| { type: 'ADD_CUSTOMER'; payload: Customer }
| { type: 'UPDATE_CUSTOMER'; payload: { id: string; updates: Partial<Customer> } }
| { type: 'DELETE_CUSTOMER'; payload: string }
```

---

### Part 4: Register Reducer in Root

**File: `src/reducers/rootReducer.ts`**

Add productReducer to the domain reducers list:

```typescript
import { productReducer } from './productReducer';

const domainReducers = [
  businessReducer,
  projectReducer,
  teamReducer,
  clientReducer,
  paymentReducer,
  salaryReducer,
  settingsReducer,
  taskReducer,
  accountReducer,
  productReducer,  // NEW
];
```

---

### Part 5: Products Page

**File: `src/pages/ProductsPage.tsx`** (NEW)

A page to list and manage products with:
- Search and filter functionality
- Grid/table view toggle
- Stock status indicators
- Quick actions (edit, delete, adjust stock)

Key features:
- Filter products by category, status
- Sort by name, price, stock level
- Low stock alerts highlighted
- Profit margin display (unitPrice - costPrice)

```typescript
const ProductsPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Filter products for current business
  const businessProducts = data.products.filter(
    p => p.businessId === currentBusiness?.id
  );
  
  // Apply search and filters
  const filteredProducts = businessProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      {/* Search and filters */}
      {/* Product grid/table */}
    </div>
  );
};
```

---

### Part 6: Product Modal

**File: `src/components/ProductModal.tsx`** (NEW)

A modal dialog for adding/editing products:

Fields:
- Name (required)
- SKU (required, auto-generated option)
- Description
- Category (select or create new)
- Unit Price (required)
- Cost Price (required)
- Currency (defaults to business currency)
- Unit (pcs, kg, liters, etc.)
- Current Stock
- Minimum Stock (for reorder alerts)
- Status (active, discontinued, out-of-stock)
- Image URL (optional)

```typescript
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  mode: 'create' | 'edit' | 'view';
}
```

---

### Part 7: Add Routes

**File: `src/App.tsx`**

Add routes for product-based business pages:

```typescript
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";

// Inside Routes:
{/* Products Section (for product/hybrid businesses) */}
<Route path="/products" element={<ProductsPage />} />
<Route path="/products/:productId" element={<ProductDetailPage />} />
<Route path="/customers" element={<CustomersPage />} />
<Route path="/customers/:customerId" element={<CustomerDetailPage />} />
<Route path="/sales" element={<SalesOrdersPage />} />
<Route path="/inventory" element={<InventoryPage />} />
<Route path="/production" element={<ProductionPage />} />
<Route path="/procurement" element={<ProcurementPage />} />
```

Note: Some pages will be placeholder stubs initially (SalesOrdersPage, InventoryPage, etc.) to be implemented in later phases.

---

### Part 8: Customer Reducer

**File: `src/reducers/customerReducer.ts`** (NEW)

Similar to product reducer for customer CRUD:

```typescript
export const customerReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
    default:
      return null;
  }
};
```

---

### Part 9: Customers Page

**File: `src/pages/CustomersPage.tsx`** (NEW)

A page to list and manage customers/distributors:
- Filter by type (retail, wholesale, distributor)
- Show total purchases and outstanding balance
- Link to customer detail page

---

### Part 10: Customer Modal

**File: `src/components/CustomerModal.tsx`** (NEW)

Modal for adding/editing customers:
- Name
- Email
- Phone
- Company
- Type (retail/wholesale/distributor)
- Address

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/AppSidebar.tsx` | Modify | Dynamic navigation based on business model |
| `src/reducers/types.ts` | Modify | Add product and customer action types |
| `src/reducers/rootReducer.ts` | Modify | Register new reducers |
| `src/reducers/productReducer.ts` | Create | Product CRUD reducer |
| `src/reducers/customerReducer.ts` | Create | Customer CRUD reducer |
| `src/pages/ProductsPage.tsx` | Create | Products listing page |
| `src/components/ProductModal.tsx` | Create | Product form modal |
| `src/pages/CustomersPage.tsx` | Create | Customers listing page |
| `src/components/CustomerModal.tsx` | Create | Customer form modal |
| `src/App.tsx` | Modify | Add routes for new pages |
| `src/reducers/index.ts` | Modify | Export new reducers |

---

### Visual: Navigation Comparison

```text
SERVICE MODEL:              PRODUCT MODEL:              HYBRID MODEL:
+---------------+           +---------------+           +---------------+
| Dashboard     |           | Dashboard     |           | Dashboard     |
| Works >       |           | Products      |           | Works >       |
|  - Projects   |           | Sales         |           | Products      |
|  - Tasks      |           | Customers     |           | Sales         |
|  - Retainers  |           | Inventory     |           | Clients       |
|  - Renewals   |           | Production    |           | Customers     |
| Team          |           | Procurement   |           | Inventory     |
| Clients       |           | Team          |           | Production    |
| Financials >  |           | Financials >  |           | Procurement   |
| Analytics     |           | Analytics     |           | Team          |
| Settings      |           | Settings      |           | Financials >  |
+---------------+           +---------------+           | Analytics     |
                                                        | Settings      |
                                                        +---------------+
```

---

### Key Technical Points

1. **Business Model Check**: Navigation items are computed using `useMemo` based on `currentBusiness?.businessModel`, with fallback to 'service' for backward compatibility

2. **Route Protection**: All new routes remain within the protected route structure

3. **Business Filtering**: Products and customers are filtered by `businessId` to show only items belonging to the current business

4. **Stock Management**: `UPDATE_PRODUCT_STOCK` action allows increment/decrement of stock without replacing the entire product

5. **Stub Pages**: Production, Procurement, and Inventory pages will be created as simple placeholder components to be expanded in later phases

