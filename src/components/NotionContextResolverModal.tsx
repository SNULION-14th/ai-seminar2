import React, { useState } from 'react';
import type { NotionContext, NotionActionType } from '../types';
import { Search, Link as LinkIcon, PlusCircle, FilePlus, Check, X, FileText } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface NotionContextResolverModalProps {
  currentContext?: NotionContext;
  actionTitle: string;
  onSave: (context: NotionContext | undefined) => void;
  onClose: () => void;
}

export const NotionContextResolverModal: React.FC<NotionContextResolverModalProps> = ({
  currentContext,
  actionTitle,
  onSave,
  onClose
}) => {
  const { searchNotionPages } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotionActionType>(
    currentContext?.type || 'LINK'
  );
  const [selectedPageTitle, setSelectedPageTitle] = useState(
    currentContext?.pageTitle || ''
  );
  const [newPageTitle, setNewPageTitle] = useState('');
  const [selectedUrl, setSelectedUrl] = useState(currentContext?.url || '');
  const [customSnippet, setCustomSnippet] = useState(currentContext?.snippet || '');

  const searchResults = searchNotionPages(searchQuery);

  const handleApply = () => {
    if (selectedType === 'CREATE') {
      if (!newPageTitle.trim()) return;
      onSave({
        id: `ctx-${Date.now()}`,
        type: 'CREATE',
        pageTitle: newPageTitle.trim(),
        url: `https://notion.so/new-${encodeURIComponent(newPageTitle.trim())}`,
        snippet: customSnippet.trim() || `New workspace page for: ${actionTitle}`
      });
    } else {
      if (!selectedPageTitle.trim()) {
        onSave(undefined);
        return;
      }
      onSave({
        id: currentContext?.id || `ctx-${Date.now()}`,
        type: selectedType,
        pageTitle: selectedPageTitle,
        url: selectedUrl,
        snippet:
          customSnippet.trim() ||
          (selectedType === 'APPEND'
            ? `Append action checklist to "${selectedPageTitle}"`
            : `Linked reference to "${selectedPageTitle}"`)
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onSave(undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content notion-resolver-modal" data-testid="notion-resolver-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Resolve Notion Context</h3>
            <p className="modal-subtitle">
              Action: <span className="highlight-action">{actionTitle}</span>
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="strategy-selector">
          <button
            type="button"
            className={`strategy-btn ${selectedType === 'LINK' ? 'active' : ''}`}
            onClick={() => setSelectedType('LINK')}
            data-testid="strategy-link-btn"
          >
            <LinkIcon size={16} />
            <div className="strategy-meta">
              <strong>LINK</strong>
              <span>Reuse existing page</span>
            </div>
          </button>

          <button
            type="button"
            className={`strategy-btn ${selectedType === 'APPEND' ? 'active' : ''}`}
            onClick={() => setSelectedType('APPEND')}
            data-testid="strategy-append-btn"
          >
            <PlusCircle size={16} />
            <div className="strategy-meta">
              <strong>APPEND</strong>
              <span>Extend existing page</span>
            </div>
          </button>

          <button
            type="button"
            className={`strategy-btn ${selectedType === 'CREATE' ? 'active' : ''}`}
            onClick={() => setSelectedType('CREATE')}
            data-testid="strategy-create-btn"
          >
            <FilePlus size={16} />
            <div className="strategy-meta">
              <strong>CREATE</strong>
              <span>New page workspace</span>
            </div>
          </button>
        </div>

        <div className="resolver-body">
          {selectedType === 'CREATE' ? (
            <div className="create-page-form">
              <label className="form-label">New Notion Page Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pintos OS Project Workspace"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                autoFocus
                data-testid="new-page-title-input"
              />
              <label className="form-label mt-3">Initial Notes / Snippet</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Notes or section contents..."
                value={customSnippet}
                onChange={(e) => setCustomSnippet(e.target.value)}
                data-testid="new-page-snippet-input"
              />
            </div>
          ) : (
            <div className="search-page-section">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search existing Notion pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="notion-search-input"
                />
              </div>

              <div className="pages-list" data-testid="notion-pages-list">
                {searchResults.map((page) => {
                  const isSelected = selectedPageTitle === page.pageTitle;
                  return (
                    <div
                      key={page.id}
                      className={`page-result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPageTitle(page.pageTitle);
                        setSelectedUrl(page.url || '');
                      }}
                      data-testid={`page-result-${page.pageId || page.id}`}
                    >
                      <FileText size={16} className="text-muted" />
                      <div className="page-info">
                        <div className="page-item-title">{page.pageTitle}</div>
                        {page.snippet && <div className="page-item-snippet">{page.snippet}</div>}
                      </div>
                      {isSelected && <Check size={16} className="selected-check" />}
                    </div>
                  );
                })}
              </div>

              {selectedType === 'APPEND' && (
                <div className="append-snippet-section mt-3">
                  <label className="form-label">Content or Section to Append</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ## Implementation Checklist"
                    value={customSnippet}
                    onChange={(e) => setCustomSnippet(e.target.value)}
                    data-testid="append-snippet-input"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {currentContext && (
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={handleRemove}
              data-testid="remove-context-btn"
            >
              Remove Context
            </button>
          )}
          <div className="modal-footer-right">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={selectedType === 'CREATE' ? !newPageTitle.trim() : !selectedPageTitle.trim()}
              data-testid="apply-context-btn"
            >
              Apply Context
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
