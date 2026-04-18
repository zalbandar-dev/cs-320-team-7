'use client';

interface Requirement {
  label: string;
  icon: string;
  met: boolean;
}

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements: Requirement[] = [
    { label: 'At least 8 characters', icon: 'straighten', met: password.length >= 8 },
    { label: 'One uppercase letter', icon: 'arrow_upward', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', icon: 'arrow_downward', met: /[a-z]/.test(password) },
    { label: 'One number', icon: 'tag', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$…)', icon: 'auto_awesome', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const pct = (metCount / requirements.length) * 100;

  const strengthLabel =
    metCount === 0 ? '' :
    metCount === 1 ? 'Very weak' :
    metCount === 2 ? 'Weak' :
    metCount === 3 ? 'Fair' :
    metCount === 4 ? 'Good' : 'Strong';

  const barColor =
    metCount <= 1 ? '#f87171' :
    metCount === 2 ? '#fb923c' :
    metCount === 3 ? '#fbbf24' :
    metCount === 4 ? '#34d399' : '#4ade80';

  const labelColor =
    metCount <= 1 ? '#f87171' :
    metCount === 2 ? '#fb923c' :
    metCount === 3 ? '#fbbf24' :
    metCount === 4 ? '#34d399' : '#4ade80';

  if (password.length === 0) return null;

  return (
    <>
      <style>{`
        .ps-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(13,18,37,0.7);
          border: 1.5px solid rgba(61,90,241,0.18);
          border-radius: 10px;
          animation: ps-fade-in 0.2s ease;
        }
        @keyframes ps-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Bar track */
        .ps-bar-track {
          height: 5px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
        }
        .ps-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.35s cubic-bezier(.4,0,.2,1), background-color 0.35s ease;
        }

        /* Row of 5 segment dots */
        .ps-dots {
          display: flex;
          gap: 5px;
        }
        .ps-dot {
          flex: 1;
          height: 4px;
          border-radius: 99px;
          transition: background-color 0.3s ease;
        }

        /* Requirement list */
        .ps-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .ps-item {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 12.5px;
          font-family: 'Montserrat', sans-serif;
          transition: color 0.25s ease;
        }
        .ps-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.25s ease, border-color 0.25s ease;
          border: 1.5px solid;
          font-size: 13px;
        }
      `}</style>

      <div className="ps-wrap">
        {/* Strength bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#a0aec8', letterSpacing: '0.4px', textTransform: 'uppercase', fontFamily: "'Montserrat', sans-serif" }}>
            Password strength
          </span>
          {metCount > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: labelColor, fontFamily: "'Montserrat', sans-serif", transition: 'color 0.3s' }}>
              {strengthLabel}
            </span>
          )}
        </div>

        {/* Segmented dots */}
        <div className="ps-dots">
          {requirements.map((_, i) => (
            <div
              key={i}
              className="ps-dot"
              style={{ backgroundColor: i < metCount ? barColor : 'rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>

        {/* Requirements */}
        <div className="ps-list">
          {requirements.map((req) => (
            <div
              key={req.label}
              className="ps-item"
              style={{ color: req.met ? '#e8eaf6' : '#4a5a8a' }}
            >
              <div
                className="ps-check"
                style={{
                  background: req.met ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: req.met ? '#4ade80' : 'rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '12px',
                    color: req.met ? '#4ade80' : '#3d4f78',
                    transition: 'color 0.25s ease',
                    fontVariationSettings: "'FILL' 1, 'wght' 600",
                  }}
                >
                  {req.met ? 'check' : 'remove'}
                </span>
              </div>
              {req.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
