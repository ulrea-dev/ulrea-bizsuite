import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, actions, showBack, backTo }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-12 px-4 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center gap-1 min-w-[40px]">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-1"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      <span className="font-semibold text-sm truncate max-w-[200px] text-center absolute left-1/2 -translate-x-1/2">
        {title || ''}
      </span>
      <div className="flex items-center gap-1 min-w-[40px] justify-end">
        {actions}
      </div>
    </header>
  );
};
