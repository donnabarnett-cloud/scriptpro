import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  User,
  BookOpen,
  Tag,
  Settings2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Tabs, Tab } from '@/components/common/Tabs';
import { useStore } from '@/store';
import type { Novel, POVType, TenseType, NovelStatus, PenName, Series } from '@/types';

interface NovelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
}

export function NovelSettingsModal({ isOpen, onClose, novelId }: NovelSettingsModalProps) {
  const {
    novels,
    updateNovel,
    penNames,
    createPenName,
    deletePenName,
    series,
    createSeries,
    updateSeries,
    deleteSeries,
    codexEntries,
  } = useStore();

  const novel = novels.find((n) => n.id === novelId);
  const [activeTab, setActiveTab] = useState<'general' | 'cover' | 'penname' | 'series'>('general');

  // Form state
  const [title, setTitle] = useState(novel?.title || '');
  const [subtitle, setSubtitle] = useState(novel?.subtitle || '');
  const [description, setDescription] = useState(novel?.description || '');
  const [pov, setPov] = useState<POVType>(novel?.pov || 'third-person-limited');
  const [povCharacterId, setPovCharacterId] = useState(novel?.povCharacterId || '');
  const [tense, setTense] = useState<TenseType>(novel?.tense || 'past');
  const [status, setStatus] = useState<NovelStatus>(novel?.status || 'draft');
  const [targetWordCount, setTargetWordCount] = useState(novel?.targetWordCount?.toString() || '');
  const [coverImage, setCoverImage] = useState(novel?.coverImage || '');
  const [penNameId, setPenNameId] = useState(novel?.penNameId || '');
  const [seriesId, setSeriesId] = useState(novel?.seriesId || '');
  const [seriesOrder, setSeriesOrder] = useState(novel?.seriesOrder?.toString() || '');

  // New pen name state
  const [newPenName, setNewPenName] = useState('');
  const [newPenBio, setNewPenBio] = useState('');

  // New series state
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');

  useEffect(() => {
    if (novel) {
      setTitle(novel.title);
      setSubtitle(novel.subtitle || '');
      setDescription(novel.description || '');
      setPov(novel.pov);
      setPovCharacterId(novel.povCharacterId || '');
      setTense(novel.tense);
      setStatus(novel.status);
      setTargetWordCount(novel.targetWordCount?.toString() || '');
      setCoverImage(novel.coverImage || '');
      setPenNameId(novel.penNameId || '');
      setSeriesId(novel.seriesId || '');
      setSeriesOrder(novel.seriesOrder?.toString() || '');
    }
  }, [novel]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await updateNovel(novelId, {
      title,
      subtitle: subtitle || undefined,
      description: description || undefined,
      pov,
      povCharacterId: povCharacterId || undefined,
      tense,
      status,
      targetWordCount: targetWordCount ? parseInt(targetWordCount) : undefined,
      coverImage: coverImage || undefined,
      penNameId: penNameId || undefined,
      seriesId: seriesId || undefined,
      seriesOrder: seriesOrder ? parseInt(seriesOrder) : undefined,
    });
    onClose();
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePenName = async () => {
    if (newPenName.trim()) {
      const penName = await createPenName({
        name: newPenName.trim(),
        bio: newPenBio.trim() || undefined,
      });
      setPenNameId(penName.id);
      setNewPenName('');
      setNewPenBio('');
    }
  };

  const handleCreateSeries = async () => {
    if (newSeriesName.trim()) {
      const newSeries = await createSeries({
        name: newSeriesName.trim(),
        description: newSeriesDesc.trim() || undefined,
        penNameId: penNameId || undefined,
      });
      setSeriesId(newSeries.id);
      setNewSeriesName('');
      setNewSeriesDesc('');
    }
  };

  const characters = codexEntries.filter((e) => e.type === 'character' && e.novelId === novelId);

  if (!novel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novel Settings"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
        <Tab value="general" label="General" icon={<Settings2 className="w-4 h-4" />} />
        <Tab value="cover" label="Cover" icon={<Image className="w-4 h-4" />} />
        <Tab value="penname" label="Pen Name" icon={<User className="w-4 h-4" />} />
        <Tab value="series" label="Series" icon={<BookOpen className="w-4 h-4" />} />
      </Tabs>

      <div className="mt-4 space-y-4">
        {activeTab === 'general' && (
          <>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Novel title"
            />
            <Input
              label="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or synopsis"
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Point of View"
                value={pov}
                onChange={(e) => setPov(e.target.value as POVType)}
                options={[
                  { value: 'first-person', label: 'First Person' },
                  { value: 'second-person', label: 'Second Person' },
                  { value: 'third-person-limited', label: 'Third Person Limited' },
                  { value: 'third-person-omniscient', label: 'Third Person Omniscient' },
                ]}
              />
              <Select
                label="POV Character"
                value={povCharacterId}
                onChange={(e) => setPovCharacterId(e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  ...characters.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tense"
                value={tense}
                onChange={(e) => setTense(e.target.value as TenseType)}
                options={[
                  { value: 'past', label: 'Past Tense' },
                  { value: 'present', label: 'Present Tense' },
                  { value: 'future', label: 'Future Tense' },
                ]}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as NovelStatus)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'editing', label: 'Editing' },
                  { value: 'complete', label: 'Complete' },
                  { value: 'published', label: 'Published' },
                ]}
              />
            </div>

            <Input
              label="Target Word Count"
              type="number"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(e.target.value)}
              placeholder="e.g., 80000"
            />
          </>
        )}

        {activeTab === 'cover' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />

            {coverImage ? (
              <div className="relative inline-block">
                <img
                  src={coverImage}
                  alt="Novel cover"
                  className="max-w-xs rounded-lg shadow-lg"
                />
                <button
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-48 h-72 border-2 border-dashed border-[var(--border-color)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">Upload Cover</p>
                <p className="text-xs text-[var(--text-muted)]">Click to select</p>
              </div>
            )}

            <p className="text-sm text-[var(--text-muted)]">
              Recommended size: 1600 x 2560 pixels (5:8 ratio)
            </p>

            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              {coverImage ? 'Change Cover' : 'Upload Cover'}
            </Button>
          </div>
        )}

        {activeTab === 'penname' && (
          <div className="space-y-4">
            <Select
              label="Pen Name"
              value={penNameId}
              onChange={(e) => setPenNameId(e.target.value)}
              options={[
                { value: '', label: 'No pen name' },
                ...penNames.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            {penNameId && (
              <Card className="p-4">
                {(() => {
                  const selectedPen = penNames.find((p) => p.id === penNameId);
                  return selectedPen ? (
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)]">{selectedPen.name}</h4>
                      {selectedPen.bio && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedPen.bio}</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </Card>
            )}

            <div className="border-t border-[var(--border-color)] pt-4">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Create New Pen Name</h4>
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={newPenName}
                  onChange={(e) => setNewPenName(e.target.value)}
                  placeholder="Pen name"
                />
                <Textarea
                  label="Bio"
                  value={newPenBio}
                  onChange={(e) => setNewPenBio(e.target.value)}
                  placeholder="Brief bio (optional)"
                  rows={2}
                />
                <Button
                  onClick={handleCreatePenName}
                  disabled={!newPenName.trim()}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Pen Name
                </Button>
              </div>
            </div>

            {penNames.length > 0 && (
              <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">All Pen Names</h4>
                <div className="space-y-2">
                  {penNames.map((pen) => (
                    <div
                      key={pen.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{pen.name}</span>
                      <button
                        onClick={() => deletePenName(pen.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'series' && (
          <div className="space-y-4">
            <Select
              label="Series"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              options={[
                { value: '', label: 'Not part of a series' },
                ...series.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />

            {seriesId && (
              <Input
                label="Order in Series"
                type="number"
                value={seriesOrder}
                onChange={(e) => setSeriesOrder(e.target.value)}
                placeholder="e.g., 1"
              />
            )}

            {seriesId && (
              <Card className="p-4">
                {(() => {
                  const selectedSeries = series.find((s) => s.id === seriesId);
                  const seriesNovels = novels.filter((n) => n.seriesId === seriesId).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
                  return selectedSeries ? (
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)]">{selectedSeries.name}</h4>
                      {selectedSeries.description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedSeries.description}</p>
                      )}
                      {seriesNovels.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-[var(--text-muted)] mb-1">Novels in this series:</p>
                          <div className="space-y-1">
                            {seriesNovels.map((n) => (
                              <div key={n.id} className="text-sm text-[var(--text-secondary)]">
                                {n.seriesOrder}. {n.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </Card>
            )}

            <div className="border-t border-[var(--border-color)] pt-4">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Create New Series</h4>
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  placeholder="Series name"
                />
                <Textarea
                  label="Description"
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  placeholder="Brief description (optional)"
                  rows={2}
                />
                <Button
                  onClick={handleCreateSeries}
                  disabled={!newSeriesName.trim()}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Series
                </Button>
              </div>
            </div>

            {series.length > 0 && (
              <div className="border-t border-[var(--border-color)] pt-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">All Series</h4>
                <div className="space-y-2">
                  {series.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{s.name}</span>
                      <button
                        onClick={() => deleteSeries(s.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default NovelSettingsModal;
