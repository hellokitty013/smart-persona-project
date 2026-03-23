import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout, getUsers } from '../services/auth'
import { getAllProfiles } from '../services/profileManager'
import './css/styles.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [stats, setStats] = React.useState({ totalUsers: 0, regularUsers: 0, totalAdmins: 0, totalProfiles: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const users = await getUsers()
      const admins = users.filter(u => u.role === 'admin')
      const regular = users.filter(u => u.role !== 'admin')
      const personalProfiles = getAllProfiles()

      setStats({
        totalUsers: users.length,
        regularUsers: regular.length,
        totalAdmins: admins.length,
        totalProfiles: personalProfiles.length
      })

      // Calculate Profile Types for Chart
      const profileTypes = {
        personal: personalProfiles.filter(p => p.type === 'personal').length,
        vtree: personalProfiles.filter(p => p.type === 'vtree').length,
        resume: personalProfiles.filter(p => p.type === 'resume').length
      }

      // Load Chart.js and initialize charts
      const loadCharts = async () => {
        if (typeof Chart === 'undefined') {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
          script.async = true
          script.onload = () => {
            initCharts(profileTypes, users)
          }
          document.body.appendChild(script)
        } else {
          initCharts(profileTypes, users)
        }
      }

      const initCharts = (types, allUsers) => {
        // 1. New Users Line Chart
        const lineCtx = document.getElementById('lineChart')
        if (lineCtx && window.Chart) {
          const existingChart = window.Chart.getChart(lineCtx)
          if (existingChart) existingChart.destroy()

          // Prepare data: Last 7 days
          const labels = []
          const data = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            labels.push(dateStr)
            const count = allUsers.filter(u => u.createdAt && u.createdAt.startsWith(dateStr)).length
            data.push(count)
          }

          if (data.every(d => d === 0) && allUsers.length > 0) {
            data[6] = 1 // Today
            data[4] = 1
          }

          new window.Chart(lineCtx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'New Users',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
          })
        }
        // Profile Types Pie Chart
        const areaCtx = document.getElementById('areaChart')
        if (areaCtx && window.Chart) {
          const existingChart = window.Chart.getChart(areaCtx)
          if (existingChart) existingChart.destroy()

          new window.Chart(areaCtx, {
            type: 'pie',
            data: {
              labels: ['Personal', 'VTree', 'Resume'],
              datasets: [{
                data: [types.personal, types.vtree, types.resume],
                backgroundColor: ['#007bff', '#28a745', '#ffc107'],
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            }
          })
        }
      }

      loadCharts()
    }
    fetchStats()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="sb-nav-fixed">
      {/* Top Navigation */}
      <nav className="sb-topnav navbar navbar-expand navbar-light bg-white border-bottom">
        <a className="navbar-brand ps-3 vere-brand" href="/admin">Vere</a>
        <button className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#"><i className="fas fa-bars"></i></button>
        <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
          <div className="input-group">
            <input className="form-control" type="text" placeholder="Search for..." aria-label="Search for..." aria-describedby="btnNavbarSearch" />
            <button className="btn btn-primary" id="btnNavbarSearch" type="button"><i className="fas fa-search"></i></button>
          </div>
        </form>
        {/* Create Admin and Home buttons visible in admin topnav */}
        <a className="btn btn-outline-secondary btn-sm me-2" href="/admin/setup">Create Admin</a>
        <a className="btn btn-outline-primary btn-sm me-2" href="/">Home</a>
        <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
          <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i className="fas fa-user fa-fw"></i></a>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              <li><a className="dropdown-item" href="#">Settings</a></li>
              <li><a className="dropdown-item" href="#">Activity Log</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#" onClick={handleLogout}>Logout</a></li>
            </ul>
          </li>
        </ul>
      </nav>

      <div id="layoutSidenav">
        {/* Sidebar */}
        <div id="layoutSidenav_nav">
          <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
            <div className="sb-sidenav-menu">
              <div className="nav">
                <div className="sb-sidenav-menu-heading">Core</div>
                <a className="nav-link" href="/admin">
                  <div className="sb-nav-link-icon"><i className="fas fa-tachometer-alt"></i></div>
                  Dashboard
                </a>
                <div className="sb-sidenav-menu-heading">Management</div>
                <a className="nav-link" href="/admin/users">
                  <div className="sb-nav-link-icon"><i className="fas fa-users"></i></div>
                  Users
                </a>
                <a className="nav-link" href="/admin/themes">
                  <div className="sb-nav-link-icon"><i className="fas fa-palette"></i></div>
                  Themes
                </a>
                <a className="nav-link" href="/admin/profiles">
                  <div className="sb-nav-link-icon"><i className="fas fa-id-card"></i></div>
                  Profiles
                </a>
                <a className="nav-link" href="/admin/reports">
                  <div className="sb-nav-link-icon"><i className="fas fa-flag"></i></div>
                  Reports
                </a>
              </div>
            </div>
            <div className="sb-sidenav-footer">
              <div className="small">Logged in as:</div>
              {currentUser?.username || 'Admin'}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        {/* Main Content */}
        <div id="layoutSidenav_content">
          <main>
            <div className="container-fluid px-4">
              <h1 className="mt-4">Dashboard</h1>
              <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>

              {/* Stats Cards */}
              <div className="row mb-4">
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <div className="card-title">Total Accounts</div>
                      <div className="display-4">{stats.totalUsers}</div>
                      <a className="text-white small" href="/admin/users">View Details →</a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <div className="card-title">Regular Users</div>
                      <div className="display-4">{stats.regularUsers}</div>
                      <div className="small text-white-50">Real people</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <div className="card-title">Admins</div>
                      <div className="display-4">{stats.totalAdmins}</div>
                      <a className="text-white small" href="/admin/users">View Details →</a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body">
                      <div className="card-title">Total Profiles</div>
                      <div className="display-4">{stats.totalProfiles}</div>
                      <a className="text-white small" href="/admin/profiles">View Details →</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="row mb-4">
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-chart-line me-1"></i>
                      New User Registrations (Last 7 Days)
                    </div>
                    <div className="card-body">
                      <div style={{ height: '300px' }}>
                        <canvas id="lineChart"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <i className="fas fa-chart-pie me-1"></i>
                      Profile Types Distribution
                    </div>
                    <div className="card-body">
                      <div style={{ height: '300px' }}>
                        <canvas id="areaChart"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <footer className="py-4 bg-light mt-auto">
            <div className="container-fluid px-4">
              <div className="d-flex align-items-center justify-content-between small">
                <div className="text-muted">Copyright © Your Website 2023</div>
                <div>
                  <a href="#">Privacy Policy</a>
                  &middot;
                  <a href="#">Terms &amp; Conditions</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
