
import React from 'react';
import { CurrencyRateSettings } from '@/components/CurrencyRateSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const SalarySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Salary Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure currency exchange rates and other salary-related settings.
        </p>
      </div>

      <CurrencyRateSettings />

      <Card>
        <CardHeader>
          <CardTitle>Salary Information</CardTitle>
          <CardDescription>
            Additional settings and information about salary management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Primary Salaries:</strong> Regular ongoing salaries for permanent team members.
            </p>
            <p>
              <strong>Secondary/Contract Salaries:</strong> Fixed-term contract work with specified duration (6-60 months).
            </p>
            <p>
              <strong>Currency Conversion:</strong> Set exchange rates above to automatically convert salaries from different currencies to your default currency for reporting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
