import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aiAPI } from '@/lib/api';
import { 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown,
  Loader2,
  FolderOpen,
  AlertCircle,
  X
} from 'lucide-react';
import { CodeDiff } from './CodeDiff';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocalFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: LocalFileNode[];
  content?: string;
  file?: File | FileSystemFileHandle;
}

interface FileNodeMap {
  [key: string]: {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNodeMap;
    file?: File;
  };
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
}

interface LocalFolderBrowserProps {
  onFileSelect?: (file: LocalFileNode) => void;
}

export function LocalFolderBrowser({ onFileSelect }: LocalFolderBrowserProps) {
  const [fileTree, setFileTree] = useState<LocalFileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<LocalFileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState('');
  const [improvedCode, setImprovedCode] = useState('');
  const [error, setError] = useState('');
  const [folderName, setFolderName] = useState('');

  // Check if File System Access API is supported
  const isFileSystemAccessSupported = 'showDirectoryPicker' in window;

  const openFolder = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!isFileSystemAccessSupported) {
        // Fallback: Use traditional file input for folder
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
        input.multiple = true;
        
        input.onchange = async (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          if (files.length > 0) {
            const tree = buildFileTreeFromFiles(files);
            setFileTree(tree);
            setFolderName(files[0].webkitRelativePath.split('/')[0] || 'Selected Folder');
          }
          setIsLoading(false);
        };
        
        input.click();
        return;
      }

      // Use File System Access API
      const dirHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
      setFolderName(dirHandle.name);
      
      const tree = await buildFileTreeFromHandle(dirHandle);
      setFileTree(tree);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening folder:', err);
        setError(err.message || 'Failed to open folder');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTreeFromFiles = (files: File[]): LocalFileNode[] => {
    const root: FileNodeMap = {};
    
    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      pathParts.shift(); // Remove root folder name
      
      let current = root;
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (index === pathParts.length - 1) {
          // It's a file
          current[part] = {
            name: part,
            path: currentPath,
            type: 'file',
            file: file
          };
        } else {
          // It's a directory
          if (!current[part]) {
            current[part] = {
              name: part,
              path: currentPath,
              type: 'directory',
              children: {}
            };
          }
          current = current[part].children!;
        }
      });
    });

    return convertToArray(root);
  };

  const buildFileTreeFromHandle = async (dirHandle: FileSystemDirectoryHandle, path = ''): Promise<LocalFileNode[]> => {
    const nodes: LocalFileNode[] = [];
    
    for await (const [name, handle] of dirHandle.entries()) {
      const node: LocalFileNode = {
        name,
        path: path ? `${path}/${name}` : name,
        type: handle.kind === 'directory' ? 'directory' : 'file',
      };

      if (handle.kind === 'directory') {
        node.children = await buildFileTreeFromHandle(handle as FileSystemDirectoryHandle, node.path);
      } else {
        node.file = handle as FileSystemFileHandle;
      }

      nodes.push(node);
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const convertToArray = (obj: FileNodeMap): LocalFileNode[] => {
    return Object.values(obj).map(node => ({
      ...node,
      children: node.children ? convertToArray(node.children) : undefined
    })).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const selectFile = async (node: LocalFileNode) => {
    if (node.type !== 'file' || !node.file) return;

    try {
      setIsLoading(true);
      setSelectedFile(node);
      setReview('');
      setImprovedCode('');

      let content = '';
      
      if (node.file instanceof File) {
        // Traditional file API
        content = await node.file.text();
      } else {
        // File System Access API
        const file = await node.file.getFile();
        content = await file.text();
      }

      setFileContent(content);
      setOriginalContent(content);
      onFileSelect?.(node);
    } catch (err: any) {
      console.error('Error reading file:', err);
      setError(`Failed to read file: ${err.message}`);
    } finally {
      setIsLoading(false);
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

  const downloadFixedFile = () => {
    if (!selectedFile || !fileContent) return;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
    };
    return langMap[ext || ''] || 'javascript';
  };

  const renderFileTree = (nodes: LocalFileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        <button
          onClick={() => node.type === 'directory' ? toggleDir(node.path) : selectFile(node)}
          className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors ${
            selectedFile?.path === node.path ? 'bg-muted font-medium' : ''
          }`}
        >
          {node.type === 'directory' ? (
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
        
        {node.type === 'directory' && expandedDirs.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const clearFolder = () => {
    setFileTree([]);
    setSelectedFile(null);
    setFileContent('');
    setOriginalContent('');
    setReview('');
    setImprovedCode('');
    setFolderName('');
    setError('');
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* File Tree Sidebar */}
        <Card className="lg:w-72 flex-shrink-0 flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Local Files</span>
              </div>
              {fileTree.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFolder}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-2 overflow-y-auto flex-1">
            {fileTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground mb-4">
                  Open a folder to browse and review files locally
                </p>
                <Button onClick={openFolder} className="w-full">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Folder
                </Button>
                {!isFileSystemAccessSupported && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your browser will show a file picker
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-2 px-2">
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {folderName}
                  </p>
                </div>
                {renderFileTree(fileTree)}
              </>
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
                    disabled={isReviewing || isLoading}
                  >
                    {isReviewing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : null}
                    🤖 AI Review
                  </Button>
                  
                  {fileContent !== originalContent && (
                    <Button
                      size="sm"
                      onClick={downloadFixedFile}
                    >
                      💾 Download Fixed
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {isLoading ? (
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
                  <FolderOpen className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-center max-w-xs">
                    {fileTree.length > 0 
                      ? 'Select a file from the tree on the left to view and edit'
                      : 'Open a folder to get started'
                    }
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

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
