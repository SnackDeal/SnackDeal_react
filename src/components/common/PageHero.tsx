import type { ReactNode } from 'react';

export function PageHero({
  badge,
  description,
  title,
  actions,
}: {
  badge: ReactNode;
  description?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        borderRadius: 20,
        border: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: 24,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {badge}
            {description ? <span style={{ color: '#64748b', fontSize: 14 }}>{description}</span> : null}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h1>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function PageHeroBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        background: '#0f172a',
        color: '#fff',
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
