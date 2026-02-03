import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Plus,
  Link2,
  Tag,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  Image,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { Input, Textarea, Select } from '@/components/common/Input';
import { TagInput } from '@/components/common/TagInput';
import { ColorPicker } from '@/components/common/ColorPicker';
import type { CodexEntry, CustomDetail, CodexProgression, CodexRelation } from '@/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface CodexEntryDetailProps {
  entry: CodexEntry;
  onClose: () => void;
}

export function CodexEntryDetail({ entry, onClose }: CodexEntryDetailProps) {
  const { updateCodexEntry, deleteCodexEntry, codexEntries, scenes, chapters } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progressions' | 'relations' | 'mentions'>('details');

  // Edit state
  const [editData, setEditData] = useState({
    name: entry.name,
    aliases: entry.aliases,
    description: entry.description || '',
    thumbnail: entry.thumbnail || '',
    color: entry.color || '',
    tags: entry.tags,
    customDetails: entry.customDetails,
    trackingSettings: entry.trackingSettings,
    progressions: entry.progressions,
    relations: entry.relations,
  });

  const handleSave = () => {
    updateCodexEntry(entry.id, editData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteCodexEntry(entry.id);
    onClose();
  };

  const addCustomDetail = () => {
    setEditData({
      ...editData,
      customDetails: [
        ...editData.customDetails,
        { id: uuidv4(), label: '', value: '', type: 'text' },
      ],
    });
  };

  const updateCustomDetail = (id: string, field: keyof CustomDetail, value: string) => {
    setEditData({
      ...editData,
      customDetails: editData.customDetails.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    });
  };

  const removeCustomDetail = (id: string) => {
    setEditData({
      ...editData,
      customDetails: editData.customDetails.filter((d) => d.id !== id),
    });
  };

  const addProgression = () => {
    setEditData({
      ...editData,
      progressions: [
        ...editData.progressions,
        { id: uuidv4(), title: '', description: '', order: editData.progressions.length },
      ],
    });
  };

  const addRelation = () => {
    setEditData({
      ...editData,
      relations: [
        ...editData.relations,
        { id: uuidv4(), targetEntryId: '', relationType: '', isBidirectional: true },
      ],
    });
  };

  // Find mentions in scenes
  const mentions = entry.mentions || [];
  const sceneWithMentions = scenes.filter((scene) =>
    mentions.some((m) => m.sceneId === scene.id)
  );

  return (
    <div className="w-96 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--text-primary)]">
          {isEditing ? 'Edit Entry' : 'Entry Details'}
        </h3>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="p-4 space-y-4">
            {/* Basic Info */}
            <Input
              label="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Aliases
              </label>
              <TagInput
                value={editData.aliases}
                onChange={(aliases) => setEditData({ ...editData, aliases })}
                placeholder="Add alias..."
              />
            </div>

            <Textarea
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
            />

            <Input
              label="Thumbnail URL"
              value={editData.thumbnail}
              onChange={(e) => setEditData({ ...editData, thumbnail: e.target.value })}
              placeholder="https://..."
              leftIcon={<Image className="w-4 h-4" />}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Color
              </label>
              <ColorPicker
                value={editData.color || '#6366f1'}
                onChange={(color) => setEditData({ ...editData, color })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Tags
              </label>
              <TagInput
                value={editData.tags}
                onChange={(tags) => setEditData({ ...editData, tags })}
                placeholder="Add tag..."
              />
            </div>

            {/* Custom Details */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Custom Details
                </label>
                <Button variant="ghost" size="sm" onClick={addCustomDetail}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {editData.customDetails.map((detail) => (
                  <div key={detail.id} className="flex gap-2">
                    <Input
                      value={detail.label}
                      onChange={(e) => updateCustomDetail(detail.id, 'label', e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={detail.value}
                      onChange={(e) => updateCustomDetail(detail.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomDetail(detail.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Settings */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Tracking Settings
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.trackingSettings.includeInAI}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      trackingSettings: {
                        ...editData.trackingSettings,
                        includeInAI: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-secondary)]">Include in AI context</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.trackingSettings.trackAppearances}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      trackingSettings: {
                        ...editData.trackingSettings,
                        trackAppearances: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-secondary)]">Track appearances</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.trackingSettings.autoDetect}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      trackingSettings: {
                        ...editData.trackingSettings,
                        autoDetect: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-secondary)]">Auto-detect mentions</span>
              </label>
            </div>
          </div>
        ) : (
          <>
            {/* View Mode */}
            <div className="p-4">
              {/* Thumbnail/Header */}
              <div className="flex items-start gap-4 mb-4">
                {entry.thumbnail ? (
                  <img
                    src={entry.thumbnail}
                    alt={entry.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${entry.color || '#6366f1'}20` }}
                  >
                    <Users className="w-8 h-8" style={{ color: entry.color || '#6366f1' }} />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{entry.name}</h2>
                  {entry.aliases.length > 0 && (
                    <p className="text-sm text-[var(--text-muted)]">
                      aka {entry.aliases.join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Created {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} size="sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-[var(--border-color)] mb-4">
                {(['details', 'progressions', 'relations', 'mentions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-500'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  {/* Description */}
                  {entry.description && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {entry.description}
                      </p>
                    </div>
                  )}

                  {/* Custom Details */}
                  {entry.customDetails.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Details
                      </h4>
                      <div className="space-y-2">
                        {entry.customDetails.map((detail) => (
                          <div key={detail.id} className="flex justify-between">
                            <span className="text-sm text-[var(--text-muted)]">{detail.label}</span>
                            <span className="text-sm text-[var(--text-primary)]">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Settings */}
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      AI Settings
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {entry.trackingSettings.includeInAI ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                        <span className="text-[var(--text-secondary)]">
                          {entry.trackingSettings.includeInAI ? 'Included in AI context' : 'Excluded from AI'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'progressions' && (
                <div className="space-y-3">
                  {entry.progressions.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">
                      No progressions defined
                    </p>
                  ) : (
                    entry.progressions.map((prog, index) => (
                      <div key={prog.id} className="relative pl-6">
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">{index + 1}</span>
                        </div>
                        {index < entry.progressions.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-[var(--border-color)]" />
                        )}
                        <div className="pb-4">
                          <h5 className="font-medium text-[var(--text-primary)]">{prog.title}</h5>
                          <p className="text-sm text-[var(--text-secondary)]">{prog.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'relations' && (
                <div className="space-y-2">
                  {entry.relations.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">
                      No relations defined
                    </p>
                  ) : (
                    entry.relations.map((rel) => {
                      const targetEntry = codexEntries.find((e) => e.id === rel.targetEntryId);
                      return (
                        <div
                          key={rel.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]"
                        >
                          <Link2 className="w-4 h-4 text-[var(--text-muted)]" />
                          <div className="flex-1">
                            <span className="text-sm text-[var(--text-primary)]">
                              {targetEntry?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] ml-2">
                              {rel.relationType}
                            </span>
                          </div>
                          {rel.isBidirectional && (
                            <span className="text-xs text-[var(--text-muted)]">↔</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'mentions' && (
                <div className="space-y-2">
                  {sceneWithMentions.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">
                      No mentions found
                    </p>
                  ) : (
                    sceneWithMentions.map((scene) => {
                      const chapter = chapters.find((c) => c.id === scene.chapterId);
                      return (
                        <div
                          key={scene.id}
                          className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                        >
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {scene.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{chapter?.title}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-color)]">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Entry
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message={`Are you sure you want to delete "${entry.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
