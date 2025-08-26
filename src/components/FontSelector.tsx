import React from 'react';
import { FontOption } from '@/types/business';
import { FONT_OPTIONS } from '@/utils/appearance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface FontSelectorProps {
  selectedFont: FontOption;
  onFontChange: (font: FontOption) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFont,
  onFontChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 dashboard-text-primary">Font Family</h3>
        <p className="text-sm dashboard-text-secondary mb-4">
          Choose a font that reflects your brand personality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FONT_OPTIONS.map((font) => (
          <Card 
            key={font.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedFont.id === font.id 
                ? 'ring-2 ring-primary bg-accent' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onFontChange(font)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium dashboard-text-primary">
                  {font.name}
                </h4>
                {selectedFont.id === font.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              
              {/* Font Preview */}
              <div 
                className="space-y-2"
                style={{ fontFamily: `'${font.family}', sans-serif` }}
              >
                <p className="text-lg font-semibold dashboard-text-primary">
                  The quick brown fox
                </p>
                <p className="text-sm dashboard-text-secondary">
                  jumps over the lazy dog. 1234567890
                </p>
              </div>
              
              <div className="mt-3 pt-3 border-t dashboard-border">
                <p className="text-xs dashboard-text-muted">
                  Weights: {font.weights.join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Preview Section */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-medium mb-4 dashboard-text-primary">Live Preview</h4>
          <div 
            className="space-y-4 p-4 dashboard-surface-elevated rounded-lg"
            style={{ fontFamily: `'${selectedFont.family}', sans-serif` }}
          >
            <h1 className="text-2xl font-bold dashboard-text-primary">
              Dashboard Heading
            </h1>
            <p className="dashboard-text-secondary">
              This is how your regular text will appear throughout the application.
            </p>
            <Button>Sample Button</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};