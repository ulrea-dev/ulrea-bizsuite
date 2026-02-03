import React from 'react';
import { Warehouse, Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';

const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Track stock levels and manage inventory</p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <Warehouse className="h-12 w-12 text-muted-foreground" />
          <Construction className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          The Inventory module is under development. You'll soon be able to track stock movements, 
          manage warehouses, and set up automated reorder points.
        </p>
      </Card>
    </div>
  );
};

export default InventoryPage;
