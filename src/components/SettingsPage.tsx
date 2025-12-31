
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBusiness } from '@/contexts/BusinessContext';
import { CustomCurrencyModal } from '@/components/CustomCurrencyModal';
import { ColorPaletteSelector } from '@/components/ColorPaletteSelector';
import { FontSelector } from '@/components/FontSelector';
import { SalarySettings } from '@/components/SalarySettings';
import { SUPPORTED_CURRENCIES, Currency, FontOption, ColorPalette } from '@/types/business';
import { getDefaultFont, getDefaultColorPalette } from '@/utils/appearance';
import { Plus } from 'lucide-react';
import { PartnersPage } from './PartnersPage';
import { BusinessManagement } from './BusinessManagement';

export const SettingsPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();
  const [showCustomCurrencyModal, setShowCustomCurrencyModal] = useState(false);
  const [username, setUsername] = useState(data.userSettings.username);
  const [selectedFont, setSelectedFont] = useState<FontOption>(
    data.userSettings.fontFamily || getDefaultFont()
  );
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(
    data.userSettings.colorPalette || getDefaultColorPalette()
  );

  const allCurrencies = SUPPORTED_CURRENCIES.concat(data.customCurrencies || []);

  const handleUsernameChange = () => {
    dispatch({ type: 'SET_USERNAME', payload: username });
    toast({
      title: "Success",
      description: "Username updated successfully.",
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.className = theme;
    toast({
      title: "Success",
      description: `Theme changed to ${theme}.`,
    });
  };

  const handleDefaultCurrencyChange = (currencyCode: string) => {
    const currency = allCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      dispatch({ type: 'SET_DEFAULT_CURRENCY', payload: currency });
      toast({
        title: "Success",
        description: `Default currency changed to ${currency.name}.`,
      });
    }
  };

  const handleDeleteCustomCurrency = (currencyCode: string) => {
    if (data.userSettings.defaultCurrency.code === currencyCode) {
      toast({
        title: "Error",
        description: "Cannot delete the default currency. Please change your default currency first.",
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'DELETE_CUSTOM_CURRENCY', payload: currencyCode });
    toast({
      title: "Success",
      description: "Custom currency deleted successfully.",
    });
  };

  const handleFontChange = (font: FontOption) => {
    setSelectedFont(font);
    dispatch({ type: 'SET_FONT', payload: font });
    toast({
      title: "Success",
      description: `Font changed to ${font.name}.`,
    });
  };

  const handlePaletteChange = (palette: ColorPalette) => {
    setSelectedPalette(palette);
    dispatch({ type: 'SET_COLOR_PALETTE', payload: palette });
    toast({
      title: "Success",
      description: `Color palette changed to ${palette.name}.`,
    });
  };

  const handleCurrencyAdded = (currency: Currency) => {
    // The dispatch is already handled in the modal
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Display Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <Button onClick={handleUsernameChange}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how BizSuite looks.
              </CardDescription>
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

          <FontSelector
            selectedFont={selectedFont}
            onFontChange={handleFontChange}
          />
          <ColorPaletteSelector
            selectedPalette={selectedPalette}
            onPaletteChange={handlePaletteChange}
          />

          {/* Partners Section */}
          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
              <CardDescription>
                Manage your sales and managing partners across businesses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartnersPage />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-4">
          <BusinessManagement onCreateBusiness={() => {}} />
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Currency</CardTitle>
              <CardDescription>
                Choose your default currency for all financial calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="default-currency">Default Currency</Label>
                <Select
                  value={data.userSettings.defaultCurrency.code}
                  onValueChange={handleDefaultCurrencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                        {currency.isCustom && ' (Custom)'}
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
              <CardDescription>
                Add custom currencies that are not in our supported list.
              </CardDescription>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomCurrency(currency.code)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <SalarySettings />
        </TabsContent>
      </Tabs>

      <CustomCurrencyModal
        isOpen={showCustomCurrencyModal}
        onClose={() => setShowCustomCurrencyModal(false)}
        onCurrencyAdded={handleCurrencyAdded}
      />
    </div>
  );
};
