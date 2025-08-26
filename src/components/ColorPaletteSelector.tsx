import React, { useState } from 'react';
import { ColorPalette } from '@/types/business';
import { COLOR_PALETTES, validateColorPalette } from '@/utils/appearance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Palette, Plus, AlertTriangle } from 'lucide-react';
import { generateId } from '@/utils/storage';

interface ColorPaletteSelectorProps {
  selectedPalette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
}

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  selectedPalette,
  onPaletteChange,
}) => {
  const [customPalette, setCustomPalette] = useState<ColorPalette>({
    id: 'custom',
    name: 'Custom Palette',
    type: 'custom',
    colors: { ...selectedPalette.colors }
  });

  const handleCustomColorChange = (colorKey: keyof ColorPalette['colors'], value: string) => {
    const updated = {
      ...customPalette,
      colors: {
        ...customPalette.colors,
        [colorKey]: value
      }
    };
    setCustomPalette(updated);
  };

  const applyCustomPalette = () => {
    const validation = validateColorPalette(customPalette);
    if (validation.isValid) {
      onPaletteChange({ ...customPalette, id: generateId() });
    }
  };

  const ColorPreview: React.FC<{ palette: ColorPalette }> = ({ palette }) => (
    <div className="grid grid-cols-4 gap-1 h-20 rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-center text-xs font-medium"
        style={{ 
          backgroundColor: `hsl(${palette.colors.primary})`,
          color: `hsl(${palette.colors.primaryForeground})`
        }}
      >
        Primary
      </div>
      <div 
        className="flex items-center justify-center text-xs"
        style={{ 
          backgroundColor: `hsl(${palette.colors.secondary})`,
          color: `hsl(${palette.colors.secondaryForeground})`
        }}
      >
        Secondary
      </div>
      <div 
        className="flex items-center justify-center text-xs"
        style={{ 
          backgroundColor: `hsl(${palette.colors.accent})`,
          color: `hsl(${palette.colors.accentForeground})`
        }}
      >
        Accent
      </div>
      <div 
        className="flex items-center justify-center text-xs"
        style={{ 
          backgroundColor: `hsl(${palette.colors.muted})`,
          color: `hsl(${palette.colors.mutedForeground})`
        }}
      >
        Muted
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 dashboard-text-primary">Color Palette</h3>
        <p className="text-sm dashboard-text-secondary">
          Choose colors that match your brand and ensure good accessibility
        </p>
      </div>

      <Tabs defaultValue="predefined" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined">Predefined Palettes</TabsTrigger>
          <TabsTrigger value="custom">Custom Palette</TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COLOR_PALETTES.map((palette) => (
              <Card 
                key={palette.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPalette.id === palette.id 
                    ? 'ring-2 ring-primary bg-accent' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onPaletteChange(palette)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <h4 className="font-medium dashboard-text-primary">
                        {palette.name}
                      </h4>
                    </div>
                    {selectedPalette.id === palette.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  <ColorPreview palette={palette} />
                  
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {palette.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Custom Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(customPalette.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        value={value}
                        onChange={(e) => handleCustomColorChange(key as keyof ColorPalette['colors'], e.target.value)}
                        placeholder="e.g., 221 83% 53%"
                        className="font-mono text-sm"
                      />
                      <div 
                        className="w-10 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: `hsl(${value})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {(() => {
                const validation = validateColorPalette(customPalette);
                return validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                );
              })()}

              <div className="flex gap-2">
                <Button onClick={applyCustomPalette} className="flex-1">
                  Apply Custom Palette
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4 dashboard-text-primary">Live Preview</h4>
          <div className="space-y-4">
            <ColorPreview palette={selectedPalette} />
            
            <div className="p-4 rounded-lg border dashboard-border">
              <div className="space-y-3">
                <h5 className="font-semibold dashboard-text-primary">Sample UI Elements</h5>
                <div className="flex gap-2">
                  <Button size="sm">Primary Button</Button>
                  <Button size="sm" variant="secondary">Secondary</Button>
                  <Button size="sm" variant="outline">Outline</Button>
                </div>
                <p className="text-sm dashboard-text-secondary">
                  This is how your selected palette will look in the application interface.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};