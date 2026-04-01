import React, { useState, useEffect } from 'react'
import { getReports, updateReportStatus, deleteReport } from '../services/reportService'
import { getCurrentUser } from '../services/auth'
import './css/styles.css'

export default function ReportManagement() {
    const [reports, setReports] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [filter, setFilter] = useState('all') // all, pending, resolved, dismissed

    useEffect(() => {
        loadReports()
        setCurrentUser(getCurrentUser())
    }, [])

    const loadReports = async () => {
        const data = await getReports()
        setReports(data)
    }

    const handleStatusChange = async (id, newStatus) => {
        await updateReportStatus(id, newStatus)
        await loadReports()
    }

    const handleDelete = async (id) => {
        if (window.confirm('Delete this report?')) {
            await deleteReport(id)
            await loadReports()
        }
    }

    const filteredReports = reports.filter(r => filter === 'all' || r.status === filter)

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
                                <a className="nav-link" href="/admin/themes">
                                    <div className="sb-nav-link-icon"><i className="fas fa-palette"></i></div>
                                    Themes
                                </a>
                                <a className="nav-link" href="/admin/profiles">
                                    <div className="sb-nav-link-icon"><i className="fas fa-id-card"></i></div>
                                    Profiles
                                </a>
                                <a className="nav-link active" href="/admin/reports">
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
                            <h1 className="mt-4">Report Management</h1>
                            <ol className="breadcrumb mb-4">
                                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                                <li className="breadcrumb-item active">Reports</li>
                            </ol>

                            <div className="card mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>
                                        <i className="fas fa-flag me-1"></i>
                                        User Reports
                                    </div>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto' }}
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="dismissed">Dismissed</option>
                                    </select>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Reporter</th>
                                                    <th>Target Profile</th>
                                                    <th>Reason</th>
                                                    <th>Details</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReports.map(report => (
                                                    <tr key={report.id}>
                                                        <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                                        <td>{report.reporter || 'Anonymous'}</td>
                                                        <td>
                                                            <a href={`/u/${report.targetUser}`} target="_blank" rel="noreferrer">
                                                                {report.targetUser}
                                                            </a>
                                                        </td>
                                                        <td>{report.reason}</td>
                                                        <td>{report.details}</td>
                                                        <td>
                                                            <span className={`badge bg-${report.status === 'pending' ? 'warning' :
                                                                report.status === 'resolved' ? 'success' : 'secondary'
                                                                }`}>
                                                                {report.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group">
                                                                {report.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            className="btn btn-sm btn-success"
                                                                            onClick={() => handleStatusChange(report.id, 'resolved')}
                                                                        >
                                                                            Resolve
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-secondary"
                                                                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                                                                        >
                                                                            Dismiss
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDelete(report.id)}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredReports.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="text-center">No reports found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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
