const Pagination = ({ pagination, onPageChange, label = 'registros' }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={`Paginacion de ${label}`}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={pagination.page === 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Anterior
      </button>
      <span>
        Pagina {pagination.page} de {pagination.totalPages}
        <small> ({pagination.total} {label})</small>
      </span>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={pagination.page === pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;
