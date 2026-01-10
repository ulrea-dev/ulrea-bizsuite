import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useBusiness } from '@/contexts/BusinessContext';

interface MobileHeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, actions }) => {
  const { toggleSidebar } = useSidebar();
  const { currentBusiness } = useBusiness();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex flex-col">
          {title && <span className="font-semibold text-sm truncate max-w-[180px]">{title}</span>}
          {currentBusiness && !title && (
            <span className="font-semibold text-sm truncate max-w-[180px]">{currentBusiness.name}</span>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
};
