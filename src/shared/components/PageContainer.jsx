export function PageContainer({ children, className = "" }) {
  return (
    <div className={`pageContainer ${className}`}>
      {children}
    </div>
  );
}