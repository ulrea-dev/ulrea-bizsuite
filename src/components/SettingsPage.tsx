
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Trash2, Moon, Sun, Database, User, Building } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTheme } from '@/hooks/useTheme';
import { exportData, importData, clearAllData } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';

export const SettingsPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExportData = () => {
    const dataStr = exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `bizsuite-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(dataUrl);
  };

  const handleImportData = async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      const importedData = importData(text);
      dispatch({ type: 'LOAD_DATA', payload: importedData });
      setImportFile(null);
      alert('Data imported successfully!');
    } catch (error) {
      alert('Error importing data. Please check the file format.');
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleUsernameUpdate = (username: string) => {
    dispatch({ type: 'SET_USERNAME', payload: username });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Settings</h1>
        <p className="dashboard-text-secondary">Manage your preferences and data</p>
      </div>

      {/* User Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Settings
          </CardTitle>
          <CardDescription>Manage your personal preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={data.userSettings.username}
              onChange={(e) => handleUsernameUpdate(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm dashboard-text-secondary">
                Choose your preferred theme
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Select
              value={data.userSettings.defaultCurrency.code}
              onValueChange={(value) => {
                const currency = SUPPORTED_CURRENCIES.find(c => c.code === value);
                if (currency) {
                  dispatch({
                    type: 'SET_USERNAME', // We need to add a SET_CURRENCY action
                    payload: data.userSettings.username
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business Overview */}
      {currentBusiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Current Business
            </CardTitle>
            <CardDescription>Overview of your selected business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Business Name</Label>
                <p className="font-medium">{currentBusiness.name}</p>
              </div>
              <div>
                <Label>Business Type</Label>
                <p className="font-medium">{currentBusiness.type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Badge variant="outline">
                  {currentBusiness.currency.symbol} {currentBusiness.currency.name}
                </Badge>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm dashboard-text-secondary">
                  {new Date(currentBusiness.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, or clear your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            
            <div className="space-y-2">
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              <Button 
                onClick={handleImportData} 
                disabled={!importFile}
                variant="outline" 
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Data
              </Button>
            </div>
            
            <Button 
              onClick={handleClearData} 
              variant="destructive" 
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>

          <Separator />

          <div className="text-sm dashboard-text-secondary">
            <h4 className="font-medium mb-2">Data Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">{data.businesses.length}</span>
                <p>Businesses</p>
              </div>
              <div>
                <span className="font-medium">{data.projects.length}</span>
                <p>Projects</p>
              </div>
              <div>
                <span className="font-medium">{data.teamMembers.length}</span>
                <p>Team Members</p>
              </div>
              <div>
                <span className="font-medium">{data.clients.length}</span>
                <p>Clients</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Reminder */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 dashboard-surface-elevated rounded-lg">
              <Database className="h-5 w-5 dashboard-text-secondary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1">Regular Backups Recommended</h4>
              <p className="text-sm dashboard-text-secondary mb-3">
                Your data is stored locally. Regular exports help prevent data loss.
              </p>
              <Button size="sm" variant="outline" onClick={handleExportData}>
                Create Backup Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
