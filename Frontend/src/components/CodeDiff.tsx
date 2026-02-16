import { diffLines, type Change } from 'diff';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, GitCompare, Copy, CheckCircle, Wand2, AlertTriangle } from 'lucide-react';

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  onApplyFix?: (fixedCode: string) => void;
}

export function CodeDiff({ oldCode, newCode, onApplyFix }: CodeDiffProps) {
  const [activeView, setActiveView] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const diff = diffLines(oldCode, newCode);
  
  // Calculate stats
  const addedLines = diff.filter(part => part.added).reduce((sum, part) => sum + part.value.split('\n').length - 1, 0);
  const removedLines = diff.filter(part => part.removed).reduce((sum, part) => sum + part.value.split('\n').length - 1, 0);
  const hasChanges = addedLines > 0 || removedLines > 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(newCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyFix = () => {
    setIsApplying(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      if (onApplyFix) {
        onApplyFix(newCode);
      }
      setFixApplied(true);
      setIsApplying(false);
      setShowConfirmDialog(false);
      
      // Reset the "applied" state after 3 seconds
      setTimeout(() => setFixApplied(false), 3000);
    }, 500);
  };

  const renderSplitView = () => {
    let oldLineNum = 1;
    let newLineNum = 1;

    return (
      <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
        {/* Left side - Old Code */}
        <div className="border-r">
          <div className="bg-muted px-4 py-2 text-sm font-medium border-b flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            Original Code
          </div>
          <div className="overflow-x-auto">
            <pre className="text-sm font-mono">
              {diff.map((part: Change, index: number) => {
                if (part.added) return null;
                const lines = part.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || part.value.endsWith('\n'));
                const startLine = oldLineNum;
                oldLineNum += lines.length;
                
                return (
                  <div key={`old-${index}`}>
                    {lines.map((line, lineIndex) => (
                      <div
                        key={`old-${index}-${lineIndex}`}
                        className={`flex ${part.removed ? 'bg-red-100 dark:bg-red-900/30' : ''}`}
                      >
                        <span className="w-12 text-right pr-2 text-muted-foreground text-xs select-none border-r border-border py-0.5">
                          {startLine + lineIndex}
                        </span>
                        <span className="pl-2 py-0.5 whitespace-pre">
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Right side - New Code */}
        <div>
          <div className="bg-muted px-4 py-2 text-sm font-medium border-b flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Improved Code
          </div>
          <div className="overflow-x-auto">
            <pre className="text-sm font-mono">
              {diff.map((part: Change, index: number) => {
                if (part.removed) return null;
                const lines = part.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || part.value.endsWith('\n'));
                const startLine = newLineNum;
                newLineNum += lines.length;
                
                return (
                  <div key={`new-${index}`}>
                    {lines.map((line, lineIndex) => (
                      <div
                        key={`new-${index}-${lineIndex}`}
                        className={`flex ${part.added ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                      >
                        <span className="w-12 text-right pr-2 text-muted-foreground text-xs select-none border-r border-border py-0.5">
                          {startLine + lineIndex}
                        </span>
                        <span className="pl-2 py-0.5 whitespace-pre">
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const renderUnifiedView = () => {
    let oldLineNum = 1;
    let newLineNum = 1;

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 text-sm font-medium border-b flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          Changes
        </div>
        <div className="overflow-x-auto">
          <pre className="text-sm font-mono">
            {diff.map((part: Change, index: number) => {
              const lines = part.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || part.value.endsWith('\n'));
              const isAdded = part.added;
              const isRemoved = part.removed;
              
              return (
                <div key={`unified-${index}`}>
                  {lines.map((line, lineIndex) => {
                    const bgClass = isAdded 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : isRemoved 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : '';
                    
                    const prefix = isAdded ? '+' : isRemoved ? '-' : ' ';
                    
                    return (
                      <div
                        key={`unified-${index}-${lineIndex}`}
                        className={`flex ${bgClass}`}
                      >
                        <span className="w-8 text-center text-muted-foreground text-xs select-none border-r border-border py-0.5">
                          {prefix}
                        </span>
                        <span className="w-12 text-right pr-2 text-muted-foreground text-xs select-none border-r border-border py-0.5">
                          {isRemoved ? oldLineNum++ : isAdded ? '' : oldLineNum++}
                        </span>
                        <span className="w-12 text-right pr-2 text-muted-foreground text-xs select-none border-r border-border py-0.5">
                          {isAdded ? newLineNum++ : isRemoved ? '' : newLineNum++}
                        </span>
                        <span className="pl-2 py-0.5 whitespace-pre">
                          {line || ' '}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Code Comparison
              </CardTitle>
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    -{removedLines} lines
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    +{addedLines} lines
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'split' | 'unified')}>
                <TabsList className="h-8">
                  <TabsTrigger value="split" className="text-xs px-3">
                    Split
                  </TabsTrigger>
                  <TabsTrigger value="unified" className="text-xs px-3">
                    Unified
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="h-8"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Apply Fix Button */}
          {hasChanges && onApplyFix && (
            <div className="mt-3 pt-3 border-t">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full"
                variant={fixApplied ? "outline" : "default"}
                disabled={fixApplied || isApplying}
              >
                {isApplying ? (
                  <>🔄 Applying...</>
                ) : fixApplied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ✅ Fix Applied Successfully!
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    ✨ Apply All Fixes ({removedLines + addedLines} changes)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {activeView === 'split' ? renderSplitView() : renderUnifiedView()}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Apply Code Changes?
            </DialogTitle>
            <DialogDescription>
              This will replace your current code with the AI-improved version.
              <br />
              <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Changes to apply:</span>
              </div>
              <div className="flex gap-4">
                <span className="text-red-600 dark:text-red-400">
                  ❌ {removedLines} lines removed
                </span>
                <span className="text-green-600 dark:text-green-400">
                  ✨ {addedLines} lines added
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFix}
              disabled={isApplying}
            >
              {isApplying ? (
                <>🔄 Applying...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Yes, Apply Fixes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
