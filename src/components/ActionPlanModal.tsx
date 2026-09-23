import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import type { NotionContext } from "../types";
import { NotionContextResolverModal } from "./NotionContextResolverModal";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";

export const ActionPlanModal: React.FC = () => {
  const {
    activePlan,
    updateActionInPlan,
    addActionToPlan,
    removeActionFromPlan,
    regeneratePlan,
    setActionContext,
    confirmActionPlan,
    cancelPreparation,
  } = useWorkspace();

  const [newActionTitle, setNewActionTitle] = useState("");
  const [editingContextIndex, setEditingContextIndex] = useState<number | null>(
    null,
  );

  if (!activePlan) return null;

  const hasInvalidActions =
    !activePlan.noPreparationNeeded &&
    (activePlan.actions.length === 0 ||
      activePlan.actions.some((action) => !action.title.trim()));

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;
    addActionToPlan(newActionTitle);
    setNewActionTitle("");
  };

  const handleSaveContext = (context: NotionContext | undefined) => {
    if (editingContextIndex !== null) {
      setActionContext(editingContextIndex, context);
      setEditingContextIndex(null);
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div
          className="modal-content action-plan-modal"
          data-testid="action-plan-modal"
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-badge">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="modal-title">Action Plan Proposal</h3>
                <p className="modal-subtitle">
                  Preparing for: <strong>{activePlan.eventTitle}</strong>
                </p>
              </div>
            </div>
            <button
              className="icon-btn"
              onClick={cancelPreparation}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="plan-body">
            {activePlan.noPreparationNeeded ? (
              <div className="no-prep-notice" data-testid="no-prep-notice">
                <AlertCircle size={28} className="text-muted mb-2" />
                <h4>No Preparation Required</h4>
                <p>
                  This event does not require advance task preparation or Notion
                  workspace setup. No tasks or external context changes will be
                  created.
                </p>
              </div>
            ) : (
              <>
                <div className="plan-actions-toolbar">
                  <div className="toolbar-info">
                    <span className="count-badge">
                      {activePlan.actions.length}
                    </span>
                    <span>Review & customize the proposed actions below</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={regeneratePlan}
                    title="Regenerate plan"
                    data-testid="regenerate-plan-btn"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="actions-list">
                  {activePlan.actions.map((action, index) => (
                    <div
                      key={action.id}
                      className="action-row"
                      data-testid={`action-row-${index}`}
                    >
                      <div className="action-index-indicator">{index + 1}</div>
                      <input
                        type="text"
                        className="action-edit-input"
                        value={action.title}
                        onChange={(e) =>
                          updateActionInPlan(index, e.target.value)
                        }
                        placeholder="Action title"
                        data-testid={`action-input-${index}`}
                      />

                      <div className="action-context-slot">
                        {action.notionContext ? (
                          <button
                            type="button"
                            className={`context-tag type-${action.notionContext.type.toLowerCase()}`}
                            onClick={() => setEditingContextIndex(index)}
                            title="Edit Notion Context"
                            data-testid={`edit-context-btn-${index}`}
                          >
                            <FileText size={12} />
                            <span>{action.notionContext.type}:</span>
                            <span className="tag-page-title">
                              {action.notionContext.pageTitle}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-dashed btn-sm"
                            onClick={() => setEditingContextIndex(index)}
                            data-testid={`add-context-btn-${index}`}
                          >
                            <Plus size={12} />
                            <span>Attach Notion</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="icon-btn delete-btn"
                        onClick={() => removeActionFromPlan(index)}
                        title="Remove Action"
                        data-testid={`remove-action-btn-${index}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddAction} className="add-action-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+ Add another custom action..."
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    data-testid="new-action-input"
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={!newActionTitle.trim()}
                    data-testid="add-action-submit-btn"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>

                <div className="safety-notice">
                  <span>
                    No Google Tasks are created until you explicitly confirm.
                    You can safely customize or cancel this plan.
                  </span>
                </div>
                {hasInvalidActions && (
                  <div className="validation-notice" role="alert">
                    Every action needs a title before this plan can be
                    confirmed.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={cancelPreparation}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={confirmActionPlan}
              disabled={hasInvalidActions}
              data-testid="confirm-plan-btn"
            >
              <CheckCircle2 size={15} />
              <span>Confirm & Commit Tasks</span>
            </button>
          </div>
        </div>
      </div>

      {editingContextIndex !== null && (
        <NotionContextResolverModal
          currentContext={
            activePlan.actions[editingContextIndex]?.notionContext
          }
          actionTitle={activePlan.actions[editingContextIndex]?.title || ""}
          onSave={handleSaveContext}
          onClose={() => setEditingContextIndex(null)}
        />
      )}
    </>
  );
};
