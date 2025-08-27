import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, Trash2, Moon, Sun, Database, User, Building, Palette, Type, Plus, Coins } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTheme } from '@/hooks/useTheme';
import { exportData, importData, clearAllData } from '@/utils/storage';
import { SUPPORTED_CURRENCIES, Currency } from '@/types/business';
import { FONT_OPTIONS, COLOR_PALETTES } from '@/utils/appearance';
import { BusinessManagement } from './BusinessManagement';
import { BusinessSetup } from './BusinessSetup';
import { FontSelector } from './FontSelector';
import { ColorPaletteSelector } from './ColorPaletteSelector';
import { CustomCurrencyModal } from './CustomCurrencyModal';

export const SettingsPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [showCustomCurrencyModal, setShowCustomCurrencyModal] = useState(false);

  if (showBusinessSetup) {
    return (
      <div className="p-6">
        <Button 
          variant="outline" 
          onClick={() => setShowBusinessSetup(false)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <BusinessSetup onComplete={() => setShowBusinessSetup(false)} />
      </div>
    );
  }

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

  const handleCurrencyChange = (currencyCode: string) => {
    const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
    const currency = allCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      dispatch({
        type: 'SET_DEFAULT_CURRENCY',
        payload: currency,
      });
    }
  };

  const handleDeleteCustomCurrency = (currencyCode: string) => {
    if (confirm('Are you sure you want to delete this custom currency?')) {
      dispatch({
        type: 'DELETE_CUSTOM_CURRENCY',
        payload: currencyCode,
      });
    }
  };

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dashboard-text-primary">Settings</h1>
        <p className="dashboard-text-secondary">Manage your preferences and data</p>
      </div>

      <Tabs defaultValue="user" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user">User Settings</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-6 mt-6">
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
                <div className="flex gap-2">
                  <Select
                    value={data.userSettings.defaultCurrency.code}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                        Standard Currencies
                      </div>
                      {SUPPORTED_CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                      {(data.customCurrencies || []).length > 0 && (
                        <>
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground border-t mt-2 pt-2">
                            Custom Currencies
                          </div>
                          {(data.customCurrencies || []).map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCustomCurrencyModal(true)}
                    title="Add Custom Currency"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Currencies Management */}
              {(data.customCurrencies || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Coins className="h-5 w-5" />
                      Custom Currencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(data.customCurrencies || []).map(currency => (
                        <div key={currency.code} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{currency.symbol} {currency.name}</Badge>
                            <span className="text-sm text-muted-foreground">({currency.code})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomCurrency(currency.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          {/* Font Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>Customize the fonts used throughout the application</CardDescription>
            </CardHeader>
            <CardContent>
              <FontSelector
                selectedFont={data.userSettings.fontFamily || FONT_OPTIONS[0]}
                onFontChange={(font) => dispatch({ type: 'SET_FONT', payload: font })}
              />
            </CardContent>
          </Card>

          {/* Color Palette Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>Choose or create a color palette that matches your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPaletteSelector
                selectedPalette={data.userSettings.colorPalette || COLOR_PALETTES[0]}
                onPaletteChange={(palette) => dispatch({ type: 'SET_COLOR_PALETTE', payload: palette })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6 mt-6">
          <BusinessManagement onCreateBusiness={() => setShowBusinessSetup(true)} />
        </TabsContent>

        <TabsContent value="data" className="space-y-6 mt-6">
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
        </TabsContent>
      </Tabs>

      <CustomCurrencyModal
        isOpen={showCustomCurrencyModal}
        onClose={() => setShowCustomCurrencyModal(false)}
        onCurrencyAdded={() => {}}
      />
    </div>
  );
};
