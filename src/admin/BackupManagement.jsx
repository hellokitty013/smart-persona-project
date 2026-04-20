import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../services/auth'
import './css/styles.css'

export default function BackupManagement() {
    const [currentUser, setCurrentUser] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        setCurrentUser(getCurrentUser())
    }, [])

    const handleExport = () => {
        try {
            const data = { ...localStorage }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `smart-persona-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setMessage('Backup downloaded successfully')
        } catch (err) {
            setError('Failed to export data')
            console.error(err)
        }
    }

    const handleImport = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                // Clear current storage and load new data
                localStorage.clear()
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key])
                })
                setMessage('Data restored successfully. Reloading page...')
                setTimeout(() => window.location.reload(), 2000)
            } catch (err) {
                setError('Failed to import data. Invalid JSON file.')
                console.error(err)
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="sb-nav-fixed">
            <nav className="sb-topnav navbar navbar-expand navbar-light bg-white border-bottom">
                <a className="navbar-brand ps-3 vere-brand" href="/admin">Vere Admin</a>
                <div className="ms-auto me-3">
                    <a className="btn btn-outline-primary btn-sm" href="/">Home</a>
                </div>
            </nav>

            <div id="layoutSidenav">
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
                            {currentUser?.username}
                        </div>
                    </nav>
                </div>

                <div id="layoutSidenav_content">
                    <main>
                        <div className="container-fluid px-4">
                            <h1 className="mt-4">Backup & Restore</h1>
                            <ol className="breadcrumb mb-4">
                                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                                <li className="breadcrumb-item active">Backup</li>
                            </ol>

                            {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>}

                            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>}

                            <div className="row">
                                <div className="col-xl-6">
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <i className="fas fa-download me-1"></i>
                                            Export Data
                                        </div>
                                        <div className="card-body">
                                            <p>Download a complete backup of all application data (Users, Profiles, Themes, Reports) as a JSON file.</p>
                                            <button className="btn btn-primary" onClick={handleExport}>
                                                <i className="fas fa-file-download me-2"></i>
                                                Download Backup
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-6">
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <i className="fas fa-upload me-1"></i>
                                            Import Data
                                        </div>
                                        <div className="card-body">
                                            <p className="text-danger">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Warning: Importing data will replace all current data. This action cannot be undone.
                                            </p>
                                            <div className="mb-3">
                                                <input className="form-control" type="file" accept=".json" onChange={handleImport} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
