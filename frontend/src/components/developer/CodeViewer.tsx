'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder, FileCode, ChevronRight, ChevronDown, Copy, Check,
  Sparkles, Bug, FileCheck2, ExternalLink, Loader2, Code2
} from 'lucide-react';
import { api } from '@/lib/api';

interface TreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

interface Props {
  owner: string;
  repo: string;
  defaultBranch?: string;
  onAskAi: (prompt: string, code: string, filename: string) => void;
}

export function CodeViewer({ owner, repo, defaultBranch = 'main', onAskAi }: Props) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Fetch Git Tree
  useEffect(() => {
    async function loadTree() {
      setLoadingTree(true);
      try {
        const res = await api.github.getRepoTree(owner, repo, defaultBranch);
        if (res.tree) {
          setTree(res.tree);
          // Default pick README or first file
          const readme = res.tree.find(t => t.type === 'blob' && t.path.toLowerCase().includes('readme'));
          const firstBlob = readme || res.tree.find(t => t.type === 'blob');
          if (firstBlob) {
            loadFile(firstBlob.path);
          }
        }
      } catch (err) {
        console.error('Failed to load repo tree:', err);
      } finally {
        setLoadingTree(false);
      }
    }
    loadTree();
  }, [owner, repo, defaultBranch]);

  const loadFile = async (path: string) => {
    setSelectedPath(path);
    setLoadingFile(true);
    try {
      const res = await api.github.getRepoFile(owner, repo, path, defaultBranch);
      if (res && res.content !== undefined) {
        setFileContent(res.content);
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setFileContent('// Error loading file contents.');
    } finally {
      setLoadingFile(false);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = fileContent ? fileContent.split('\n') : [];

  return (
    <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
      {/* File Tree Sidebar (4 cols) */}
      <div className="md:col-span-4 border-r border-border/60 bg-muted/30 p-3 overflow-y-auto max-h-[600px]">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-2">
          Files ({tree.filter(t => t.type === 'blob').length})
        </div>

        {loadingTree ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading tree...</span>
          </div>
        ) : (
          <div className="space-y-0.5 text-xs font-mono">
            {tree.slice(0, 150).map(item => {
              const isSelected = selectedPath === item.path;
              const isBlob = item.type === 'blob';

              return (
                <button
                  key={item.path}
                  onClick={() => isBlob ? loadFile(item.path) : toggleFolder(item.path)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors truncate cursor-pointer ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {isBlob ? (
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  )}
                  <span className="truncate">{item.path}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Code Editor View (8 cols) */}
      <div className="md:col-span-8 flex flex-col bg-background/90">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-card border-b border-border/60">
          <div className="flex items-center gap-2 text-xs font-mono text-foreground truncate">
            <Code2 className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{selectedPath || 'Select a file'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAskAi('Explain how this file works and its architecture role', fileContent, selectedPath)}
              disabled={!fileContent || loadingFile}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Explain</span>
            </button>

            <button
              onClick={() => onAskAi('Identify potential bugs, race conditions, or security flaws in this code', fileContent, selectedPath)}
              disabled={!fileContent || loadingFile}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Bug className="w-3 h-3" />
              <span>Find Bugs</span>
            </button>

            <button
              onClick={() => onAskAi('Generate production-grade unit tests for this file', fileContent, selectedPath)}
              disabled={!fileContent || loadingFile}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-secondary/70 hover:bg-secondary text-foreground/90 rounded-lg border border-border/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileCheck2 className="w-3 h-3" />
              <span>Tests</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!fileContent || loadingFile}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-x-auto p-4 font-mono text-xs text-foreground/90 leading-relaxed max-h-[550px] overflow-y-auto">
          {loadingFile ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading file contents...</span>
            </div>
          ) : lines.length > 0 ? (
            <div className="table w-full border-collapse">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-muted/40">
                  <div className="table-cell text-right pr-4 pl-1 select-none text-muted-foreground/60 w-10 text-[11px]">
                    {idx + 1}
                  </div>
                  <div className="table-cell whitespace-pre text-foreground font-mono">
                    {line || ' '}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-20">Select a file from the sidebar to inspect code.</div>
          )}
        </div>
      </div>
    </div>
  );
}

