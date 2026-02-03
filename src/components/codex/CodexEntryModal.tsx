import React, { useState } from 'react';
import { useStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { TagInput } from '@/components/common/TagInput';
import { ColorPicker } from '@/components/common/ColorPicker';
import type { CodexEntryType, CustomDetail } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, Image } from 'lucide-react';

interface CodexEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: CodexEntryType;
}

const DEFAULT_DETAILS_BY_TYPE: Record<CodexEntryType, { label: string; value: string }[]> = {
  character: [
    { label: 'Age', value: '' },
    { label: 'Occupation', value: '' },
    { label: 'Physical Description', value: '' },
    { label: 'Personality', value: '' },
    { label: 'Goals', value: '' },
    { label: 'Fears', value: '' },
  ],
  location: [
    { label: 'Type', value: '' },
    { label: 'Climate', value: '' },
    { label: 'Population', value: '' },
    { label: 'Notable Features', value: '' },
  ],
  object: [
    { label: 'Type', value: '' },
    { label: 'Appearance', value: '' },
    { label: 'Origin', value: '' },
    { label: 'Properties', value: '' },
  ],
  lore: [
    { label: 'Category', value: '' },
    { label: 'Time Period', value: '' },
    { label: 'Significance', value: '' },
  ],
  subplot: [
    { label: 'Type', value: '' },
    { label: 'Status', value: '' },
    { label: 'Related Characters', value: '' },
    { label: 'Resolution', value: '' },
  ],
  other: [],
};

export function CodexEntryModal({ isOpen, onClose, type }: CodexEntryModalProps) {
  const { createCodexEntry, currentNovelId, codexCategories } = useStore();

  const [name, setName] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [customDetails, setCustomDetails] = useState<CustomDetail[]>(
    DEFAULT_DETAILS_BY_TYPE[type].map((d) => ({
      id: uuidv4(),
      label: d.label,
      value: d.value,
      type: 'text' as const,
    }))
  );
  const [includeInAI, setIncludeInAI] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  const handleSubmit = async () => {
    if (!currentNovelId || !name.trim()) return;

    await createCodexEntry(currentNovelId, {
      type,
      name: name.trim(),
      aliases,
      description: description.trim() || undefined,
      thumbnail: thumbnail.trim() || undefined,
      color,
      tags,
      categoryId: categoryId || undefined,
      customDetails: customDetails.filter((d) => d.label.trim() || d.value.trim()),
      trackingSettings: {
        includeInAI,
        trackAppearances: true,
        autoDetect: true,
      },
      isGlobal,
    });

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setAliases([]);
    setDescription('');
    setThumbnail('');
    setColor('#6366f1');
    setTags([]);
    setCategoryId('');
    setCustomDetails(
      DEFAULT_DETAILS_BY_TYPE[type].map((d) => ({
        id: uuidv4(),
        label: d.label,
        value: d.value,
        type: 'text' as const,
      }))
    );
    setIncludeInAI(true);
    setIsGlobal(false);
    onClose();
  };

  const addCustomDetail = () => {
    setCustomDetails([
      ...customDetails,
      { id: uuidv4(), label: '', value: '', type: 'text' },
    ]);
  };

  const updateCustomDetail = (id: string, field: 'label' | 'value', value: string) => {
    setCustomDetails(
      customDetails.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeCustomDetail = (id: string) => {
    setCustomDetails(customDetails.filter((d) => d.id !== id));
  };

  const typeCategories = codexCategories.filter((c) => c.type === type);

  const typeLabels: Record<CodexEntryType, string> = {
    character: 'Character',
    location: 'Location',
    object: 'Object',
    lore: 'Lore',
    subplot: 'Subplot',
    other: 'Entry',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`New ${typeLabels[type]}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create {typeLabels[type]}
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${typeLabels[type].toLowerCase()} name...`}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Aliases / Nicknames
          </label>
          <TagInput
            value={aliases}
            onChange={setAliases}
            placeholder="Add aliases..."
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Describe this ${typeLabels[type].toLowerCase()}...`}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Thumbnail URL"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="https://..."
            leftIcon={<Image className="w-4 h-4" />}
          />
          {typeCategories.length > 0 && (
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: '', label: 'No Category' },
                ...typeCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Tags
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Add tags..."
          />
        </div>

        {/* Custom Details */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Details
            </label>
            <Button variant="ghost" size="sm" onClick={addCustomDetail}>
              <Plus className="w-3 h-3 mr-1" />
              Add Field
            </Button>
          </div>
          <div className="space-y-2">
            {customDetails.map((detail) => (
              <div key={detail.id} className="flex gap-2">
                <Input
                  value={detail.label}
                  onChange={(e) => updateCustomDetail(detail.id, 'label', e.target.value)}
                  placeholder="Field name"
                  className="w-32"
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
                  className="!p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInAI}
              onChange={(e) => setIncludeInAI(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Include in AI context
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => setIsGlobal(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Global entry (available across series)
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
