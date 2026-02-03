import React from 'react';
import { ShoppingCart, Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';

const SalesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <p className="text-muted-foreground">Manage sales orders and track deliveries</p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <Construction className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          The Sales Orders module is under development. You'll soon be able to create orders, 
          track deliveries, and manage customer invoices.
        </p>
      </Card>
    </div>
  );
};

export default SalesPage;
