import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

const SUCCESS_ENCOURAGEMENT = [
  "Ого, ты только что сделал задачу! Твой внутренний ленивец в шоке и аплодирует стоя. 🦥👏",
  "Минус одна задача. Дофаминовый укол успешно доставлен в мозг! ⚡🧠",
  "Гениально! Предлагаю объявить этот день твоим личным праздником. 🎉",
  "Ты только что победил прокрастинацию в честном бою. Можешь гордиться! 🏆",
  "Так держать! Если так пойдет дальше, ты захватишь мир... но лучше сначала отдохни. 🌍🛏️",
  "Задачка плакала в углу, но ты пришел и разобрался с ней. Герой! 🦸‍♂️",
  "Мур-р-р! Питомец в восторге, нейроны ликуют, ты — легенда. 🐈✨",
  "Просто пушка! Ещё пару таких задач, и можно смело сворачивать горы. ⛰️💥",
  "Легчайшая победа! Запишем это в историю твоих великих подвигов. 📜✨",
  "Потрясающе! Продуктивность уровня «Бог», мозг шепчет слова благодарности. 🧠👑",
  "Блестяще! Твой внутренний кот довольно жмурится от такой красоты. 🐱💛",
  "Мяу-молодец! Котик ставит жирный виртуальный лайк на эту карточку. 🐾👍"
];

const CALM_QUOTES = [
  "Спокойствие, только спокойствие.",
  "Фокус на дыхании. Один шаг за раз.",
  "Прогресс, а не перфекционизм.",
  "Ты у себя на первом месте.",
  "Тише едешь — дальше будешь."
];

const GENTLE_REMINDERS = [
  "Котик скучает по невыполненным задачкам. Может, сделаем парочку? 🥺",
  "Тут твои дела спрашивают, когда ты обратишь на них внимание. Я сказал, что ты скоро! 🦸‍♂️",
  "Половина дня позади. Самое время добить пару дел и с чистой совестью пойти отдыхать. Мяу! 🐈"
];

const TASK_JOKES = [
  "В списке задача «Купить хлеб». А мне рыбки купишь?",
  "Эта задача выглядит подозрительно... Надо почесать когтями.",
  "Пытаюсь закопать твою задачу в лоток, не благодари. 💩",
  "Эта задача пахнет прокрастинацией. Мое любимое блюдо! 😻",
  "Твоя продуктивность меня пугает. Срочно скину эту карточку со стола!"
];

const ICON_JOKES = [
  "Ой, какая кнопочка! А что будет, если я её лапкой тогось?",
  "Блестит! Точно украду и спрячу под диван.",
  "Почему эта кнопка не нажимается от моего взгляда? Безобразие!"
];

const THEMES = {
  peach: { bg: '#fbf8f3', card1: '#ffffff', card2: '#f4ede2', border: '#333333', text: '#333333', subtext: '#666666', name: '🍑 Персик' },
  matcha: { bg: '#f2f5f0', card1: '#ffffff', card2: '#eaf0e6', border: '#4a5d4e', text: '#2c3b2e', subtext: '#555555', name: '🍵 Матча' },
  lavender: { bg: '#f6f4f9', card1: '#ffffff', card2: '#efeaf4', border: '#5b4a6b', text: '#3a2d45', subtext: '#555555', name: '🪻 Лаванда' },
  light: { bg: '#ffffff', card1: '#f9f9f9', card2: '#efefef', border: '#000000', text: '#000000', subtext: '#666666', name: '⚪ Светлая' },
  dark: { bg: '#121212', card1: '#1e1e1e', card2: '#2a2a2a', border: '#ffffff', text: '#ffffff', subtext: '#aaaaaa', name: '⚫ Тёмная' }
};

const getRandomUnique = (array, lastUsed) => {
  if (array.length <= 1) return array[0];
  let choice;
  do { choice = array[Math.floor(Math.random() * array.length)]; } while (choice === lastUsed);
  return choice;
};

const formatDateHeader = (dateStr) => {
  if (!dateStr) return "Без даты";
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return "Сегодня";
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ==========================================
// ИНТЕРАКТИВНЫЙ КОТИК-ХУЛИГАН
// ==========================================
const CAT_STATES = {
  SLEEPING: { id: 'sleep', text: 'Zzz...' },
  WALKING: { id: 'walk', text: 'Топ-топ 🐾' },
  DRAGGED: { id: 'drag', text: 'Эй, пусти! 😾' },
  EATING: { id: 'eat', text: 'Ням-ням 🐟' },
  PETTING: { id: 'belly', text: 'Мур-мур 😻' },
  IDLE: { id: 'idle', text: 'Мяу?' },
  INTERACTING: { id: 'interact', text: 'Цап-царап!' }
};

function InteractiveCat({ isActive, onAuthorClick }) {
  const [windowDims, setWindowDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  
  useEffect(() => {
    const handleResize = () => setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CUSHION_BOTTOM = 20; 
  const BOWL_BOTTOM = 40;
  const BASE_X_CUSHION = 30;
  const BASE_X_BOWL = 150;

  const [pos, setPos] = useState({ x: BASE_X_CUSHION, y: windowDims.h - CUSHION_BOTTOM - 60 });
  const [catState, setCatState] = useState(CAT_STATES.SLEEPING);
  const [isFacingLeft, setIsFacingLeft] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFoodBowlFull, setIsFoodBowlFull] = useState(false);
  const [hasWokenUp, setHasWokenUp] = useState(false);
  
  const dynamicTextRef = useRef(CAT_STATES.SLEEPING.text);
  const targetElementRef = useRef(null);
  const lastJokeRef = useRef('');
  const audioRef = useRef(new Audio('https://upload.wikimedia.org/wikipedia/commons/4/43/Cat_purr.ogg'));

  const walkTo = useCallback((targetX, targetY, finalState, customText = null) => {
    const safeX = Math.max(10, Math.min(window.innerWidth - 120, targetX));
    const safeY = Math.max(10, Math.min(window.innerHeight - 100, targetY));

    setPos(prev => {
      setIsFacingLeft(safeX < prev.x);
      return { x: safeX, y: safeY };
    });
    setCatState(CAT_STATES.WALKING);
    
    setTimeout(() => {
      if (!isDragging) {
        setCatState(finalState);
        dynamicTextRef.current = customText || finalState.text;

        if (finalState.id === 'interact' && targetElementRef.current) {
          targetElementRef.current.classList.add('ui-shake-anim');
          setTimeout(() => {
            if (targetElementRef.current) targetElementRef.current.classList.remove('ui-shake-anim');
            if (catState.id !== 'drag') {
              setCatState(CAT_STATES.IDLE);
              dynamicTextRef.current = CAT_STATES.IDLE.text;
            }
          }, 5000); 
        }
      }
    }, 1100); 
  }, [isDragging, catState.id]);

  const triggerTaskInteraction = useCallback((overrideText = null) => {
    const interactables = Array.from(document.querySelectorAll('.interactable-task, .interactable-icon')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });

    if (interactables.length > 0) {
      const target = interactables[Math.floor(Math.random() * interactables.length)];
      const rect = target.getBoundingClientRect();
      const isTask = target.classList.contains('interactable-task');
      const jokeArray = isTask ? TASK_JOKES : ICON_JOKES;
      const randomJoke = overrideText || getRandomUnique(jokeArray, lastJokeRef.current);
      lastJokeRef.current = randomJoke;
      const targetX = rect.left + (rect.width / 2) - 55; 
      const targetY = rect.top + (rect.height / 2) - 30; 
      
      targetElementRef.current = target;
      walkTo(targetX, targetY, CAT_STATES.INTERACTING, randomJoke);
    }
  }, [walkTo]);

  useEffect(() => {
    if (hasWokenUp || !isActive) return;
    const wakeTimer = setTimeout(() => {
      setCatState(CAT_STATES.IDLE);
      setHasWokenUp(true);
      triggerTaskInteraction("О, задачи! Сейчас я устрою им тест-драйв! 🐾");
    }, 300); 
    return () => clearTimeout(wakeTimer);
  }, [hasWokenUp, isActive, triggerTaskInteraction]);

  useEffect(() => {
    if (!hasWokenUp || isDragging || ['sleep', 'eat', 'belly', 'interact'].includes(catState.id)) return;

    const wanderTimer = setInterval(() => {
      const r = Math.random();
      if (r > 0.93) {
        dynamicTextRef.current = "Что-то я устал...";
        walkTo(BASE_X_CUSHION, window.innerHeight - CUSHION_BOTTOM - 60, CAT_STATES.SLEEPING);
        return;
      }
      if (r > 0.15) {
        triggerTaskInteraction();
        return;
      }
      const targetX = Math.max(30, Math.min(window.innerWidth - 120, 50 + Math.random() * (window.innerWidth - 150)));
      const targetY = Math.max(80, Math.min(window.innerHeight - 100, 50 + Math.random() * (window.innerHeight - 150)));
      dynamicTextRef.current = CAT_STATES.WALKING.text;
      walkTo(targetX, targetY, Math.random() > 0.5 ? CAT_STATES.IDLE : CAT_STATES.WALKING);
    }, 2200); 

    return () => clearInterval(wanderTimer);
  }, [isDragging, catState.id, hasWokenUp, walkTo, triggerTaskInteraction]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setHasWokenUp(true);
    setCatState(CAT_STATES.DRAGGED);
    dynamicTextRef.current = CAT_STATES.DRAGGED.text;
    audioRef.current.pause();
    if (targetElementRef.current) targetElementRef.current.classList.remove('ui-shake-anim');
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const safeX = Math.max(10, Math.min(window.innerWidth - 120, clientX - 55));
    const safeY = Math.max(10, Math.min(window.innerHeight - 100, clientY - 40));
    setPos({ x: safeX, y: safeY });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const cushionTargetY = window.innerHeight - CUSHION_BOTTOM - 60;
    const distToCushion = Math.hypot(pos.x - BASE_X_CUSHION, pos.y - cushionTargetY);
    
    if (distToCushion < 100) {
      setPos({ x: BASE_X_CUSHION, y: cushionTargetY });
      setCatState(CAT_STATES.SLEEPING);
      dynamicTextRef.current = CAT_STATES.SLEEPING.text;
    } else {
      setCatState(CAT_STATES.IDLE);
      dynamicTextRef.current = "Ну и ладно, пойду дальше шкодить!";
    }
  }, [isDragging, pos]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handlePet = () => {
    if (isDragging || ['eat', 'drag', 'sleep', 'interact'].includes(catState.id)) return;
    setCatState(CAT_STATES.PETTING);
    dynamicTextRef.current = "Мурр... ладно, ты классный.";
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    
    setTimeout(() => {
      if (!isDragging) {
        audioRef.current.pause();
        setCatState(CAT_STATES.IDLE);
        dynamicTextRef.current = CAT_STATES.IDLE.text;
      }
    }, 2500);
  };

  const handleFeed = () => {
    setIsFoodBowlFull(true);
    dynamicTextRef.current = "Ура, рыбов дали! 🐟";
    walkTo(BASE_X_BOWL + 10, window.innerHeight - BOWL_BOTTOM - 50, CAT_STATES.EATING, "Мррр, вкуснотища!");
    setTimeout(() => {
      setIsFoodBowlFull(false);
      if (catState.id === 'eat') {
        setCatState(CAT_STATES.IDLE);
        dynamicTextRef.current = "Теперь можно и пойти задачи погрызть.";
      }
    }, 5000);
  };

  const renderCatSVG = () => {
    const isSleeping = catState.id === 'sleep';
    const isBelly = catState.id === 'belly';
    const colorMain = "#E67E22", colorStripe = "#D35400", colorBelly = "#FAD7A1", colorOutline = "#5C2E00", colorEar = "#F5B7B1"; 

    if (isSleeping) {
      return (
        <svg width="100" height="80" viewBox="0 0 100 80">
          <g filter="drop-shadow(0px 5px 3px rgba(0,0,0,0.3))">
            <path d="M 20 65 C 20 30, 75 30, 80 60 C 85 85, 20 85, 20 65" fill={colorMain} stroke={colorOutline} strokeWidth="3" className="sleep-breathe" />
            <path d="M 40 45 Q 50 40 60 45" stroke={colorStripe} strokeWidth="3" fill="none" className="sleep-breathe"/>
            <path d="M 80 60 C 90 85, 10 90, 15 55" fill="none" stroke={colorMain} strokeWidth="12" strokeLinecap="round" />
            <path d="M 80 60 C 90 85, 10 90, 15 55" fill="none" stroke={colorOutline} strokeWidth="16" strokeLinecap="round" style={{zIndex:-1, strokeDasharray:"90 0", strokeDashoffset:"-5"}} />
            <circle cx="35" cy="55" r="16" fill={colorMain} stroke={colorOutline} strokeWidth="3" />
            <polygon points="25,43 20,28 35,40" fill={colorEar} stroke={colorOutline} strokeWidth="2" strokeLinejoin="round" />
            <polygon points="45,43 50,28 35,40" fill={colorEar} stroke={colorOutline} strokeWidth="2" strokeLinejoin="round" />
            <path d="M 27 57 Q 30 60 33 57" stroke={colorOutline} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 37 57 Q 40 60 43 57" stroke={colorOutline} strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="35" cy="62" r="1.5" fill="#E74C3C" />
            <text x="15" y="25" fill="#666" fontSize="16" fontWeight="bold" className="zzz-anim">Z</text>
          </g>
        </svg>
      );
    }
    return (
      <svg width="110" height="95" viewBox="0 0 110 95" style={{ transform: isBelly ? "rotate(180) translate(0, -90)" : "", transition: 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)' }}>
        <path className="cat-tail" d="M 20 65 C 5 65, 0 30, 20 15" stroke={colorMain} strokeWidth="8" strokeLinecap="round" fill="none" />
        <ellipse cx="55" cy="55" rx="32" ry="24" fill={colorMain} stroke={colorOutline} strokeWidth="3" />
        <ellipse cx="55" cy="65" rx="22" ry="12" fill={colorBelly} />
        <g className={catState.id === 'walk' ? 'walk-leg-1' : ''}><ellipse cx="35" cy="78" rx="6" ry="12" fill={colorBelly} stroke={colorOutline} strokeWidth="3" /></g>
        <g className={catState.id === 'walk' ? 'walk-leg-2' : ''}><ellipse cx="50" cy="78" rx="6" ry="12" fill={colorBelly} stroke={colorOutline} strokeWidth="3" /></g>
        <g className={catState.id === 'walk' ? 'walk-leg-1' : ''}><ellipse cx="70" cy="78" rx="6" ry="12" fill={colorBelly} stroke={colorOutline} strokeWidth="3" /></g>
        <g className={catState.id === 'eat' ? "eat-bob" : ""} style={{ transformOrigin: '80px 40px' }}>
          <circle cx="80" cy="40" r="19" fill={colorMain} stroke={colorOutline} strokeWidth="3" />
          <polygon points="68,25 72,5 82,23" fill={colorEar} stroke={colorOutline} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="85,23 95,5 92,25" fill={colorEar} stroke={colorOutline} strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="80" cy="48" rx="10" ry="7" fill={colorBelly} />
          {isBelly ? (
             <><path d="M72 38 Q 75 42 78 38" stroke={colorOutline} strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M82 38 Q 85 42 88 38" stroke={colorOutline} strokeWidth="2" strokeLinecap="round" fill="none" /></>
          ) : (
             <><circle cx="74" cy="37" r="3.5" fill="#2ECC71" stroke={colorOutline} strokeWidth="1" /><circle cx="86" cy="37" r="3.5" fill="#2ECC71" stroke={colorOutline} strokeWidth="1" /><circle cx="74" cy="37" r="1.5" fill="#000" /><circle cx="86" cy="37" r="1.5" fill="#000" /></>
          )}
          <circle cx="80" cy="45" r="2.5" fill="#E74C3C" /> 
          {catState.id === 'eat' ? <ellipse cx="80" cy="51" rx="4" ry="3" fill="#000" className="eat-mouth" /> : <path d="M 76 49 Q 80 53 84 49" stroke={colorOutline} strokeWidth="1.5" fill="none" />}
        </g>
      </svg>
    );
  };

  const textBubbleStyle = {
    backgroundColor: '#ffffff', border: '1px solid #5C2E00', padding: '6px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#333',
    position: 'absolute', zIndex: 10001, width: 'max-content', maxWidth: '160px', textAlign: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
    opacity: catState.id === 'sleep' ? 0.6 : 1, transition: 'opacity 0.3s' 
  };

  const catCenterX = pos.x + 55; 
  if (catCenterX < 90) { textBubbleStyle.left = `${-pos.x + 10}px`; textBubbleStyle.right = 'auto'; } 
  else if (catCenterX > windowDims.w - 90) { textBubbleStyle.left = 'auto'; textBubbleStyle.right = `${-(windowDims.w - (pos.x + 110)) + 10}px`; } 
  else { textBubbleStyle.left = '50%'; textBubbleStyle.transform = 'translateX(-50%)'; }
  if (pos.y < 80) { textBubbleStyle.top = '100px'; textBubbleStyle.bottom = 'auto'; } 
  else { textBubbleStyle.top = 'auto'; textBubbleStyle.bottom = catState.id === 'drag' ? '145px' : '105px'; }

  return (
    <>
      <div style={{ position: 'fixed', left: BASE_X_CUSHION - 20, bottom: CUSHION_BOTTOM, zIndex: 900 }}>
        <svg width="130" height="45">
          <ellipse cx="65" cy="22" rx="60" ry="20" fill="#9B59B6" stroke="#8E44AD" strokeWidth="4" />
          <ellipse cx="65" cy="18" rx="50" ry="12" fill="#AF7AC5" />
        </svg>
      </div>

      <div 
        onClick={handleFeed}
        style={{ position: 'fixed', left: BASE_X_BOWL, bottom: BOWL_BOTTOM, zIndex: 901, cursor: 'pointer', transition: 'transform 0.1s' }}
        title="Покормить котика"
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="50" height="30">
          {isFoodBowlFull && <path d="M 10 15 Q 25 2 40 15 Z" fill="#D35400" />}
          <path d="M 5 15 L 45 15 L 40 28 L 10 28 Z" fill="#BDC3C7" stroke="#7F8C8D" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>

      <div 
        onClick={() => onAuthorClick && onAuthorClick()}
        style={{ position: 'fixed', left: BASE_X_BOWL + 60, bottom: BOWL_BOTTOM, zIndex: 901, cursor: 'pointer', transition: 'transform 0.1s' }}
        title="Покормить автора"
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="50" height="30">
          <path d="M 5 15 L 45 15 L 40 28 L 10 28 Z" fill="#FAD7A1" stroke="#E67E22" strokeWidth="2" strokeLinejoin="round" />
          <text x="25" y="24" fontSize="9" fontWeight="800" fill="#D35400" textAnchor="middle" style={{fontFamily: 'Nunito, sans-serif'}}>АВТОР</text>
        </svg>
      </div>

      <div 
        onPointerDown={handlePointerDown}
        onClick={handlePet}
        style={{ 
          position: 'fixed', left: pos.x, top: pos.y, width: '110px', height: '95px', zIndex: 9999, 
          cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'left 1.1s linear, top 1.1s linear',
          userSelect: 'none', touchAction: 'none'
        }}
      >
        <div style={{ transform: `scaleX(${isFacingLeft ? -1 : 1})`, filter: 'drop-shadow(0px 8px 4px rgba(0,0,0,0.2))' }}>{renderCatSVG()}</div>
        <div style={textBubbleStyle}>{dynamicTextRef.current}</div>
      </div>
    </>
  );
}

// ==========================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ (ЗАБЫВАШКА)
// ==========================================
export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  useEffect(() => {
    const isFirstLaunch = localStorage.getItem('zabyvashka_first_launch_done');
    if (!isFirstLaunch) {
      setShowWelcomeModal(true);
      localStorage.setItem('zabyvashka_first_launch_done', 'true');
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Забывашка-планер 🐾",
              body: "Уведомления успешно включены! Я буду напоминать о делах.",
              id: 9999,
              schedule: { at: new Date(Date.now() + 1000) }
            }
          ]
        });
      }
    } catch (e) {
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    }
  };

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('zabyvashka_tasks');
    if (savedTasks) return JSON.parse(savedTasks).map(t => ({ ...t, encouragementPhrase: "" }));
    return [
      { id: 1, text: "Похвалить себя за вчерашнее", date: todayStr, reminderTime: "", completed: false, image: null, drawing: null, encouragementPhrase: "" }
    ];
  });
  
  useEffect(() => { localStorage.setItem('zabyvashka_tasks', JSON.stringify(tasks)); }, [tasks]);

  const [inputText, setInputText] = useState('');
  const [inputDate, setInputDate] = useState(todayStr);
  const [inputReminderTime, setInputReminderTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('zabyvashka_theme') || 'peach');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('zabyvashka_theme', currentTheme); }, [currentTheme]);

  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false);
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const quoteTimer = setInterval(() => setCurrentQuoteIndex(prev => (prev + 1) % CALM_QUOTES.length), 8000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Планировщик локальных системных уведомлений через Capacitor
  useEffect(() => {
    const scheduleTaskNotifications = async () => {
      try {
        for (const task of tasks) {
          if (!task.completed && task.date && task.reminderTime) {
            const [hours, minutes] = task.reminderTime.split(':');
            const targetDate = new Date(`${task.date}T${hours}:${minutes}:00`);
            
            if (targetDate > new Date()) {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: "⏰ Напоминание от Забывашки",
                    body: task.text,
                    id: task.id % 2147483647,
                    schedule: { at: targetDate }
                  }
                ]
              });
            }
          }
        }
      } catch (e) {
        console.log("Local notifications scheduled via fallback");
      }
    };
    scheduleTaskNotifications();
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setTasks([{ id: Date.now(), text: inputText, date: inputDate || todayStr, reminderTime: inputReminderTime, completed: false, image: null, drawing: null, encouragementPhrase: "" }, ...tasks]);
    setInputText(''); setInputReminderTime(''); setInputDate(todayStr);
  };

  const toggleTask = (id) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === id) {
        const nextState = !task.completed;
        let phrase = task.encouragementPhrase;
        if (nextState && !phrase) {
          phrase = getRandomUnique(SUCCESS_ENCOURAGEMENT, '');
        }
        return { ...task, completed: nextState, encouragementPhrase: phrase };
      }
      return task;
    }));
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTasks(tasks.map(t => t.id === id ? { ...t, image: reader.result } : t));
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y); ctx.strokeStyle = THEMES[currentTheme].border; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const saveDrawingAsTask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setTasks([{ id: Date.now(), text: "Вдохновение 🌸", date: todayStr, reminderTime: "", completed: false, drawing: canvas.toDataURL(), encouragementPhrase: "" }, ...tasks]);
    setIsDrawingOpen(false);
  };

  const theme = THEMES[currentTheme];
  const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(searchQuery.toLowerCase()) || task.date.includes(searchQuery));
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const dateKey = task.date || todayStr;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg, color: theme.text }}>
      <header style={{ ...styles.header, borderBottomColor: theme.border }}>
        <div style={styles.topRow}>
          <h1 style={{ ...styles.title, color: theme.border }}>Забывашка-планер</h1>
          <div style={styles.headerRight}>
            <button className="interactable-icon" onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(''); }} style={{ ...styles.iconBtn, borderColor: theme.border, color: theme.text }}>🔍</button>
            <button className="interactable-icon" onClick={requestNotificationPermission} style={{ ...styles.iconBtn, borderColor: theme.border, color: theme.text }}>🔔</button>
            <button className="interactable-icon" onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} style={{ ...styles.iconBtn, borderColor: theme.border, color: theme.text }}>⚙️</button>
          </div>
        </div>

        {isThemeMenuOpen && (
          <div style={{ ...styles.themeMenu, backgroundColor: theme.card1, borderColor: theme.border }}>
            {Object.keys(THEMES).map(key => (
              <div key={key} onClick={() => { setCurrentTheme(key); setIsThemeMenuOpen(false); }}
                   style={{ ...styles.themeOption, fontWeight: currentTheme === key ? 'bold' : 'normal', color: theme.text }}>
                {THEMES[key].name}
              </div>
            ))}
          </div>
        )}
      </header>

      {showWelcomeModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.bg, borderColor: theme.border, maxWidth: '320px', padding: '20px' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🐱✨</div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '19px', color: theme.border, fontFamily: "'Nunito', sans-serif" }}>Мяу! Привет-привет!</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: theme.text, marginBottom: '20px' }}>
              Добро пожаловать в «Забывашку-планер»! Я твой личный пушистый ассистент. Буду охранять твои списки дел, забавно подбадривать за выполненные задачи и вредничать, если будешь долго прокрастинировать. Давай свершим парочку великих дел! 🚀
            </p>
            <button 
              onClick={() => {
                setShowWelcomeModal(false);
                requestNotificationPermission();
              }} 
              style={{ ...styles.modalSaveBtn, backgroundColor: theme.border, color: theme.bg, width: '100%', fontSize: '15px' }}
            >
              Погнали шкодить! 🐾
            </button>
          </div>
        </div>
      )}

      {showDonationModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.bg, borderColor: theme.border, maxWidth: '320px', padding: '20px' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>👨‍💻🐟</div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '19px', color: theme.border, fontFamily: "'Nunito', sans-serif" }}>Покормить автора</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: theme.text, marginBottom: '15px' }}>
              Покормите автора — он тоже котик и очень старался для вас! И тоже хочет кушать, как его любимая кошечка и котята. 🐾
            </p>
            <div style={{ padding: '12px', backgroundColor: theme.card2, borderRadius: '10px', border: `1px dashed ${theme.border}`, marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', display: 'block', marginBottom: '5px', color: theme.subtext }}>Перевод по СБП:</span>
              <strong style={{ fontSize: '18px', letterSpacing: '1px', display: 'block', color: theme.text }}>+7 (918) 669-97-65</strong>
              <span style={{ fontSize: '12px', display: 'block', marginTop: '5px', color: theme.subtext }}>Сбербанк</span>
            </div>
            <button 
              onClick={() => setShowDonationModal(false)} 
              style={{ ...styles.modalSaveBtn, backgroundColor: theme.border, color: theme.bg, width: '100%', fontSize: '15px' }}
            >
              Мур-мур, спасибо! ❤️
            </button>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div style={styles.searchBox}>
          <input type="text" placeholder="🔍 Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
            style={{ ...styles.input, backgroundColor: theme.card1, borderColor: theme.border, color: theme.text }} />
        </div>
      )}

      <div style={{ ...styles.quoteCard, borderColor: theme.border, backgroundColor: theme.card2 }}>
        <p style={{ ...styles.quoteText, color: theme.text }}>{CALM_QUOTES[currentQuoteIndex]}</p>
      </div>

      <form onSubmit={addTask} style={styles.formRow}>
        <input type="text" placeholder="✍️ Новая задача..." value={inputText} onChange={(e) => setInputText(e.target.value)}
          style={{ ...styles.input, backgroundColor: theme.card1, borderColor: theme.border, color: theme.text, flex: 1, minWidth: 0 }} />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button type="button" onClick={() => setIsReminderMenuOpen(!isReminderMenuOpen)} 
            style={{ ...styles.iconBtn, height: '36px', width: '36px', borderColor: theme.border, backgroundColor: theme.card1, color: theme.text, padding: 0 }}>🗓️ {inputReminderTime && <span style={styles.activeDot}></span>}</button>
          {isReminderMenuOpen && (
            <div style={{ ...styles.reminderMenu, backgroundColor: theme.card1, borderColor: theme.border, color: theme.text }}>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Дата:</label>
              <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} style={{ ...styles.input, width: '100%', marginBottom: '10px', backgroundColor: theme.card2, color: theme.text, borderColor: theme.border }} />
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Время:</label>
              <input type="time" value={inputReminderTime} onChange={(e) => setInputReminderTime(e.target.value)} style={{ ...styles.input, width: '100%', marginBottom: '10px', backgroundColor: theme.card2, color: theme.text, borderColor: theme.border }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button type="button" onClick={() => setIsReminderMenuOpen(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: theme.border, color: theme.bg }}>Готово</button>
                <button type="button" onClick={() => { setInputReminderTime(''); setInputDate(todayStr); setIsReminderMenuOpen(false); }} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.text }}>Сброс</button>
              </div>
            </div>
          )}
        </div>
        <button type="submit" style={{ ...styles.addButton, backgroundColor: theme.border, color: theme.bg, flexShrink: 0 }}>＋</button>
      </form>

      <button onClick={() => setIsDrawingOpen(true)} style={{ ...styles.drawOpenButton, borderColor: theme.border, color: theme.text }}>✨ Нарисовать скетч</button>

      {isDrawingOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.bg, borderColor: theme.border }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '17px', color: theme.text }}>Творческий холст</h3>
            <canvas ref={canvasRef} width={300} height={220} style={{ ...styles.canvasStyle, borderColor: theme.border, backgroundColor: theme.card1 }}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            <div style={styles.modalButtons}>
              <button onClick={saveDrawingAsTask} style={{ ...styles.modalSaveBtn, backgroundColor: theme.border, color: theme.bg }}>💾 Сохранить</button>
              <button onClick={() => setIsDrawingOpen(false)} style={{ ...styles.modalCloseBtn, backgroundColor: theme.card2, color: theme.text, border: `1px solid ${theme.border}` }}>❌ Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        {sortedDates.length === 0 ? (
          <p style={{ ...styles.emptyText, color: theme.subtext }}>Ничего не найдено. Самое время выдохнуть.</p>
        ) : (
          sortedDates.map(dateKey => (
            <div key={dateKey} style={styles.dateGroup}>
              <div style={{ ...styles.dateHeader, color: theme.text }}>📅 {formatDateHeader(dateKey)}</div>
              <div style={styles.keepGrid}>
                {groupedTasks[dateKey].map((task, index) => {
                  const cardBg = index % 2 === 0 ? theme.card1 : theme.card2;
                  const completedBg = currentTheme === 'dark' ? '#111' : '#f0f0f0';
                  const encBg = index % 2 === 0 ? 'rgba(255, 182, 193, 0.18)' : 'rgba(135, 206, 235, 0.18)'; 
                  return (
                    <div className="interactable-task" key={task.id} style={{ ...styles.keepCard, opacity: task.completed ? 0.75 : 1, backgroundColor: task.completed ? completedBg : cardBg, borderColor: theme.border }}>
                      <div style={styles.cardHeader}>
                        <div style={styles.taskLeft} onClick={() => toggleTask(task.id)}>
                          <input type="checkbox" checked={task.completed} onChange={() => {}} style={{ ...styles.checkbox, accentColor: theme.border }} />
                          <div>
                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? theme.subtext : theme.text, fontSize: '16px', display: 'block' }}>{task.text}</span>
                            {task.reminderTime && <span style={{ ...styles.timeTag, color: theme.subtext }}>⏰ {task.reminderTime}</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ ...styles.deleteButton, color: theme.text }}>×</button>
                      </div>

                      {task.completed && task.encouragementPhrase && (
                        <div style={{ ...styles.encouragementBox, borderColor: theme.border, backgroundColor: encBg, color: theme.text }}>{task.encouragementPhrase}</div>
                      )}

                      {task.image && <img src={task.image} alt="attached" style={{ ...styles.attachedImage, borderColor: theme.border }} />}
                      {task.drawing && <img src={task.drawing} alt="drawing" style={{ ...styles.attachedImage, borderColor: theme.border }} />}

                      <div style={{ ...styles.cardFooter, borderTopColor: theme.border }}>
                        <label style={{ ...styles.uploadLabel, borderColor: theme.border, backgroundColor: theme.card1, color: theme.text }}>
                          📷 Галерея <input type="file" accept="image/*" onChange={(e) => handleImageUpload(task.id, e)} style={{display: 'none'}} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      
      <InteractiveCat isActive={!showWelcomeModal && !showDonationModal} onAuthorClick={() => setShowDonationModal(true)} />
    </div>
  );
}

const styles = {
  container: { width: '100%', minHeight: '100vh', margin: 0, padding: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', boxSizing: 'border-box', transition: 'all 0.3s ease', paddingBottom: '120px' },
  header: { marginBottom: '12px', borderBottom: '1px solid', paddingBottom: '8px', position: 'relative' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  title: { fontSize: '18px', fontWeight: '800', margin: 0, fontFamily: "'Nunito', sans-serif" },
  headerRight: { display: 'flex', alignItems: 'center', gap: '4px' },
  iconBtn: { background: 'none', border: '1px solid', borderRadius: '8px', padding: '5px 6px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  themeMenu: { position: 'absolute', top: '100%', right: '0', border: '1px solid', borderRadius: '12px', padding: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  themeOption: { padding: '8px 12px', cursor: 'pointer', fontSize: '15px', borderRadius: '6px' },
  quoteCard: { padding: '10px 14px', borderRadius: '12px', marginBottom: '12px', border: '1px solid' },
  quoteText: { margin: 0, fontSize: '13px', fontStyle: 'italic', textAlign: 'center' },
  searchBox: { marginBottom: '10px' },
  formRow: { display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center', width: '100%', boxSizing: 'border-box' },
  input: { padding: '8px 10px', borderRadius: '10px', border: '1px solid', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  addButton: { border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activeDot: { position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', backgroundColor: '#4caf50', borderRadius: '50%' },
  reminderMenu: { position: 'absolute', top: '110%', right: 0, padding: '12px', borderRadius: '12px', border: '1px solid', zIndex: 10, width: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  drawOpenButton: { width: '100%', background: 'none', border: '1px dashed', padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginBottom: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { padding: '16px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '1px solid' },
  canvasStyle: { border: '1px solid', borderRadius: '8px', cursor: 'crosshair', touchAction: 'none' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '12px' },
  modalSaveBtn: { flex: 1, border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  modalCloseBtn: { flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer' },
  section: { marginBottom: '20px' },
  dateGroup: { marginBottom: '18px' },
  dateHeader: { fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', paddingLeft: '4px' },
  keepGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  keepCard: { padding: '12px', borderRadius: '14px', border: '1px solid', transition: 'all 0.3s ease', position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskLeft: { display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', flex: 1 },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' },
  timeTag: { fontSize: '11px', marginTop: '3px', display: 'inline-block' },
  deleteButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '0 4px' },
  encouragementBox: { marginTop: '8px', padding: '8px 10px', borderRadius: '10px', fontSize: '13px', fontStyle: 'italic', border: '1px solid', wordBreak: 'break-word', lineHeight: '1.4' },
  attachedImage: { width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid' },
  cardFooter: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid' },
  uploadLabel: { fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', border: '1px solid' },
  emptyText: { fontSize: '13px', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }
};
