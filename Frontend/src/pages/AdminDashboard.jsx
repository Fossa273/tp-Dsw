import AdminPanel from '../components/AdminPanel';

const AdminDashboard = ({ onNavigate }) => {
  return (
    <div className="admin-dashboard-page">
      <AdminPanel onNavigate={onNavigate} />
      <div className="admin-view-site">
        <button className="btn btn-secondary" onClick={() => onNavigate('home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
          Ver pagina principal
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;