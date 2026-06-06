import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthProvider'

export default function TodoPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('todos')
      .select('id, title, is_completed, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setErrorMessage(error.message)
        } else {
          setTodos(data ?? [])
          setErrorMessage('')
        }
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [user.id])

  const handleCreateTodo = async (event) => {
    event.preventDefault()
    const title = newTodo.trim()
    if (!title) return

    setIsSubmitting(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: user.id, title })
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
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setTodos((prev) => prev.filter((item) => item.id !== todoId))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="page-todos">
      <div className="page-header">
        <h1>Todo List</h1>
        <p className="page-subtitle">Manage your tasks</p>
      </div>

      <div className="todo-container">
        <div className="todo-header">
          <form className="todo-form" onSubmit={handleCreateTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={(event) => setNewTodo(event.target.value)}
              placeholder="Add a new task..."
              maxLength={120}
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </div>

        {errorMessage && <p className="todo-status">{errorMessage}</p>}

        {isLoading ? (
          <p className="todo-empty">Loading tasks...</p>
        ) : todos.length === 0 ? (
          <p className="todo-empty">No tasks yet. Add your first one above.</p>
        ) : (
          <div className="todo-table-wrapper">
            <table className="todo-table">
              <thead>
                <tr>
                  <th className="col-status">Status</th>
                  <th className="col-task">Task</th>
                  <th className="col-date">Created</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {todos.map((todo) => (
                  <tr key={todo.id} className={todo.is_completed ? 'row-completed' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={todo.is_completed}
                        onChange={() => handleToggleTodo(todo)}
                        title="Toggle complete"
                      />
                    </td>
                    <td>
                      <span className={todo.is_completed ? 'task-done' : ''}>
                        {todo.title}
                      </span>
                    </td>
                    <td className="cell-date">{formatDate(todo.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="todo-delete"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
