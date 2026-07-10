import type { ReactNode } from 'react';

export function CustomerSupportHero({
  title,
  description,
  actions,
}: {
  section: 'notice' | 'qna';
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            {title}
          </h1>
          {description ? (
            <p
              style={{
                margin: '6px 0 0',
                color: '#64748b',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
