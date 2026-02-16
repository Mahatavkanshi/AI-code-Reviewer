import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { githubAPI } from '@/lib/api';
import { 
  Loader2, 
  Star, 
  GitFork,
  Search,
  RefreshCw,
  Code2,
  ExternalLink,
  GitPullRequest,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GitHubCodeBrowser } from './GitHubCodeBrowser';
import { FolderGit2 } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  additions: number;
  deletions: number;
}

export function GitHubRepos() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [error, setError] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [showCodeBrowser, setShowCodeBrowser] = useState(false);
  const [codeBrowserRepo, setCodeBrowserRepo] = useState<Repository | null>(null);

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    filterRepos();
  }, [repos, searchQuery, languageFilter]);

  const fetchRepos = async () => {
    try {
      setIsLoading(true);
      const data = await githubAPI.getRepositories();
      setRepos(data);
      setFilteredRepos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPullRequests = async (repo: Repository) => {
    try {
      setIsLoadingPRs(true);
      setSelectedRepo(repo);
      const [owner, repoName] = repo.full_name.split('/');
      const prs = await githubAPI.getPullRequests(owner, repoName, 'open');
      setPullRequests(prs);
      setShowPRDialog(true);
    } catch (err) {
      console.error('Error fetching pull requests:', err);
    } finally {
      setIsLoadingPRs(false);
    }
  };

  const filterRepos = () => {
    let filtered = repos;

    if (searchQuery) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (languageFilter !== 'all') {
      filtered = filtered.filter(repo => repo.language === languageFilter);
    }

    setFilteredRepos(filtered);
  };

  const getLanguages = () => {
    const languages = new Set(repos.map(repo => repo.language).filter(Boolean));
    return Array.from(languages).sort();
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      JavaScript: '🟨',
      TypeScript: '🔷',
      Python: '🐍',
      Java: '☕',
      'C++': '⚙️',
      'C#': '🔷',
      Go: '🐹',
      Rust: '⚙️',
      Ruby: '💎',
      PHP: '🐘',
      Swift: '🦉',
      Kotlin: '🟣',
    };
    return icons[language] || '📁';
  };

  const openRepoInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openCodeBrowser = (repo: Repository) => {
    setCodeBrowserRepo(repo);
    setShowCodeBrowser(true);
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchRepos} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Your Repositories
          </CardTitle>
          <CardDescription>
            {repos.length} repositories found
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>💡 Tip:</strong> Click <strong>"🤖 Review with AI"</strong> on any repository to browse files, get AI code reviews, and apply fixes directly!
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {getLanguages().map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {getLanguageIcon(lang)} {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredRepos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No repositories found
              </p>
            ) : (
              filteredRepos.map((repo) => (
                <Card
                  key={repo.id}
                  className="group border hover:border-primary transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Repo Name - Clickable */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-lg">
                            {repo.name}
                          </span>
                          {repo.private && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              Private
                          </span>
                          )}
                        </div>
                        
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span>{getLanguageIcon(repo.language)}</span>
                              {repo.language}
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks_count}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRepoInNewTab(repo.html_url)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fetchPullRequests(repo)}
                          disabled={isLoadingPRs && selectedRepo?.id === repo.id}
                        >
                          {isLoadingPRs && selectedRepo?.id === repo.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <GitPullRequest className="h-3 w-3 mr-1" />
                          )}
                          View PRs
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openCodeBrowser(repo)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                        >
                          <FolderGit2 className="h-3 w-3 mr-1" />
                          🤖 Review with AI
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pull Requests Dialog */}
      <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Pull Requests: {selectedRepo?.name}
            </DialogTitle>
            <DialogDescription>
              {pullRequests.length} open pull requests found
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {pullRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No open pull requests in this repository
              </p>
            ) : (
              pullRequests.map((pr) => (
                <Card key={pr.number} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">#{pr.number}</span>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {pr.title}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <img
                              src={pr.user.avatar_url}
                              alt={pr.user.login}
                              className="h-4 w-4 rounded-full"
                            />
                            {pr.user.login}
                          </span>
                          
                          <span className="text-green-600 dark:text-green-400">
                            +{pr.additions || 0}
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            -{pr.deletions || 0}
                          </span>
                          
                          <span>
                            {new Date(pr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRepoInNewTab(pr.html_url)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Browser Dialog */}
      <Dialog open={showCodeBrowser} onOpenChange={setShowCodeBrowser}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5" />
              Code Browser: {codeBrowserRepo?.name}
            </DialogTitle>
            <DialogDescription>
              Browse files, review code with AI, and commit changes directly to GitHub
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            {codeBrowserRepo && (
              <GitHubCodeBrowser repo={codeBrowserRepo} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
