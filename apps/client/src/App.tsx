import { Routes, Route, Link } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { CityMapPage } from './pages/CityMapPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <div className="app">
      <header className="app-header" role="banner">
        <h1>ФинГород</h1>
        <nav role="navigation" aria-label="Главная навигация">
          <Link to="/">Карта</Link>
          <Link to="/profile">Профиль</Link>
          <Link to="/login">Вход</Link>
        </nav>
        <span className="age-rating" aria-label="Возрастная маркировка">6+</span>
      </header>
      <main role="main">
        <Routes>
          <Route path="/" element={<CityMapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}
