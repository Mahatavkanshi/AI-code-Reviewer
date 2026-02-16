import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { githubAPI, aiAPI } from '@/lib/api';
import { 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown,
  Loader2,
  Save,
  GitPullRequest,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { CodeDiff } from './CodeDiff';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  children?: FileNode[];
}

interface Repository {
  full_name: string;
  name: string;
}

interface GitHubCodeBrowserProps {
  repo: Repository;
  branch?: string;
}

export function GitHubCodeBrowser({ repo, branch: initialBranch = 'main' }: GitHubCodeBrowserProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState('');
  const [improvedCode, setImprovedCode] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState(initialBranch);

  const [owner, repoName] = repo.full_name.split('/');

  useEffect(() => {
    // Detect default branch first
    const detectBranch = async () => {
      try {
        const branchData = await githubAPI.getDefaultBranch(owner, repoName);
        if (branchData.defaultBranch) {
          setBranch(branchData.defaultBranch);
        }
      } catch (err) {
        console.log('Could not detect default branch, using:', initialBranch);
      }
    };
    detectBranch();
  }, [repo]);

  useEffect(() => {
    if (branch) {
      loadFileTree();
    }
  }, [repo, branch]);

  const loadFileTree = async () => {
    try {
      setIsLoadingTree(true);
      setError('');
      console.log('Loading file tree for:', owner, repoName, branch);
      
      const contents = await githubAPI.getRepoContents(owner, repoName, '', branch);
      console.log('Contents loaded:', contents);
      
      if (Array.isArray(contents)) {
        const sortedContents = contents.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'dir' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        setFileTree(sortedContents);
      } else {
        console.error('Contents is not an array:', contents);
        setError('Failed to load repository structure');
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setIsLoadingTree(false);
    }
  };

  const loadDirectory = async (path: string) => {
    try {
      const contents = await githubAPI.getRepoContents(owner, repoName, path, branch);
      if (Array.isArray(contents)) {
        return contents.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'dir' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }
      return [];
    } catch (error) {
      console.error('Error loading directory:', error);
      return [];
    }
  };

  const toggleDir = async (node: FileNode) => {
    const newExpanded = new Set(expandedDirs);
    
    if (newExpanded.has(node.path)) {
      newExpanded.delete(node.path);
    } else {
      newExpanded.add(node.path);
      // Load children if not already loaded
      if (!node.children) {
        const children = await loadDirectory(node.path);
        
        // Update the tree with loaded children
        const updateTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(n => {
            if (n.path === node.path) {
              return { ...n, children };
            }
            if (n.children) {
              return { ...n, children: updateTree(n.children) };
            }
            return n;
          });
        };
        
        setFileTree(prev => updateTree(prev));
      }
    }
    
    setExpandedDirs(newExpanded);
  };

  const selectFile = async (file: FileNode) => {
    if (file.type !== 'file') return;
    
    try {
      setIsLoadingFile(true);
      setSelectedFile(file);
      setReview('');
      setImprovedCode('');
      
      console.log('Loading file:', file.path);
      const content = await githubAPI.getFileContent(owner, repoName, file.path, branch);
      console.log('File loaded, size:', content.content.length);
      
      setFileContent(content.content);
      setOriginalContent(content.content);
    } catch (error) {
      console.error('Error loading file:', error);
      setError('Failed to load file content');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const reviewFile = async () => {
    if (!fileContent || !selectedFile) return;
    
    try {
      setIsReviewing(true);
      const language = getLanguageFromFile(selectedFile.name);
      
      const result = await aiAPI.getReview({ 
        code: fileContent, 
        language 
      });
      
      if (result.review && typeof result.review === 'object') {
        setReview(result.review.review || result.review);
        setImprovedCode(result.review.improvedCode || fileContent);
      } else {
        setReview(result.review || result);
        setImprovedCode(fileContent);
      }
    } catch (error) {
      console.error('Error reviewing file:', error);
      setError('Failed to review file');
    } finally {
      setIsReviewing(false);
    }
  };

  const applyFix = () => {
    if (improvedCode) {
      setFileContent(improvedCode);
    }
  };

  const commitChanges = async () => {
    if (!selectedFile || !commitMessage) return;
    
    try {
      setIsCommitting(true);
      
      // Create a new branch
      const newBranchName = `ai-fix-${Date.now()}`;
      await githubAPI.createBranch(owner, repoName, newBranchName, branch);
      
      // Get current file SHA
      const fileData = await githubAPI.getFileContent(owner, repoName, selectedFile.path, branch);
      
      // Update the file
      await githubAPI.updateFile(
        owner,
        repoName,
        selectedFile.path,
        fileContent,
        commitMessage,
        newBranchName,
        fileData.sha
      );
      
      // Create pull request
      await githubAPI.createPullRequest(
        owner,
        repoName,
        prTitle || `AI Code Review: Fix ${selectedFile.name}`,
        prDescription || `Automated code improvements for ${selectedFile.path}`,
        newBranchName,
        branch
      );
      
      setCommitSuccess(true);
      setTimeout(() => {
        setShowCommitDialog(false);
        setCommitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error committing changes:', error);
      alert('Failed to commit changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCommitting(false);
    }
  };

  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
    };
    return langMap[ext || ''] || 'javascript';
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        <button
          onClick={() => node.type === 'dir' ? toggleDir(node) : selectFile(node)}
          className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors ${
            selectedFile?.path === node.path ? 'bg-muted font-medium' : ''
          }`}
        >
          {node.type === 'dir' ? (
            <>
              {expandedDirs.has(node.path) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            </>
          ) : (
            <>
              <span className="w-4 flex-shrink-0" />
              <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </>
          )}
          <span className="truncate text-sm">{node.name}</span>
        </button>
        
        {node.type === 'dir' && expandedDirs.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        {/* File Tree Sidebar */}
        <Card className="lg:w-72 flex-shrink-0 flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Files</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({branch})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFileTree}
                disabled={isLoadingTree}
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingTree ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-2 overflow-y-auto flex-1">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoadingTree ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fileTree.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <p>No files found</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadFileTree}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              renderFileTree(fileTree)
            )}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Code Editor */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Select a file'}
              </CardTitle>
              
              {selectedFile && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={reviewFile}
                    disabled={isReviewing || isLoadingFile}
                  >
                    {isReviewing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : null}
                    🤖 AI Review
                  </Button>
                  
                  {fileContent !== originalContent && (
                    <Button
                      size="sm"
                      onClick={() => setShowCommitDialog(true)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Commit
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {isLoadingFile ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedFile ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-muted/50"
                  spellCheck={false}
                  placeholder="File content will appear here..."
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileCode className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-center max-w-xs">
                    Select a file from the tree on the left to view and edit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Review Panel */}
          {review && (
            <Card className="lg:w-96 flex-shrink-0 flex flex-col">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">AI Review</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap font-mono text-xs bg-muted p-3 rounded border">
                      {review}
                    </div>
                  </div>
                  
                  {improvedCode && improvedCode !== fileContent && (
                    <Button
                      onClick={applyFix}
                      className="w-full"
                      size="sm"
                    >
                      ✨ Apply AI Fix
                    </Button>
                  )}
                  
                  {improvedCode && (
                    <CodeDiff
                      oldCode={originalContent}
                      newCode={improvedCode}
                      onApplyFix={applyFix}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Commit Dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription>
              This will create a new branch and open a pull request with your changes.
            </DialogDescription>
          </DialogHeader>
          
          {commitSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Pull Request Created!</p>
              <p className="text-muted-foreground">Your changes have been submitted for review.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message *</label>
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., Fix code quality issues in server.js"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pull Request Title</label>
                  <Input
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder={`AI Code Review: Fix ${selectedFile?.name}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pull Request Description</label>
                  <Textarea
                    value={prDescription}
                    onChange={(e) => setPrDescription(e.target.value)}
                    placeholder="Describe the changes made by AI review..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCommitDialog(false)}
                  disabled={isCommitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={commitChanges}
                  disabled={!commitMessage || isCommitting}
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Create Pull Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
