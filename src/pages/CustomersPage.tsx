import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, Filter } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerModal } from '@/components/CustomerModal';
import { Customer } from '@/types/business';
import { formatNumberWithCommas } from '@/utils/numberFormat';

const CustomersPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter customers for current business
  const businessCustomers = useMemo(() => 
    data.customers.filter(c => c.businessId === currentBusiness?.id),
    [data.customers, currentBusiness?.id]
  );

  // Apply filters
  const filteredCustomers = useMemo(() => {
    return businessCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || customer.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [businessCustomers, searchTerm, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalCustomers = businessCustomers.length;
    const retailCount = businessCustomers.filter(c => c.type === 'retail').length;
    const wholesaleCount = businessCustomers.filter(c => c.type === 'wholesale').length;
    const distributorCount = businessCustomers.filter(c => c.type === 'distributor').length;
    const totalPurchases = businessCustomers.reduce((sum, c) => sum + c.totalPurchases, 0);
    const totalOutstanding = businessCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
    return { totalCustomers, retailCount, wholesaleCount, distributorCount, totalPurchases, totalOutstanding };
  }, [businessCustomers]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const getTypeBadge = (type: Customer['type']) => {
    switch (type) {
      case 'retail':
        return <Badge variant="outline">Retail</Badge>;
      case 'wholesale':
        return <Badge variant="secondary">Wholesale</Badge>;
      case 'distributor':
        return <Badge variant="default">Distributor</Badge>;
    }
  };

  const currency = currentBusiness?.currency.symbol || '$';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customers and distributors</p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distributors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.distributorCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currency}{formatNumberWithCommas(stats.totalPurchases.toString())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{currency}{formatNumberWithCommas(stats.totalOutstanding.toString())}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground mb-4">
            {businessCustomers.length === 0 
              ? "Get started by adding your first customer."
              : "Try adjusting your search or filters."}
          </p>
          {businessCustomers.length === 0 && (
            <Button onClick={handleAddCustomer}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEditCustomer(customer)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold truncate">{customer.name}</h3>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                  </div>
                  {getTypeBadge(customer.type)}
                </div>
                
                {customer.email && (
                  <p className="text-sm text-muted-foreground mb-1">{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-sm text-muted-foreground mb-3">{customer.phone}</p>
                )}
                
                <div className="space-y-2 text-sm pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Purchases:</span>
                    <span className="font-medium">{currency}{formatNumberWithCommas(customer.totalPurchases.toString())}</span>
                  </div>
                  {customer.outstandingBalance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding:</span>
                      <span className="text-destructive font-medium">{currency}{formatNumberWithCommas(customer.outstandingBalance.toString())}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customer={selectedCustomer}
        mode={selectedCustomer ? 'edit' : 'create'}
      />
    </div>
  );
};

export default CustomersPage;
