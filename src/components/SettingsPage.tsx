import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { CustomCurrencyModal } from '@/components/CustomCurrencyModal';
import { ColorPaletteSelector } from '@/components/ColorPaletteSelector';
import { FontSelector } from '@/components/FontSelector';
import { SalarySettings } from '@/components/SalarySettings';
import { BackupSettingsCard } from '@/components/BackupSettingsCard';
import { GoogleSheetsConnectionCard } from '@/components/GoogleSheetsConnectionCard';
import { RestoreFromDriveModal } from '@/components/RestoreFromDriveModal';
import { ShareAccessModal } from '@/components/ShareAccessModal';
import { SUPPORTED_CURRENCIES, Currency, FontOption, ColorPalette } from '@/types/business';
import { getDefaultFont, getDefaultColorPalette } from '@/utils/appearance';
import { Plus, RotateCcw, Users, ArrowUpRight, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const SettingsPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const { isConnected } = useGoogleDrive();
  const { toast } = useToast();
  const [showCustomCurrencyModal, setShowCustomCurrencyModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [username, setUsername] = useState(data.userSettings.username);
  const [accountName, setAccountName] = useState(data.userSettings.accountName || '');
  const [selectedFont, setSelectedFont] = useState<FontOption>(
    data.userSettings.fontFamily || getDefaultFont()
  );
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(
    data.userSettings.colorPalette || getDefaultColorPalette()
  );

  // Security / Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const allCurrencies = SUPPORTED_CURRENCIES.concat(data.customCurrencies || []);

  const handleUsernameChange = () => {
    dispatch({ type: 'SET_USERNAME', payload: username });
    toast({ title: "Saved", description: "Display name updated." });
  };

  const handleAccountNameChange = () => {
    dispatch({ type: 'SET_ACCOUNT_NAME', payload: accountName });
    toast({ title: "Saved", description: "Account name updated." });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.className = theme;
    toast({ title: "Saved", description: `Theme changed to ${theme}.` });
  };

  const handleDefaultCurrencyChange = (currencyCode: string) => {
    const currency = allCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      dispatch({ type: 'SET_DEFAULT_CURRENCY', payload: currency });
      toast({ title: "Saved", description: `Default currency changed to ${currency.name}.` });
    }
  };

  const handleDeleteCustomCurrency = (currencyCode: string) => {
    if (data.userSettings.defaultCurrency.code === currencyCode) {
      toast({ title: "Error", description: "Cannot delete the default currency.", variant: "destructive" });
      return;
    }
    dispatch({ type: 'DELETE_CUSTOM_CURRENCY', payload: currencyCode });
    toast({ title: "Deleted", description: "Custom currency removed." });
  };

  const handleFontChange = (font: FontOption) => {
    setSelectedFont(font);
    dispatch({ type: 'SET_FONT', payload: font });
    toast({ title: "Saved", description: `Font changed to ${font.name}.` });
  };

  const handlePaletteChange = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    dispatch({ type: 'SET_COLOR_PALETTE', payload: palette });
    toast({ title: "Saved", description: `Color palette changed to ${palette.name}.` });
  };

  const handleCurrencyAdded = (_currency: Currency) => {};

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto sm:grid sm:grid-cols-5">
            <TabsTrigger value="account" className="text-xs sm:text-sm">Account</TabsTrigger>
            <TabsTrigger value="backup" className="text-xs sm:text-sm">Backup</TabsTrigger>
            <TabsTrigger value="currency" className="text-xs sm:text-sm">Currency</TabsTrigger>
            <TabsTrigger value="service-types" className="text-xs sm:text-sm">Service Types</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm">Advanced</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="space-y-4">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <p className="text-xs text-muted-foreground">The name of this workspace, visible to all users.</p>
                <div className="flex space-x-2">
                  <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. My Company" />
                  <Button onClick={handleAccountNameChange}>Save</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Display Name</Label>
                <p className="text-xs text-muted-foreground">Your personal name shown to other users in this workspace.</p>
                <div className="flex space-x-2">
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your name" />
                  <Button onClick={handleUsernameChange}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how WorkOS looks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={data.userSettings.theme === 'dark'}
                  onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode">Dark mode</Label>
              </div>
            </CardContent>
          </Card>

          <FontSelector selectedFont={selectedFont} onFontChange={handleFontChange} />
          <ColorPaletteSelector selectedPalette={selectedPalette} onPaletteChange={handlePaletteChange} />

          {/* Partners — link to Back Office */}
          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
              <CardDescription>
                Partner management has moved to Back Office for better organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link to="/business-management/partners" className="flex items-center gap-2">
                  Manage Partners in Back Office
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <BackupSettingsCard />
          <GoogleSheetsConnectionCard />
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sharing & Collaboration
                </CardTitle>
                <CardDescription>Share your data with team members via Google Drive and Sheets.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowShareModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Sharing
                </Button>
              </CardContent>
            </Card>
          )}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Restore from Google Drive</CardTitle>
                <CardDescription>Restore your data from a previous backup stored in Google Drive.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setShowRestoreModal(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Browse Backups
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Currency</CardTitle>
              <CardDescription>Choose your default currency for all financial calculations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="default-currency">Default Currency</Label>
                <Select value={data.userSettings.defaultCurrency.code} onValueChange={handleDefaultCurrencyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}{currency.isCustom && ' (Custom)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Custom Currencies</CardTitle>
              <CardDescription>Add currencies not in our supported list.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowCustomCurrencyModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Currency
              </Button>
              {data.customCurrencies && data.customCurrencies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Custom Currencies</h4>
                  {data.customCurrencies.map((currency) => (
                    <div key={currency.code} className="flex items-center justify-between p-2 border rounded">
                      <span>{currency.symbol} {currency.code} - {currency.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomCurrency(currency.code)}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Types</CardTitle>
              <CardDescription>
                Service Types have moved to Works for better organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link to="/works/service-types" className="flex items-center gap-2">
                  Manage Service Types in Works
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <SalarySettings />
        </TabsContent>
      </Tabs>

      <CustomCurrencyModal isOpen={showCustomCurrencyModal} onClose={() => setShowCustomCurrencyModal(false)} onCurrencyAdded={handleCurrencyAdded} />
      <RestoreFromDriveModal isOpen={showRestoreModal} onClose={() => setShowRestoreModal(false)} />
      <ShareAccessModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
};
