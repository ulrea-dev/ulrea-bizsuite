import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SubNavItem {
  label: string;
  path: string;
}

interface MobileSubNavProps {
  items: SubNavItem[];
}

export const MobileSubNav: React.FC<MobileSubNavProps> = ({ items }) => {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const isActive = (path: string) => {
    if (path === '/business-management' || path === '/todos') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Auto-scroll active item into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      
      const scrollLeft = active.offsetLeft - containerRect.width / 2 + activeRect.width / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div
      ref={scrollRef}
      className="sticky top-12 z-30 flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:hidden"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            ref={active ? activeRef : undefined}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors shrink-0',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
