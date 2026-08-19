import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Participant, ParticipantStatus } from '../../types/participant';
import { useEventContext } from '../../context/EventContext';

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: Participant | null;
}

export const EditParticipantModal: React.FC<EditParticipantModalProps> = ({
  isOpen,
  onClose,
  participant,
}) => {
  const { updateParticipantItem } = useEventContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [status, setStatus] = useState<ParticipantStatus>('PENDING');

  useEffect(() => {
    if (participant) {
      setName(participant.name);
      setEmail(participant.email);
      setCertificateId(participant.certificateId);
      setRegistrationId(participant.registrationId || '');
      setStatus(participant.status);
    }
  }, [participant, isOpen]);

  if (!participant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateParticipantItem({
      ...participant,
      name: name.trim(),
      email: email.trim(),
      certificateId: certificateId.trim(),
      registrationId: registrationId.trim(),
      status,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Participant Details"
      subtitle={`ID: ${participant.id}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Participant Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Certificate ID *
            </label>
            <input
              type="text"
              required
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Registration ID
            </label>
            <input
              type="text"
              value={registrationId}
              onChange={(e) => setRegistrationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="SKIPPED">SKIPPED</option>
            <option value="INVALID">INVALID</option>
            <option value="NO_CERTIFICATE">NO_CERTIFICATE</option>
          </select>
        </div>

        {participant.lastError && (
          <div className="bg-rose-950/40 border border-rose-900/60 p-3 rounded-xl text-xs text-rose-300">
            <strong>Last Error:</strong> {participant.lastError}
          </div>
        )}

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
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all"
          >
            Save Participant
          </button>
        </div>
      </form>
    </Modal>
  );
};
