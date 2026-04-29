import { useAppSelector } from '../store';

const DISTRICT_NAMES: Record<string, string> = {
  money_functions: 'Монетный двор',
  purchases_prices: 'Торговая площадь',
  family_budget: 'Жилой квартал',
  income_expenses: 'Деловой центр',
  savings: 'Сберегательный парк',
  banking_services: 'Банковский проспект',
};

export function ProfilePage() {
  const { balance, difficultyLevel, unlockedDistricts, achievementsEarned } =
    useAppSelector((s) => s.progress);
  const { user } = useAppSelector((s) => s.auth);

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <h2 id="profile-title">Профиль</h2>

      {user && (
        <div className="user-info">
          <p>Привет, {user.firstName}!</p>
        </div>
      )}

      <div className="stats" role="region" aria-label="Игровая статистика">
        <div className="stat">
          <span className="stat-label">ФинКоины:</span>
          <span className="stat-value" aria-live="polite">
            {balance} 🪙
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Уровень сложности:</span>
          <span className="stat-value">{difficultyLevel} / 5</span>
        </div>
        <div className="stat">
          <span className="stat-label">Открыто районов:</span>
          <span className="stat-value">{unlockedDistricts.length} / 6</span>
        </div>
        <div className="stat">
          <span className="stat-label">Получено достижений:</span>
          <span className="stat-value">{achievementsEarned.length} / 18</span>
        </div>
      </div>

      <div className="districts">
        <h3>Районы ФинГорода</h3>
        <ul>
          {Object.entries(DISTRICT_NAMES).map(([key, name]) => (
            <li
              key={key}
              className={unlockedDistricts.includes(key) ? 'unlocked' : 'locked'}
            >
              {unlockedDistricts.includes(key) ? '✓' : '🔒'} {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
