import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { Product } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  mode: 'create' | 'edit' | 'view';
}

const defaultUnits = ['pcs', 'kg', 'g', 'liters', 'ml', 'boxes', 'packs', 'units'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  mode,
}) => {
  const { currentBusiness, dispatch, data } = useBusiness();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    unitPrice: '',
    costPrice: '',
    unit: 'pcs',
    currentStock: '',
    minimumStock: '',
    status: 'active' as Product['status'],
    imageUrl: '',
  });

  // Get existing categories from products
  const existingCategories = React.useMemo(() => {
    const cats = new Set(
      data.products
        .filter(p => p.businessId === currentBusiness?.id)
        .map(p => p.category)
        .filter(Boolean)
    );
    return Array.from(cats) as string[];
  }, [data.products, currentBusiness?.id]);

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (product && mode !== 'create') {
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category || '',
        unitPrice: product.unitPrice.toString(),
        costPrice: product.costPrice.toString(),
        unit: product.unit,
        currentStock: product.currentStock.toString(),
        minimumStock: product.minimumStock.toString(),
        status: product.status,
        imageUrl: product.imageUrl || '',
      });
    } else {
      // Generate SKU for new products
      const skuPrefix = currentBusiness?.name.substring(0, 3).toUpperCase() || 'PRD';
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData({
        name: '',
        sku: `${skuPrefix}-${randomNum}`,
        description: '',
        category: '',
        unitPrice: '',
        costPrice: '',
        unit: 'pcs',
        currentStock: '0',
        minimumStock: '10',
        status: 'active',
        imageUrl: '',
      });
    }
    setShowNewCategory(false);
    setNewCategory('');
  }, [product, mode, currentBusiness, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and SKU are required.',
        variant: 'destructive',
      });
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const costPrice = parseFloat(formData.costPrice) || 0;

    if (unitPrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Unit price must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    const finalCategory = showNewCategory ? newCategory : formData.category;

    const productData: Partial<Product> = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      description: formData.description.trim() || undefined,
      category: finalCategory || undefined,
      unitPrice,
      costPrice,
      currency: currentBusiness?.currency.code || 'USD',
      unit: formData.unit,
      currentStock: parseInt(formData.currentStock) || 0,
      minimumStock: parseInt(formData.minimumStock) || 0,
      status: formData.status,
      imageUrl: formData.imageUrl.trim() || undefined,
    };

    if (mode === 'edit' && product) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: {
          id: product.id,
          updates: { ...productData, updatedAt: new Date().toISOString() },
        },
      });
      toast({
        title: 'Product Updated',
        description: `${productData.name} has been updated.`,
      });
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        businessId: currentBusiness?.id || '',
        ...productData as Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      toast({
        title: 'Product Created',
        description: `${productData.name} has been added to your catalog.`,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (product && confirm('Are you sure you want to delete this product?')) {
      dispatch({ type: 'DELETE_PRODUCT', payload: product.id });
      toast({
        title: 'Product Deleted',
        description: `${product.name} has been removed.`,
      });
      onClose();
    }
  };

  const margin = parseFloat(formData.unitPrice) - parseFloat(formData.costPrice);
  const marginPercent = parseFloat(formData.unitPrice) > 0 
    ? (margin / parseFloat(formData.unitPrice) * 100).toFixed(1)
    : '0';

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Product' : mode === 'edit' ? 'Edit Product' : 'Product Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PRD-0001"
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description..."
              disabled={isReadOnly}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    disabled={isReadOnly}
                  />
                  <Button type="button" variant="outline" onClick={() => setShowNewCategory(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" onClick={() => setShowNewCategory(true)}>
                      New
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
                disabled={isReadOnly}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.00"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Margin</Label>
              <div className="h-10 px-3 flex items-center bg-muted rounded-md">
                <span className={margin >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {marginPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                placeholder="0"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum Stock</Label>
              <Input
                id="minimumStock"
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                placeholder="10"
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Product['status']) => setFormData({ ...formData, status: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              disabled={isReadOnly}
            />
          </div>

          <DialogFooter className="gap-2">
            {mode === 'edit' && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === 'create' ? 'Create Product' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
