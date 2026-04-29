import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppDispatch, setAuth } from '../store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      dispatch(setAuth({ accessToken: data.accessToken, user: data.user }));
      navigate('/');
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <section className="login-page" aria-labelledby="login-title">
      <h2 id="login-title">Вход в ФинГород</h2>
      <form onSubmit={handleSubmit} aria-describedby={error ? 'login-error' : undefined}>
        <label htmlFor="email">Электронная почта</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <div id="login-error" role="alert" className="error">
            {error}
          </div>
        )}

        <button type="submit">Войти</button>
      </form>
    </section>
  );
}
