import React, { useState, useEffect } from 'react';
import { Trash2, Plus, LogOut } from 'lucide-react';
import './index.css';

const API_URL = 'http://127.0.0.1:8001';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const [message, setMessage] = useState('');

  // Get token when application starts
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      setUser(true);
      getTodos(token);
    }
  }, []);

  // -------------------------
  // Register / Login
  // -------------------------

  const handleAuth = async (e) => {
    e.preventDefault();

    setMessage('');

    const endpoint = isLogin ? '/login' : '/register';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      // Login/Register failed
      if (!response.ok) {
        if (isLogin) {
          setMessage('Incorrect email or password');
        } else {
          setMessage(data.detail || 'Registration failed');
        }

        return;
      }

      // -------------------------
      // Registration successful
      // -------------------------

      if (!isLogin) {
        setMessage('Account created. Please sign in.');

        setIsLogin(true);
        setPassword('');

        return;
      }

      // -------------------------
      // Login successful
      // -------------------------

      localStorage.setItem('token', data.access_token);

      setUser(true);

      setEmail('');
      setPassword('');

      getTodos(data.access_token);

    } catch (error) {
      console.error(error);
      setMessage('Could not connect to the server');
    }
  };

  // -------------------------
  // Get todos
  // -------------------------

  const getTodos = async (token) => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setTodos(data);

    } catch (error) {
      console.error('Error getting todos:', error);
    }
  };

  // -------------------------
  // Logout
  // -------------------------

  const handleLogout = () => {
    localStorage.removeItem('token');

    setUser(null);
    setTodos([]);
    setEmail('');
    setPassword('');
  };

  // -------------------------
  // Add todo
  // -------------------------

  const addTodo = async (e) => {
    e.preventDefault();

    if (!newTodo.trim()) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          title: newTodo,
          completed: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setTodos([...todos, data]);

      setNewTodo('');

    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  // -------------------------
  // Toggle todo
  // -------------------------

  const toggleTodo = async (todo) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `${API_URL}/todos/${todo.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            title: todo.title,
            completed: !todo.completed
          })
        }
      );

      const updatedTodo = await response.json();

      if (!response.ok) {
        console.error(updatedTodo);
        return;
      }

      setTodos(
        todos.map(item =>
          item.id === updatedTodo.id
            ? updatedTodo
            : item
        )
      );

    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // -------------------------
  // Delete todo
  // -------------------------

  const deleteTodo = async (id) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `${API_URL}/todos/${id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setTodos(
        todos.filter(todo => todo.id !== id)
      );

    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // -------------------------
  // Login / Signup screen
  // -------------------------

  if (!user) {
    return (
      <div className="container">

        <h1 className="title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        <p className="subtitle">
          {isLogin
            ? 'Sign in to access your to-do list'
            : 'Sign up to start organizing your life'}
        </p>

        <form onSubmit={handleAuth}>

          <div className="form-group">

            <label className="label">
              Email Address
            </label>

            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          <div className="form-group">

            <label className="label">
              Password
            </label>

            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <button
            type="submit"
            className="btn"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>

        </form>

        {message && (
          <p style={{ marginTop: '15px' }}>
            {message}
          </p>
        )}

        <div className="toggle-auth">

          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>

        </div>

      </div>
    );
  }

  // -------------------------
  // Todo screen
  // -------------------------

  return (
    <div
      className="container"
      style={{ maxWidth: '600px' }}
    >

      <header className="todo-header">

        <div>

          <h1
            className="title"
            style={{
              textAlign: 'left',
              marginBottom: '0.25rem'
            }}
          >
            Your Tasks
          </h1>

          <p
            className="subtitle"
            style={{
              textAlign: 'left',
              marginBottom: 0
            }}
          >
            {todos.filter(t => !t.completed).length}
            {' '}
            tasks remaining
          </p>

        </div>

        <button
          className="btn-icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={20} />
        </button>

      </header>

      <form
        className="todo-add"
        onSubmit={addTodo}
      >

        <input
          type="text"
          className="input"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />

        <button
          type="submit"
          className="btn"
          style={{ width: 'auto' }}
        >
          <Plus size={20} />
        </button>

      </form>

      {todos.length === 0 ? (

        <div className="empty-state">
          You're all caught up! Add a new task above.
        </div>

      ) : (

        <ul className="todo-list">

          {todos.map(todo => (

            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''
                }`}
            >

              <div className="todo-content">

                <input
                  type="checkbox"
                  className="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                />

                <span className="todo-text">
                  {todo.title}
                </span>

              </div>

              <button
                className="btn-icon danger"
                onClick={() => deleteTodo(todo.id)}
                title="Delete task"
              >
                <Trash2 size={18} />
              </button>

            </li>

          ))}

        </ul>

      )}

    </div>
  );
}

export default App;
