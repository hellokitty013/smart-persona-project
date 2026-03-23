import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, isAdmin } from '../services/auth'

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(identifier, password)
    if (!res.ok) {
      setError(res.message || 'Login failed')
      return
    }
    // Only allow admins to proceed
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      setError('User is not an admin')
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title mb-3">Admin Login</h3>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username or Email</label>
                  <input className="form-control" value={identifier} onChange={e => setIdentifier(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <button className="btn btn-primary">Sign in</button>
                  <a className="btn btn-link" href="/admin/setup">Create admin</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
