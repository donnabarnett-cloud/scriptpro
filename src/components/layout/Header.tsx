import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Download,
  Upload,
  PlusCircle,
  Search,
  HelpCircle,
  ChevronDown,
  Maximize2,
  Minimize2,
  FileText,
  FileDown,
  FileUp,
  Database,
} from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/common/Dropdown';
import { Modal } from '@/components/common/Modal';
import { Input, Textarea, Select } from '@/components/common/Input';
import { exportAllData, importAllData } from '@/db';
import { ImportExportModal } from '@/components/modals/ImportExportModal';

export function Header() {
  const {
    novels,
    currentNovelId,
    settings,
    toggleSidebar,
    toggleFocusMode,
    focusMode,
    updateSettings,
    selectNovel,
    createNovel,
    templates,
  } = useStore();

  const [showNewNovelModal, setShowNewNovelModal] = useState(false);
  const [showNovelSwitcher, setShowNovelSwitcher] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newNovelData, setNewNovelData] = useState({
    title: '',
    description: '',
    templateId: '',
  });

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const isDark = settings?.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scriptpro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await importAllData(text);
          window.location.reload();
        } catch (error) {
          console.error('Import failed:', error);
        }
      }
    };
    input.click();
  };

  const handleCreateNovel = async () => {
    if (newNovelData.title.trim()) {
      await createNovel(
        {
          title: newNovelData.title,
          description: newNovelData.description,
        },
        newNovelData.templateId || undefined
      );
      setShowNewNovelModal(false);
      setNewNovelData({ title: '', description: '', templateId: '' });
    }
  };

  return (
    <>
      <header className="h-12 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Novel Switcher */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-primary)]">
                <span className="font-medium">{currentNovel?.title || 'Select Novel'}</span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            }
          >
            {novels.map((novel) => (
              <DropdownItem
                key={novel.id}
                onClick={() => selectNovel(novel.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={currentNovelId === novel.id ? 'font-medium text-indigo-500' : ''}>
                    {novel.title}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {novel.wordCount.toLocaleString()} words
                  </span>
                </div>
              </DropdownItem>
            ))}
            {novels.length > 0 && <DropdownDivider />}
            <DropdownItem
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setShowNewNovelModal(true)}
            >
              New Novel
            </DropdownItem>
          </Dropdown>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
            <Search className="w-5 h-5" />
          </button>

          {/* Focus Mode */}
          <button
            onClick={toggleFocusMode}
            className={`p-2 rounded-lg hover:bg-[var(--bg-hover)] ${focusMode ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`}
          >
            {focusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* More Options */}
          <Dropdown
            trigger={
              <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                <span className="sr-only">More options</span>
                ...
              </button>
            }
            align="right"
          >
            <DropdownItem icon={<FileUp className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>
              Import Document
            </DropdownItem>
            <DropdownItem icon={<FileDown className="w-4 h-4" />} onClick={() => setShowExportModal(true)}>
              Export Novel
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<Database className="w-4 h-4" />} onClick={handleExport}>
              Backup All Data
            </DropdownItem>
            <DropdownItem icon={<Upload className="w-4 h-4" />} onClick={handleImport}>
              Restore Backup
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<HelpCircle className="w-4 h-4" />}>
              Help & Support
            </DropdownItem>
          </Dropdown>
        </div>
      </header>

      {/* New Novel Modal */}
      <Modal
        isOpen={showNewNovelModal}
        onClose={() => setShowNewNovelModal(false)}
        title="Create New Novel"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewNovelModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNovel} disabled={!newNovelData.title.trim()}>
              Create Novel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newNovelData.title}
            onChange={(e) => setNewNovelData({ ...newNovelData, title: e.target.value })}
            placeholder="Enter novel title..."
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newNovelData.description}
            onChange={(e) => setNewNovelData({ ...newNovelData, description: e.target.value })}
            placeholder="Brief description of your novel..."
            rows={3}
          />
          <Select
            label="Template"
            value={newNovelData.templateId}
            onChange={(e) => setNewNovelData({ ...newNovelData, templateId: e.target.value })}
            options={[
              { value: '', label: 'No Template' },
              ...templates.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
      </Modal>

      {/* Import/Export Modals */}
      <ImportExportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        mode="import"
      />
      <ImportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        mode="export"
      />
    </>
  );
}
