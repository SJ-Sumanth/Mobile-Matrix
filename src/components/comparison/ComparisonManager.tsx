import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  History, 
  Bookmark, 
  Share2, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';
import { 
  ComparisonResult, 
  MultiPhoneComparison, 
  SavedComparison, 
  ComparisonHistoryEntry 
} from '@/types/comparison';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils';
import { comparisonManager } from '@/services/comparisonManager';

interface ComparisonManagerProps {
  currentComparison?: ComparisonResult | MultiPhoneComparison;
  onStartNewComparison: () => void;
  onLoadComparison: (comparison: ComparisonResult | MultiPhoneComparison) => void;
  onModifySelection: (phoneIndex: number) => void;
  className?: string;
}

export const ComparisonManager: React.FC<ComparisonManagerProps> = ({
  currentComparison,
  onStartNewComparison,
  onLoadComparison,
  onModifySelection,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'saved'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryEntry[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);

  useEffect(() => {
    // Load comparison history and saved comparisons
    setComparisonHistory(comparisonManager.getComparisonHistory());
    setSavedComparisons(comparisonManager.getSavedComparisons());
  }, []);

  const handleSaveComparison = async () => {
    if (!currentComparison) return;

    try {
      const saved = await comparisonManager.saveComparison(
        currentComparison,
        saveTitle || undefined
      );
      setSavedComparisons(prev => [saved, ...prev]);
      setShowSaveModal(false);
      setSaveTitle('');
    } catch (error) {
      console.error('Failed to save comparison:', error);
    }
  };

  const handleDeleteSaved = (comparisonId: string) => {
    const success = comparisonManager.deleteSavedComparison(comparisonId);
    if (success) {
      setSavedComparisons(prev => prev.filter(comp => comp.id !== comparisonId));
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'copy') => {
    if (!currentComparison) return;

    try {
      if (platform === 'copy') {
        await comparisonManager.copyComparisonLink(currentComparison);
        // Show toast notification
      } else {
        const shareUrl = await comparisonManager.shareToSocialMedia(currentComparison, platform);
        window.open(shareUrl, '_blank');
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to share comparison:', error);
    }
  };

  const filteredSavedComparisons = searchQuery
    ? comparisonManager.searchSavedComparisons(searchQuery)
    : savedComparisons;

  const filteredHistory = searchQuery
    ? comparisonHistory.filter(entry =>
        entry.phoneNames.some(name => 
          name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : comparisonHistory;

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header with tabs and actions */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Comparison Manager</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onStartNewComparison}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Comparison
              </Button>
              {currentComparison && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveModal(true)}
                    leftIcon={<Bookmark className="w-4 h-4" />}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex gap-1 mt-4">
            {[
              { key: 'current', label: 'Current', icon: Edit3 },
              { key: 'history', label: 'History', icon: History },
              { key: 'saved', label: 'Saved', icon: Bookmark },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(key as any)}
                leftIcon={<Icon className="w-4 h-4" />}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>   
   {/* Content based on active tab */}
      <Card variant="elevated">
        <CardContent className="p-6">
          {activeTab === 'current' && (
            <CurrentComparisonTab
              comparison={currentComparison}
              onModifySelection={onModifySelection}
            />
          )}
          
          {activeTab === 'history' && (
            <HistoryTab
              history={filteredHistory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onLoadComparison={onLoadComparison}
            />
          )}
          
          {activeTab === 'saved' && (
            <SavedTab
              savedComparisons={filteredSavedComparisons}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onLoadComparison={onLoadComparison}
              onDeleteSaved={handleDeleteSaved}
            />
          )}
        </CardContent>
      </Card>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Comparison"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Comparison Title (Optional)
            </label>
            <Input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Enter a title for this comparison"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveComparison}
            >
              Save Comparison
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Comparison"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">
            Share this comparison with others
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleShare('copy')}
              className="justify-start"
            >
              Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
              className="justify-start"
            >
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
              className="justify-start"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
              className="justify-start"
            >
              WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Current Comparison Tab Component
interface CurrentComparisonTabProps {
  comparison?: ComparisonResult | MultiPhoneComparison;
  onModifySelection: (phoneIndex: number) => void;
}

const CurrentComparisonTab: React.FC<CurrentComparisonTabProps> = ({
  comparison,
  onModifySelection,
}) => {
  if (!comparison) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground/60">No active comparison</p>
        <p className="text-sm text-foreground/40 mt-2">
          Start a new comparison to see options here
        </p>
      </div>
    );
  }

  const phones = 'phones' in comparison ? comparison.phones : [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Current Comparison</h3>
      <div className="grid gap-4">
        {phones.map((phone, index) => (
          <div
            key={phone.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg"
          >
            <div>
              <h4 className="font-medium">{phone.brand} {phone.model}</h4>
              <p className="text-sm text-foreground/60">{phone.variant || 'Base variant'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onModifySelection(index)}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Change
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// History Tab Component
interface HistoryTabProps {
  history: ComparisonHistoryEntry[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLoadComparison: (comparison: ComparisonResult | MultiPhoneComparison) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  searchQuery,
  onSearchChange,
  onLoadComparison,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comparison History</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search history..."
            className="pl-10 w-64"
          />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/60">No comparison history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div>
                <h4 className="font-medium">
                  {entry.phoneNames.join(' vs ') || `${entry.phoneIds.length} phones`}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" size="sm">
                    {entry.comparisonType}
                  </Badge>
                  <span className="text-sm text-foreground/60">
                    {entry.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Load
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Saved Tab Component
interface SavedTabProps {
  savedComparisons: SavedComparison[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLoadComparison: (comparison: ComparisonResult | MultiPhoneComparison) => void;
  onDeleteSaved: (comparisonId: string) => void;
}

const SavedTab: React.FC<SavedTabProps> = ({
  savedComparisons,
  searchQuery,
  onSearchChange,
  onLoadComparison,
  onDeleteSaved,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Comparisons</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search saved..."
            className="pl-10 w-64"
          />
        </div>
      </div>

      {savedComparisons.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/60">No saved comparisons</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedComparisons.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium">{saved.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {saved.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-sm text-foreground/60">
                    {saved.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadComparison(saved.result)}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Load
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteSaved(saved.id)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  className="text-error hover:text-error"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonManager;