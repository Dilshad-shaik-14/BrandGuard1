import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  ExternalLink,
  Check,
  Trash2,
  Filter,
} from 'lucide-react';
import { store } from '../../services/store';
import { formatRelativeTime, formatDateTime } from '../../lib/format';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
}

export interface AppNotification {
  id: string;
  type: 'threat' | 'scan' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'info';
  read: boolean;
  actionUrl?: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  brandId,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'threat' | 'scan' | 'review'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const state = store.getState();
  const scans = state.scans.filter((s) => s.brand_id === brandId);
  const findings = state.findings.filter((f) => f.brand_id === brandId);

  // Compile real application notifications from store state
  const notifications = useMemo(() => {
    const list: AppNotification[] = [];

    // 1. High Threat Alerts
    findings
      .filter((f) => f.band === 'high')
      .slice(0, 10)
      .forEach((f) => {
        list.push({
          id: `notif-finding-${f.id}`,
          type: 'threat',
          title: `High Threat Impersonator Detected: ${f.candidate.name}`,
          message: `${f.summary_short} · Risk Score: ${f.score}/100`,
          timestamp: f.created_at,
          severity: 'high',
          read: readIds.has(`notif-finding-${f.id}`),
          actionUrl: `/brands/${brandId}/findings?finding=${f.id}`,
        });
      });

    // 2. Scan completion / partial events
    scans.slice(0, 8).forEach((s) => {
      list.push({
        id: `notif-scan-${s.id}`,
        type: 'scan',
        title: `Scan #${s.id} ${s.status === 'completed' ? 'Completed' : s.status.toUpperCase()}`,
        message: `Queried ${s.requested_sources?.length || 0} channels, evaluating ${s.stats?.candidates_seen || 0} candidates.`,
        timestamp: s.started_at || s.created_at || new Date().toISOString(),
        severity: s.status === 'failed' ? 'high' : s.status === 'partial' ? 'medium' : 'info',
        read: readIds.has(`notif-scan-${s.id}`),
        actionUrl: `/brands/${brandId}/scans`,
      });
    });

    // 3. Analyst Review updates
    findings.forEach((f) => {
      if (f.review_events && f.review_events.length > 0) {
        f.review_events.slice(-2).forEach((re) => {
          list.push({
            id: `notif-re-${re.id}`,
            type: 'review',
            title: `Finding Triage: ${f.candidate.name} marked ${re.to_status.toUpperCase()}`,
            message: `Reviewer ${re.reviewer}: "${re.note || 'Status updated'}"`,
            timestamp: re.created_at,
            severity: re.to_status === 'confirmed' ? 'high' : 'info',
            read: readIds.has(`notif-re-${re.id}`),
            actionUrl: `/brands/${brandId}/findings?finding=${f.id}`,
          });
        });
      }
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [findings, scans, brandId, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setReadIds((prev) => new Set(prev).add(notif.id));
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-md h-full bg-[#081018] border-l border-[var(--line-strong)] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--line-subtle)] bg-[#0A1420] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-[var(--cyan-accent)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white font-mono-code flex items-center gap-2">
                <span>Security Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-[var(--cyan-glow)] text-[var(--cyan-accent)] text-[10.5px]">
                    {unreadCount} UNREAD
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">Real-time alerts, completed scans, and triage logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-mono-code text-[var(--cyan-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[var(--text-muted)] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-[#060D15] border-b border-[var(--line-subtle)] flex items-center gap-1.5 text-[11px] font-mono-code">
          {(['all', 'threat', 'scan', 'review'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-2.5 py-1 rounded-[4px] font-bold capitalize transition-colors cursor-pointer ${
                filter === t
                  ? 'bg-[var(--cyan-accent)] text-[#041217]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              {t === 'all' ? 'All Alerts' : t}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--line-subtle)] p-2">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] space-y-2 font-mono-code">
              <Bell className="w-8 h-8 text-[var(--line-strong)] mx-auto opacity-50" />
              <p className="text-[13px] text-white">No notifications recorded</p>
              <p className="text-[11px] text-[var(--text-dim)]">
                Completed scans, high-threat alerts, and review updates will be logged here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-[6px] m-1 transition-all cursor-pointer ${
                    isUnread
                      ? 'bg-[#0B1724] border border-[var(--cyan-accent)]/40 hover:border-[var(--cyan-accent)]'
                      : 'bg-[#070E16] hover:bg-[#0A131F] opacity-80 hover:opacity-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'threat' ? (
                          <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
                        ) : notif.type === 'scan' ? (
                          <Radio className="w-4 h-4 text-[var(--cyan-accent)]" />
                        ) : (
                          <User className="w-4 h-4 text-[var(--official)]" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[12.5px] font-bold text-white font-mono-code leading-tight truncate">
                            {notif.title}
                          </h4>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-accent)] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono-code text-[var(--text-muted)] shrink-0">
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--line-subtle)] bg-[#060B12] flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)]">
          <span>Session Events Synchronized</span>
          <span className="text-[var(--cyan-accent)]">BrandGuard Core</span>
        </div>
      </div>
    </div>
  );
};
