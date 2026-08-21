import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Event, EventStats } from '../types/event';
import { Participant, MatchStatus, ParticipantStatus } from '../types/participant';
import { CertificateFile, MatchingStrategy } from '../types/certificate';
import { EmailTemplate, DEFAULT_TEMPLATE } from '../types/template';
import { GasSettings } from '../types/api';
import {
  getAllEvents,
  saveEvent,
  deleteEvent as dbDeleteEvent,
  getParticipantsByEvent,
  saveParticipants,
  saveParticipant,
  deleteParticipant,
  clearEventParticipants,
  getCertificatesByEvent,
  saveCertificateFiles,
  saveCertificateFile,
  deleteCertificateFile,
  clearEventCertificates,
  getGasSettings,
  saveGasSettings,
} from '../services/db';
import { MatchingService } from '../services/matchingService';
import { GasService } from '../services/gasService';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface EventContextType {
  events: Event[];
  activeEvent: Event | null;
  participants: Participant[];
  certificates: CertificateFile[];
  stats: EventStats;
  gasSettings: GasSettings;
  loading: boolean;
  toasts: Toast[];

  // Event actions
  setActiveEventId: (id: string) => void;
  createEvent: (name: string, description?: string) => Promise<Event>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Participant actions
  importParticipantsList: (newParticipants: Participant[]) => Promise<void>;
  updateParticipantItem: (participant: Participant) => Promise<void>;
  deleteParticipantItem: (id: string) => Promise<void>;
  resetParticipantStatus: (id: string) => Promise<void>;
  clearAllParticipants: () => Promise<void>;

  // Certificate actions
  addCertificates: (files: CertificateFile[]) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;
  clearAllCertificates: () => Promise<void>;
  runMatching: (strategy?: MatchingStrategy) => Promise<void>;
  manualAssignCertificate: (participantId: string, certificateId: string) => Promise<void>;

  // Template actions
  updateTemplate: (template: EmailTemplate) => Promise<void>;

  // Settings & GAS
  updateGasSettings: (settings: Partial<GasSettings>) => Promise<void>;
  testGasConnection: () => Promise<void>;

  // Toasts
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventIdState] = useState<string>('');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [certificates, setCertificates] = useState<CertificateFile[]>([]);
  const [gasSettings, setGasSettingsState] = useState<GasSettings>({
    webAppUrl: '',
    connected: false,
    remainingQuota: 100,
    batchDelayMs: 1200,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show Toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute stats
  const stats: EventStats = React.useMemo(() => {
    let matchedCertificates = 0;
    let unmatchedCertificates = 0;
    let sentCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    let noCertCount = 0;

    participants.forEach((p) => {
      if (p.matchStatus === 'MATCHED') matchedCertificates++;
      else unmatchedCertificates++;

      if (p.status === 'SENT') sentCount++;
      else if (p.status === 'PENDING') pendingCount++;
      else if (p.status === 'FAILED') failedCount++;
      else if (p.status === 'SKIPPED') skippedCount++;
      else if (p.status === 'INVALID') invalidCount++;
      else if (p.status === 'NO_CERTIFICATE') noCertCount++;
    });

    return {
      totalParticipants: participants.length,
      matchedCertificates,
      unmatchedCertificates,
      sentCount,
      pendingCount,
      failedCount,
      skippedCount,
      invalidCount,
      noCertCount,
    };
  }, [participants]);

  // Initial Load
  const init = async () => {
    setLoading(true);
    try {
      const loadedSettings = await getGasSettings();
      setGasSettingsState(loadedSettings);

      const loadedEvents = await getAllEvents();
      if (loadedEvents.length === 0) {
        // Create initial default event
        const defaultEvt: Event = {
          id: `EVT_${Date.now()}`,
          name: 'Annual Seminar 2026',
          description: 'Default sample certificate distribution event',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          matchingStrategy: 'CERTIFICATE_ID',
          emailTemplate: {
            id: `TMPL_${Date.now()}`,
            eventId: `EVT_${Date.now()}`,
            ...DEFAULT_TEMPLATE,
            updatedAt: new Date().toISOString(),
          },
        };
        await saveEvent(defaultEvt);
        setEvents([defaultEvt]);
        setActiveEventIdState(defaultEvt.id);
        setActiveEvent(defaultEvt);
      } else {
        setEvents(loadedEvents);
        const lastSelected = loadedEvents[0];
        setActiveEventIdState(lastSelected.id);
        setActiveEvent(lastSelected);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      showToast('Error loading application state from local storage.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  // Load Event Data when activeEventId changes
  const loadEventData = useCallback(async (eventId: string) => {
    if (!eventId) return;
    try {
      const pList = await getParticipantsByEvent(eventId);
      const cList = await getCertificatesByEvent(eventId);
      setParticipants(pList);
      setCertificates(cList);
    } catch (err) {
      console.error('Error loading event data:', err);
    }
  }, []);

  useEffect(() => {
    if (activeEventId) {
      const currentEvt = events.find((e) => e.id === activeEventId) || null;
      setActiveEvent(currentEvt);
      loadEventData(activeEventId);
    }
  }, [activeEventId, events, loadEventData]);

  // Actions
  const setActiveEventId = (id: string) => {
    setActiveEventIdState(id);
  };

  const createEvent = async (name: string, description?: string): Promise<Event> => {
    const newEvt: Event = {
      id: `EVT_${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matchingStrategy: 'CERTIFICATE_ID',
      emailTemplate: {
        id: `TMPL_${Date.now()}`,
        eventId: `EVT_${Date.now()}`,
        ...DEFAULT_TEMPLATE,
        updatedAt: new Date().toISOString(),
      },
    };
    await saveEvent(newEvt);
    setEvents((prev) => [...prev, newEvt]);
    setActiveEventIdState(newEvt.id);
    showToast(`Event "${name}" created successfully!`, 'success');
    return newEvt;
  };

  const updateEvent = async (evt: Event) => {
    const updated = { ...evt, updatedAt: new Date().toISOString() };
    await saveEvent(updated);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (activeEventId === updated.id) {
      setActiveEvent(updated);
    }
    showToast('Event settings updated.', 'success');
  };

  const deleteEvent = async (id: string) => {
    await dbDeleteEvent(id);
    const remaining = events.filter((e) => e.id !== id);
    setEvents(remaining);
    if (activeEventId === id) {
      if (remaining.length > 0) {
        setActiveEventIdState(remaining[0].id);
      } else {
        // Create new fallback event
        await createEvent('New Event', 'Created automatically');
      }
    }
    showToast('Event deleted.', 'info');
  };

  const importParticipantsList = async (newParticipants: Participant[]) => {
    if (!activeEventId) return;
    await saveParticipants(newParticipants);
    
    // Auto trigger matching which will fetch latest from DB
    await runMatching(activeEvent?.matchingStrategy || 'CERTIFICATE_ID');
    
    showToast(`Imported ${newParticipants.length} participants successfully.`, 'success');
  };

  const updateParticipantItem = async (p: Participant) => {
    await saveParticipant(p);
    setParticipants((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    showToast('Participant updated.', 'info');
  };

  const deleteParticipantItem = async (id: string) => {
    await deleteParticipant(id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    showToast('Participant removed.', 'info');
  };

  const resetParticipantStatus = async (id: string) => {
    const p = participants.find((item) => item.id === id);
    if (!p) return;
    const updated: Participant = {
      ...p,
      status: p.matchedCertificateId ? 'PENDING' : 'NO_CERTIFICATE',
      attempts: 0,
      lastError: '',
    };
    await saveParticipant(updated);
    setParticipants((prev) => prev.map((item) => (item.id === id ? updated : item)));
    showToast('Status reset to PENDING.', 'info');
  };

  const clearAllParticipants = async () => {
    if (!activeEventId) return;
    await clearEventParticipants(activeEventId);
    
    // Auto trigger matching to reset certificate statuses
    await runMatching(activeEvent?.matchingStrategy || 'CERTIFICATE_ID');
    
    showToast('All participants cleared for current event.', 'warning');
  };

  const addCertificates = async (newFiles: CertificateFile[]) => {
    if (!activeEventId) return;
    await saveCertificateFiles(newFiles);

    // Trigger auto-matching which will fetch latest from DB
    await runMatching(activeEvent?.matchingStrategy || 'CERTIFICATE_ID');
    
    showToast(`Uploaded ${newFiles.length} certificate PDF files.`, 'success');
  };

  const deleteCertificate = async (id: string) => {
    if (!activeEventId) return;
    await deleteCertificateFile(id);
    
    await runMatching(activeEvent?.matchingStrategy || 'CERTIFICATE_ID');
    
    showToast('Certificate file removed.', 'info');
  };

  const clearAllCertificates = async () => {
    if (!activeEventId) return;
    await clearEventCertificates(activeEventId);
    
    await runMatching(activeEvent?.matchingStrategy || 'CERTIFICATE_ID');
    
    showToast('All certificate files cleared for current event.', 'warning');
  };

  const runMatching = async (strategy?: MatchingStrategy) => {
    if (!activeEventId) return;
    const currentStrategy = strategy || activeEvent?.matchingStrategy || 'CERTIFICATE_ID';
    
    // Fetch latest from DB to avoid stale React closure state
    const latestParticipants = await getParticipantsByEvent(activeEventId);
    const latestCerts = await getCertificatesByEvent(activeEventId);
    
    const result = MatchingService.matchCertificates(latestParticipants, latestCerts, currentStrategy);
    
    await saveParticipants(result.updatedParticipants);
    await saveCertificateFiles(result.updatedCertificates);

    setParticipants(result.updatedParticipants);
    setCertificates(result.updatedCertificates);

    showToast(
      `Matching completed! Matched ${result.summary.matchedCount} of ${result.summary.totalParticipants} participants.`,
      result.summary.unmatchedCount > 0 ? 'warning' : 'success'
    );
  };

  const manualAssignCertificate = async (participantId: string, certificateId: string) => {
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;

    const cert = certificates.find((c) => c.id === certificateId);
    const updatedP: Participant = {
      ...p,
      matchedCertificateId: certificateId || undefined,
      matchedCertificateFilename: cert ? cert.filename : undefined,
      matchStatus: certificateId ? 'MATCHED' : 'NOT_FOUND',
      status: certificateId && p.status === 'NO_CERTIFICATE' ? 'PENDING' : p.status,
    };

    await saveParticipant(updatedP);
    setParticipants((prev) => prev.map((item) => (item.id === participantId ? updatedP : item)));
    showToast(`Assigned certificate ${cert ? cert.filename : 'None'} to ${p.name}.`, 'success');
  };

  const updateTemplate = async (template: EmailTemplate) => {
    if (!activeEvent) return;
    const updatedEvent: Event = {
      ...activeEvent,
      emailTemplate: { ...template, updatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString(),
    };
    await updateEvent(updatedEvent);
  };

  const updateGasSettings = async (settings: Partial<GasSettings>) => {
    const updated = { ...gasSettings, ...settings };
    await saveGasSettings(updated);
    setGasSettingsState(updated);
  };

  const testGasConnection = async () => {
    showToast('Testing Google Apps Script Web App URL connection...', 'info');
    const res = await GasService.testConnection(gasSettings.webAppUrl);
    setGasSettingsState((prev) => ({
      ...prev,
      connected: res.success,
      remainingQuota: res.quota,
      lastTestedAt: new Date().toISOString(),
    }));
    showToast(res.message, res.success ? 'success' : 'error');
  };

  const refreshData = async () => {
    if (activeEventId) {
      await loadEventData(activeEventId);
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent,
        participants,
        certificates,
        stats,
        gasSettings,
        loading,
        toasts,
        setActiveEventId,
        createEvent,
        updateEvent,
        deleteEvent,
        importParticipantsList,
        updateParticipantItem,
        deleteParticipantItem,
        resetParticipantStatus,
        clearAllParticipants,
        addCertificates,
        deleteCertificate,
        clearAllCertificates,
        runMatching,
        manualAssignCertificate,
        updateTemplate,
        updateGasSettings,
        testGasConnection,
        showToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
