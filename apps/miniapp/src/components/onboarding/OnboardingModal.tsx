import React, { useState } from 'react';
import { UserCheck, MapPin, Percent, Target, ArrowRight, Check, X } from 'lucide-react';
import type { UserProfile, Region, Role } from '../../types/api';
import { triggerHaptic } from '../../lib/maxBridge';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onSave,
  onClose,
  isInitialSetup = false,
}) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const handleRoleSelect = (role: Role) => {
    triggerHaptic('light');
    setProfile((prev) => ({ ...prev, role }));
  };

  const handleRegionSelect = (region: Region) => {
    triggerHaptic('light');
    setProfile((prev) => ({ ...prev, region }));
  };

  const handleTaxSelect = (tax_mode: string) => {
    triggerHaptic('light');
    setProfile((prev) => ({ ...prev, tax_mode }));
  };

  const handleGoalSelect = (goal: string) => {
    triggerHaptic('light');
    setProfile((prev) => ({ ...prev, goal }));
  };

  const handleNext = () => {
    triggerHaptic('medium');
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      onSave({ ...profile, isOnboarded: true });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-sheet" style={{ padding: '24px 20px max(24px, env(safe-area-inset-bottom)) 20px' }}>
        {/* Header with step progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-yellow">
              Шаг {step} из 4
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2dcf3' }}>
              Настройка навигатора
            </span>
          </div>

          {!isInitialSetup && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step indicator bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: s <= step ? '#ffd21e' : 'rgba(255, 255, 255, 0.15)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <UserCheck size={22} color="#ffd21e" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                Форма вашего бизнеса
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#a295c5', marginBottom: 20 }}>
              Выберите юридический статус, чтобы отфильтровать доступные гранты и субсидии:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { role: 'self_employed' as Role, title: 'Самозанятый (НПД)', desc: 'Фриланс, услуги, продажи собственного товара без наемных сотрудников' },
                { role: 'ip' as Role, title: 'Индивидуальный предприниматель (ИП)', desc: 'Старт бизнеса, возможность нанимать персонал и выбирать налоговый режим' },
                { role: 'llc' as Role, title: 'ООО (Юридическое лицо)', desc: 'Команда партнеров, масштабирование, привлечение инвестиций' },
              ].map((item) => (
                <div
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className="liquid-card liquid-card-interactive"
                  style={{
                    padding: 16,
                    border: profile.role === item.role ? '1.5px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: profile.role === item.role ? 'rgba(112, 69, 198, 0.25)' : 'var(--glass-bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: profile.role === item.role ? '#ffd21e' : '#fff' }}>
                      {item.title}
                    </span>
                    {profile.role === item.role && <Check size={18} color="#ffd21e" />}
                  </div>
                  <p style={{ fontSize: 12, color: '#a295c5', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Region */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MapPin size={22} color="#ffd21e" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                Регион ведения деятельности
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#a295c5', marginBottom: 20 }}>
              Пилотные регионы поддержки в рамках хакатона 2026:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { region: 'kazan' as Region, title: 'Казань и Республика Татарстан', desc: 'ИТ-парк им. Рамеева, программы Фонда поддержки предпринимательства РТ' },
                { region: 'moscow' as Region, title: 'Москва', desc: 'Субсидии Департамента предпринимательства (ДПиИР), портал msp.mos.ru' },
                { region: 'spb' as Region, title: 'Санкт-Петербург', desc: 'Центр «Мой бизнес» СПб (ЦРПП), программы акселерации' },
              ].map((item) => (
                <div
                  key={item.region}
                  onClick={() => handleRegionSelect(item.region)}
                  className="liquid-card liquid-card-interactive"
                  style={{
                    padding: 16,
                    border: profile.region === item.region ? '1.5px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: profile.region === item.region ? 'rgba(112, 69, 198, 0.25)' : 'var(--glass-bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: profile.region === item.region ? '#ffd21e' : '#fff' }}>
                      {item.title}
                    </span>
                    {profile.region === item.region && <Check size={18} color="#ffd21e" />}
                  </div>
                  <p style={{ fontSize: 12, color: '#a295c5', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Tax Mode */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Percent size={22} color="#ffd21e" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                Налоговый режим
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#a295c5', marginBottom: 20 }}>
              Многие субсидии привязаны к вашей системе налогообложения:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { mode: 'usn6', title: 'УСН «Доходы» (6%)', desc: 'Самый частый выбор для IT, сервисов и консультаций' },
                { mode: 'usn15', title: 'УСН «Доходы минус Расходы» (15%)', desc: 'Выгодно при подтверждённых регулярных расходах (торговля, производство)' },
                { mode: 'none', title: 'НПД (Налог на профессиональный доход)', desc: 'Ставка 4% с физлиц, 6% с юрлиц. Без страховых взносов' },
                { mode: 'osno', title: 'ОСНО (Общая система)', desc: 'Крупный бизнес с НДС' },
              ].map((item) => (
                <div
                  key={item.mode}
                  onClick={() => handleTaxSelect(item.mode)}
                  className="liquid-card liquid-card-interactive"
                  style={{
                    padding: 16,
                    border: profile.tax_mode === item.mode ? '1.5px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: profile.tax_mode === item.mode ? 'rgba(112, 69, 198, 0.25)' : 'var(--glass-bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: profile.tax_mode === item.mode ? '#ffd21e' : '#fff' }}>
                        {item.title}
                      </span>
                      <p style={{ fontSize: 12, color: '#a295c5', marginTop: 2 }}>{item.desc}</p>
                    </div>
                    {profile.tax_mode === item.mode && <Check size={18} color="#ffd21e" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Sector & Goal */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Target size={22} color="#ffd21e" />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                Основная цель на сегодня
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#a295c5', marginBottom: 20 }}>
              Навигатор приоритизирует подходящие программы:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { goal: 'Старт и запуск бизнеса', desc: 'Гранты до 500 тыс. ₽ для молодежи и бесплатные курсы' },
                { goal: 'Покупка оборудования и пополнение оборота', desc: 'Льготные микрозаймы под 3.5% и субсидии на лизинг' },
                { goal: 'Инфраструктура и рабочее место', desc: 'Бесплатные коворкинги и инкубаторы в ИТ-парках' },
                { goal: 'Выход на маркетплейсы', desc: 'Компенсации комиссий российских онлайн-платформ' },
              ].map((item) => (
                <div
                  key={item.goal}
                  onClick={() => handleGoalSelect(item.goal)}
                  className="liquid-card liquid-card-interactive"
                  style={{
                    padding: 16,
                    border: profile.goal === item.goal ? '1.5px solid #ffd21e' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: profile.goal === item.goal ? 'rgba(112, 69, 198, 0.25)' : 'var(--glass-bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: profile.goal === item.goal ? '#ffd21e' : '#fff' }}>
                        {item.goal}
                      </span>
                      <p style={{ fontSize: 12, color: '#a295c5', marginTop: 2 }}>{item.desc}</p>
                    </div>
                    {profile.goal === item.goal && <Check size={18} color="#ffd21e" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
            style={{ width: '100%', fontSize: 15, padding: 14 }}
          >
            <span>{step === 4 ? 'Перейти к навигатору' : 'Продолжить'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
