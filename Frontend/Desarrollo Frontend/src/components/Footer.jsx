const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>EmpresaViaje</span>
        </div>
        <p className="footer-copy">
          &copy; 2026 EmpresaViaje. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
