import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useEventContext } from '../../context/EventContext';
import { Event } from '../../types/event';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event | null;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, eventToEdit }) => {
  const { createEvent, updateEvent } = useEventContext();
  const [name, setName] = useState(eventToEdit?.name || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name);
      setDescription(eventToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [eventToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (eventToEdit) {
        await updateEvent({
          ...eventToEdit,
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await createEvent(name.trim(), description.trim());
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Event' : 'Create New Event'}
      subtitle="Organize certificates and participants into isolated events."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Event Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Seminar 2026 or Computer Workshop"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief details about the event or certificate distribution..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all"
          >
            {loading ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
