import React from 'react';
import { Sparkles, TrendingUp, HelpCircle, Award } from 'lucide-react';
import { triggerHaptic } from '../../lib/maxBridge';

export interface StorySlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  points?: string[];
  ctaLabel?: string;
  ctaAction?: 'open_measure' | 'open_catalog' | 'open_quiz';
  targetMeasureId?: string;
  bgGradient: string;
  tag: string;
}

export interface StoryItem {
  id: string;
  title: string;
  iconName: 'sparkles' | 'trending' | 'help' | 'award';
  isUnread?: boolean;
  slides: StorySlide[];
}

export const STORIES_DATA: StoryItem[] = [
  {
    id: 'story-grants-2026',
    title: 'Новинки',
    iconName: 'sparkles',
    isUnread: true,
    slides: [
      {
        id: 's1',
        title: 'Гранты 2026 для молодежи',
        subtitle: 'До 500 000 ₽ на старт своего дела',
        description: 'Если вам до 25 лет и вы открываете бизнес в Казани, Москве или СПб — государство компенсирует затраты на запуск, оборудование и рекламу.',
        points: [
          'Софинансирование от 25% расходов проекта',
          'Обязательное бесплатное обучение в «Мой бизнес»',
          'Без возврата средств при выполнении показателей',
        ],
        ctaLabel: 'Посмотреть условия гранта',
        ctaAction: 'open_measure',
        targetMeasureId: 'demo-kazan-support-001',
        bgGradient: 'linear-gradient(145deg, #491f9b 0%, #1a0d36 100%)',
        tag: 'Гранты',
      },
    ],
  },
  {
    id: 'story-news',
    title: 'Новости',
    iconName: 'help',
    isUnread: true,
    slides: [
      {
        id: 's2',
        title: 'Новости господдержки',
        subtitle: 'Льготные кредиты и программы 2026',
        description: 'Фонд поддержки МСП расширил квоты на льготное финансирование для начинающих предпринимателей в регионах.',
        points: [
          'Ставка от 3.5% годовых в первый год',
          'До 2 млн рублей без залога имущества',
          'Оформление через аккредитованные банки РФ',
        ],
        ctaLabel: 'Смотреть программы',
        ctaAction: 'open_catalog',
        bgGradient: 'linear-gradient(145deg, #24173e 0%, #491f9b 100%)',
        tag: 'Финансы',
      },
    ],
  },
  {
    id: 'story-interviews',
    title: 'Интервью',
    iconName: 'award',
    isUnread: false,
    slides: [
      {
        id: 's3',
        title: 'Как получить 1 000 000 ₽',
        subtitle: 'Опыт студентов со стартапами',
        description: 'Фонд содействия инновациям выделяет 1 млн рублей на студенческие стартапы. Срок защиты проектов — осень 2026.',
        points: [
          'Нужна технологическая или инновационная основа',
          'Деньги перечисляются на расчетный счет юрлица',
          'Отчетность по этапам без бюрократического ада',
        ],
        ctaLabel: 'Изучить грант',
        ctaAction: 'open_measure',
        targetMeasureId: 'spb-innovate-grant-007',
        bgGradient: 'linear-gradient(145deg, #1c132f 0%, #341571 100%)',
        tag: 'Кейсы',
      },
    ],
  },
  {
    id: 'story-stats',
    title: 'Цифры',
    iconName: 'trending',
    isUnread: false,
    slides: [
      {
        id: 's4',
        title: '90% боятся начать',
        subtitle: 'Главный барьер — страх неизвестности',
        description: 'Исследования показывают: большинство начинающих предпринимателей спотыкаются не на идее, а на выборе формы (ИП/НПД) и страхе налоговой отчетности.',
        points: [
          'Самозанятость: 0 деклараций и 4-6% налог',
          'УСН 6%: онлайн-бухгалтерия встроена в банк',
          'Субсидии доступны даже микробизнесу',
        ],
        ctaLabel: 'Открыть подборку мер',
        ctaAction: 'open_catalog',
        bgGradient: 'linear-gradient(145deg, #1c132f 0%, #2c1b4d 100%)',
        tag: 'Аналитика',
      },
    ],
  },
];

interface StoriesBarProps {
  onSelectStory: (story: StoryItem) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onSelectStory }) => {
  return (
    <div
      style={{
        padding: '14px 16px 8px 16px',
        overflowX: 'auto',
        display: 'flex',
        gap: 10,
      }}
      className="no-scrollbar"
    >
      {STORIES_DATA.map((story) => (
        <button
          key={story.id}
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectStory(story);
          }}
          style={{
            flex: '0 0 auto',
            width: 82,
            height: 94,
            borderRadius: 18,
            background: 'linear-gradient(145deg, rgba(38, 26, 64, 0.95) 0%, rgba(18, 12, 32, 0.98) 100%)',
            border: story.isUnread
              ? '2px solid #8B5CF6'
              : '1.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: story.isUnread
              ? '0 0 16px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 4px 14px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 8,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle top glare */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 24,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: story.isUnread ? '#ffffff' : '#d8cdfe',
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            {story.title}
          </span>

          {/* Glowing dot or mini tag */}
          {story.isUnread ? (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FFD21E',
                boxShadow: '0 0 8px #FFD21E',
              }}
            />
          ) : (
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};
