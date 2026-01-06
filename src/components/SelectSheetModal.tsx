import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SpreadsheetInfo } from '@/types/googleDrive';
import { googleDriveService } from '@/services/googleDriveService';
import { format } from 'date-fns';
import { FileSpreadsheet, Loader2, Search, Link as LinkIcon } from 'lucide-react';

interface SelectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sheet: SpreadsheetInfo) => void;
}

export const SelectSheetModal: React.FC<SelectSheetModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [sheets, setSheets] = useState<SpreadsheetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSheets();
    }
  }, [isOpen]);

  const loadSheets = async () => {
    setIsLoading(true);
    try {
      const list = await googleDriveService.listSpreadsheets();
      setSheets(list);
    } catch (error) {
      console.error('Failed to load sheets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSheets = sheets.filter(sheet =>
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (sheet: SpreadsheetInfo) => {
    onSelect(sheet);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Spreadsheet</DialogTitle>
          <DialogDescription>
            Choose an existing BizSuite spreadsheet to connect for real-time sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spreadsheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sheets.length === 0 ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto opacity-50" />
                  <p>No spreadsheets found in your BizSuite Sheets folder.</p>
                  <p className="text-sm">Create a new export first to get started.</p>
                </div>
              ) : (
                <p>No spreadsheets match your search.</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {filteredSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileSpreadsheet className="h-5 w-5 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{sheet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(sheet.createdTime), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelect(sheet)}
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
