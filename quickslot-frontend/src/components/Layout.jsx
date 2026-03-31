import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="layout flex flex-col h-full min-h-screen bg-background text-text">
      <Navbar />
      <main className="container p-6 animate-fade-in flex-grow" style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <footer className="text-center p-4 text-sm text-muted">
        &copy; {new Date().getFullYear()} QuickSlot Parking Management
      </footer>
    </div>
  );
}
