'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GitBranch, GitCommit, GitPullRequest, AlertCircle, Terminal,
  BookOpen, Code2, Activity, Sparkles, ExternalLink, RefreshCw,
  ArrowLeft, Star, GitFork, ShieldCheck, Plus, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { ProjectHealthScore } from '@/components/developer/ProjectHealthScore';
import { ReadmeViewer } from '@/components/developer/ReadmeViewer';
import { CodeViewer } from '@/components/developer/CodeViewer';
import { CommitsView } from '@/components/developer/CommitsView';
import { IssuesView } from '@/components/developer/IssuesView';
import { PullRequestsView } from '@/components/developer/PullRequestsView';
import { CiCdPipelineView } from '@/components/developer/CiCdPipelineView';
import { AiPrReviewModal } from '@/components/developer/AiPrReviewModal';
import { ConnectRepoModal } from '@/components/developer/ConnectRepoModal';
import type {
  GitHubRepo, GitHubCommit, GitHubBranch, GitHubIssue,
  GitHubPullRequest, GitHubWorkflowRun, ProjectHealthMetrics
} from '@/types';

type DevTab = 'overview' | 'code' | 'commits' | 'issues' | 'pulls' | 'cicd';

export default function ProjectDevelopmentPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DevTab>('overview');
  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // GitHub State
  const [owner, setOwner] = useState<string>('Ti838');
  const [repo, setRepo] = useState<string>('Project-Hive');
  const [repoDetails, setRepoDetails] = useState<GitHubRepo | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([]);
  const [actions, setActions] = useState<GitHubWorkflowRun[]>([]);
  const [health, setHealth] = useState<ProjectHealthMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Modals & AI State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('');
  const [aiReviewContent, setAiReviewContent] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiModelInfo, setAiModelInfo] = useState<{ provider?: string; model?: string }>({});

  // Socket for live GitHub events
  useSocket({
    onMessage: () => {},
  });

  // Load Project and configure repository
  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const p = await api.projects.getById(projectId);
      if (p && !('error' in p)) {
        setProject(p);
        const repoUrl = p.github_url || p.repo_url || 'https://github.com/Ti838/Project-Hive';
        const match = repoUrl.match(/(?:github\.com\/|^)([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
        if (match) {
          setOwner(match[1]);
          setRepo(match[2].replace(/\.git$/, ''));
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Load all GitHub Workspace Data
  const loadRepoData = useCallback(async () => {
    if (!owner || !repo) return;
    setLoadingData(true);
    try {
      const [rDetails, rReadme, rCommits, rBranches, rIssues, rPulls, rActions, rHealth] = await Promise.all([
        api.github.getRepoOverview(owner, repo).catch(() => null),
        api.github.getRepoReadme(owner, repo).catch(() => null),
        api.github.getRepoCommits(owner, repo).catch(() => []),
        api.github.getRepoBranches(owner, repo).catch(() => []),
        api.github.getRepoIssues(owner, repo).catch(() => []),
        api.github.getRepoPulls(owner, repo).catch(() => []),
        api.github.getRepoActions(owner, repo).catch(() => []),
        api.github.getProjectHealth(owner, repo).catch(() => null),
      ]);

      if (rDetails) setRepoDetails(rDetails);
      if (rReadme) setReadmeContent(rReadme.content);
      if (rCommits) setCommits(rCommits);
      if (rBranches) setBranches(rBranches);
      if (rIssues) setIssues(rIssues);
      if (rPulls) setPulls(rPulls);
      if (rActions) setActions(rActions);
      if (rHealth) setHealth(rHealth);
    } catch (err) {
      console.error('Failed to load GitHub data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    loadRepoData();
  }, [loadRepoData]);

  // Handle AI Actions
  const handleAskAi = async (prompt: string, code?: string, filename?: string) => {
    setShowAiModal(true);
    setAiModalTitle(filename ? `Analyzing ${filename}` : 'Hive AI Developer Analysis');
    setAiReviewContent('');
    setLoadingAi(true);

    try {
      const res = await api.github.performAiReview({
        title: prompt,
        description: `Analysis for ${owner}/${repo}`,
        patch: code || readmeContent,
        filename,
      });

      if (res && res.review) {
        setAiReviewContent(res.review);
        setAiModelInfo({ provider: res.provider, model: res.model });
      }
    } catch (err: any) {
      setAiReviewContent(`Hive AI analysis error: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleReviewPr = (pr: GitHubPullRequest) => {
    handleAskAi(`Review Pull Request #${pr.number}: ${pr.title}`, pr.body || '', `PR #${pr.number}`);
  };

  const handleRepoConnected = async (newUrl: string) => {
    try {
      await api.projects.update(projectId, { githubURL: newUrl } as any);
      const match = newUrl.match(/(?:github\.com\/|^)([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/);
      if (match) {
        setOwner(match[1]);
        setRepo(match[2].replace(/\.git$/, ''));
      }
    } catch (err) {
      console.error('Failed to update project github url:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/projects`}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRepoData()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg border border-border/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Connect Repo</span>
          </button>
        </div>
      </div>

      {/* Repo Hero Header */}
      <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Code2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{owner} / {repo}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-foreground/80 border border-border/60">
                  {repoDetails?.defaultBranch || 'main'}
                </span>
                {repoDetails?.language && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                    {repoDetails.language}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                {repoDetails?.description || project?.description || 'Connected developer collaboration repository.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/60 text-xs text-foreground/80">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-foreground">{repoDetails?.starsCount || 0}</span>
              <span>stars</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/60 text-xs text-foreground/80">
              <GitFork className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-foreground">{repoDetails?.forksCount || 0}</span>
              <span>forks</span>
            </div>

            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg bg-secondary/40 hover:bg-secondary border border-border/60 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Project Health Score Gauge */}
        <ProjectHealthScore health={health} loading={loadingData} />
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>README</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'code'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Code Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('commits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'commits'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Commits ({commits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Issues ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pulls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'pulls'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          <span>Pull Requests ({pulls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cicd')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'cicd'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-foreground/80 hover:text-foreground hover:bg-secondary/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>CI/CD Actions ({actions.length})</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <ReadmeViewer
            content={readmeContent}
            repoUrl={`https://github.com/${owner}/${repo}`}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewer
            owner={owner}
            repo={repo}
            defaultBranch={repoDetails?.defaultBranch || 'main'}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'commits' && (
          <CommitsView
            commits={commits}
            loading={loadingData}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'issues' && (
          <IssuesView
            issues={issues}
            loading={loadingData}
            onAskAi={(issue) => handleAskAi(`Analyze Issue #${issue.number}: ${issue.title}`, issue.body || '', `Issue #${issue.number}`)}
          />
        )}

        {activeTab === 'pulls' && (
          <PullRequestsView
            pulls={pulls}
            loading={loadingData}
            onReviewPr={handleReviewPr}
          />
        )}

        {activeTab === 'cicd' && (
          <CiCdPipelineView
            actions={actions}
            loading={loadingData}
          />
        )}
      </div>

      {/* Modals */}
      <AiPrReviewModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title={aiModalTitle}
        reviewContent={aiReviewContent}
        loading={loadingAi}
        provider={aiModelInfo.provider}
        model={aiModelInfo.model}
      />

      <ConnectRepoModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        currentRepoUrl={`https://github.com/${owner}/${repo}`}
        onConnected={handleRepoConnected}
      />
    </div>
  );
}

