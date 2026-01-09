// Partner-specific Google Sheets export modal
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Partner } from '@/types/business';
import { PartnerSheet } from '@/types/googleDrive';
import { formatDistanceToNow } from 'date-fns';
import {
  FileSpreadsheet,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  User,
} from 'lucide-react';

interface PartnerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerSheetModal: React.FC<PartnerSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data } = useBusiness();
  const {
    settings,
    createPartnerSheet,
    syncPartnerSheet,
    disconnectPartnerSheet,
    setPartnerSheetAutoSync,
    isSyncingPartnerSheet,
  } = useGoogleDrive();

  const [creatingForPartnerId, setCreatingForPartnerId] = useState<string | null>(null);
  const [syncingPartnerId, setSyncingPartnerId] = useState<string | null>(null);

  // Get partners with business associations
  const partners = (data.partners || []).filter(p => (p.businessIds || []).length > 0);

  const getPartnerSheet = (partnerId: string): PartnerSheet | undefined => {
    return (settings.partnerSheets || []).find(ps => ps.partnerId === partnerId);
  };

  const handleCreateSheet = async (partner: Partner) => {
    setCreatingForPartnerId(partner.id);
    try {
      await createPartnerSheet(partner.id, partner.businessIds || [], data);
    } finally {
      setCreatingForPartnerId(null);
    }
  };

  const handleSyncSheet = async (partnerId: string) => {
    setSyncingPartnerId(partnerId);
    try {
      await syncPartnerSheet(partnerId, data);
    } finally {
      setSyncingPartnerId(null);
    }
  };

  const getBusinessNames = (businessIds: string[]): string => {
    return businessIds
      .map(id => data.businesses?.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'No businesses';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Partner Report Sheets
          </DialogTitle>
          <DialogDescription>
            Create dedicated spreadsheets for partners that only show data from their associated businesses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No partners with business associations found.</p>
              <p className="text-sm mt-1">
                Assign partners to businesses in the Partners page first.
              </p>
            </div>
          ) : (
            partners.map(partner => {
              const partnerSheet = getPartnerSheet(partner.id);
              const isCreating = creatingForPartnerId === partner.id;
              const isSyncing = syncingPartnerId === partner.id || isSyncingPartnerSheet === partner.id;

              return (
                <div
                  key={partner.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Partner Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{partner.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded capitalize">
                          {partner.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Businesses: {getBusinessNames(partner.businessIds || [])}
                      </p>
                    </div>
                  </div>

                  {/* Sheet Status & Actions */}
                  {partnerSheet ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">
                          {partnerSheet.lastSyncedAt
                            ? `Last synced ${formatDistanceToNow(new Date(partnerSheet.lastSyncedAt), { addSuffix: true })}`
                            : 'Created, not synced yet'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(partnerSheet.spreadsheetUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Sheet
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncSheet(partner.id)}
                          disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Sync Now
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectPartnerSheet(partner.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Switch
                          id={`auto-sync-${partner.id}`}
                          checked={partnerSheet.autoSyncEnabled}
                          onCheckedChange={(enabled) =>
                            setPartnerSheetAutoSync(partner.id, enabled)
                          }
                        />
                        <Label htmlFor={`auto-sync-${partner.id}`} className="text-sm">
                          Auto-sync when data changes
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCreateSheet(partner)}
                      disabled={isCreating}
                      size="sm"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Create Report Sheet
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
