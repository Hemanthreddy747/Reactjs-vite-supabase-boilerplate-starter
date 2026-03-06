import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function TodoPage({ userId }) {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('id, title, is_completed, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setTodos(data ?? [])
      setErrorMessage('')
    }

    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTodos()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadTodos])

  const handleCreateTodo = async (event) => {
    event.preventDefault()
    const title = newTodo.trim()
    if (!title) return

    setIsSubmitting(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: userId, title })
      .select('id, title, is_completed, created_at')
      .single()

    if (error) {
      setErrorMessage(error.message)
    } else if (data) {
      setTodos((prev) => [data, ...prev])
      setNewTodo('')
    }

    setIsSubmitting(false)
  }

  const handleToggleTodo = async (todo) => {
    setErrorMessage('')

    const { data, error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id)
      .eq('user_id', userId)
      .select('id, is_completed')
      .single()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setTodos((prev) =>
      prev.map((item) =>
        item.id === todo.id ? { ...item, is_completed: data.is_completed } : item,
      ),
    )
  }

  const handleDeleteTodo = async (todoId) => {
    setErrorMessage('')

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setTodos((prev) => prev.filter((item) => item.id !== todoId))
  }

  return (
    <section className="todo-page" id="todo">
      <div className="todo-card">
        <h2>My Todo List</h2>

        <form className="todo-form" onSubmit={handleCreateTodo}>
          <input
            type="text"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Add a task"
            maxLength={120}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>

        {errorMessage && <p className="todo-status">{errorMessage}</p>}

        {isLoading ? (
          <p className="todo-empty">Loading tasks...</p>
        ) : todos.length === 0 ? (
          <p className="todo-empty">No tasks yet. Add your first one.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <label>
                  <input
                    type="checkbox"
                    checked={todo.is_completed}
                    onChange={() => handleToggleTodo(todo)}
                  />
                  <span className={todo.is_completed ? 'completed' : ''}>{todo.title}</span>
                </label>
                <button
                  type="button"
                  className="todo-delete"
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
