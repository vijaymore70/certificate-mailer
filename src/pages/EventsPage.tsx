import React, { useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { Event } from '../types/event';
import { EventModal } from '../components/events/EventModal';
import { Plus, Calendar, Trash2, Edit, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const EventsPage: React.FC = () => {
  const { events, activeEvent, setActiveEventId, deleteEvent } = useEventContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: Event) => {
    setEditingEvent(evt);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (eventToDelete) {
      await deleteEvent(eventToDelete);
      setEventToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Event Manager</h2>
          <p className="text-xs text-slate-400">
            Each event maintains its own isolated participants, certificates, template, and logs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((evt) => {
          const isActive = activeEvent?.id === evt.id;

          return (
            <div
              key={evt.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{evt.name}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">{evt.id}</span>
                  </div>
                </div>

                {isActive && (
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                )}
              </div>

              {evt.description && (
                <p className="text-xs text-slate-400 mt-3 line-clamp-2">{evt.description}</p>
              )}

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-4">
                <button
                  onClick={() => setActiveEventId(evt.id)}
                  disabled={isActive}
                  className="text-xs font-semibold text-cyan-400 hover:underline disabled:opacity-40"
                >
                  {isActive ? 'Currently Active' : 'Switch to Event'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEventToDelete(evt.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={editingEvent}
      />

      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? All associated participants, certificates, and local logs will be permanently deleted."
        confirmLabel="Delete Event"
        variant="danger"
      />
    </div>
  );
};
