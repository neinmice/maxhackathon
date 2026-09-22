import React from 'react';
import { Sparkles, TrendingUp, HelpCircle, Award, Compass } from 'lucide-react';
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
  iconName: 'sparkles' | 'trending' | 'help' | 'award' | 'compass';
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
    id: 'story-fear-study',
    title: 'Цифры',
    iconName: 'trending',
    isUnread: true,
    slides: [
      {
        id: 's2',
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
  {
    id: 'story-tax-hacks',
    title: 'Новости',
    iconName: 'help',
    isUnread: false,
    slides: [
      {
        id: 's3',
        title: 'Лайфхаки по налогам',
        subtitle: 'Самозанятость против ИП на УСН',
        description: 'Как не переплатить в первый год работы? Сравниваем налоговые режимы для молодых специалистов.',
        points: [
          'НПД: нет фиксированных страховых взносов (экономия ~50 000 ₽/год)',
          'УСН: можно нанимать сотрудников и привлекать инвестиции',
          'Субсидии компенсируют покупку оборудования до 50%',
        ],
        ctaLabel: 'Подобрать свой режим',
        ctaAction: 'open_quiz',
        bgGradient: 'linear-gradient(145deg, #341571 0%, #120d1d 100%)',
        tag: 'Налоги',
      },
    ],
  },
  {
    id: 'story-navigator-tips',
    title: 'Интервью',
    iconName: 'award',
    isUnread: false,
    slides: [
      {
        id: 's4',
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
        bgGradient: 'linear-gradient(145deg, #24173e 0%, #491f9b 100%)',
        tag: 'Кейсы',
      },
    ],
  },
];

interface StoriesBarProps {
  onSelectStory: (story: StoryItem) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onSelectStory }) => {
  const getIcon = (name: StoryItem['iconName']) => {
    switch (name) {
      case 'sparkles': return <Sparkles size={18} color="#ffd21e" />;
      case 'trending': return <TrendingUp size={18} color="#ffd21e" />;
      case 'help': return <HelpCircle size={18} color="#ffd21e" />;
      case 'award': return <Award size={18} color="#ffd21e" />;
      default: return <Compass size={18} color="#ffd21e" />;
    }
  };

  return (
    <div style={{
      padding: '12px 16px 8px 16px',
      overflowX: 'auto',
      display: 'flex',
      gap: 12,
    }} className="no-scrollbar">
      {STORIES_DATA.map((story) => (
        <button
          key={story.id}
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onSelectStory(story);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            background: 'none',
          }}
        >
          {/* Avatar Ring */}
          <div style={{
            width: 66,
            height: 66,
            borderRadius: '50%',
            padding: 2.5,
            background: story.isUnread
              ? 'linear-gradient(135deg, #ffd21e 0%, #7045c6 50%, #ffe14d 100%)'
              : 'rgba(255, 255, 255, 0.15)',
            boxShadow: story.isUnread ? '0 0 14px rgba(255, 210, 30, 0.35)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#1a0d36',
              border: '2px solid #120d1d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {getIcon(story.iconName)}
            </div>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: story.isUnread ? '#fff' : '#a295c5',
            maxWidth: 70,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {story.title}
          </span>
        </button>
      ))}
    </div>
  );
};
