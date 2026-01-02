import { Outlet, useLocation } from 'react-router-dom';
import Home from '../pages/Home';

export default function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isTopicsPage = location.pathname === '/topics';
  const isTopicDetailPage = location.pathname.startsWith('/topics/') && !location.pathname.includes('/flashcard');
  const isFlashcardPage = location.pathname.includes('/flashcard');
  
  // Always show Home background, Topics/Detail/Flashcard as overlay
  return (
    <>
      {isHomePage && <Home />}
      {!isHomePage && !isTopicsPage && !isTopicDetailPage && !isFlashcardPage && (
        <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200">
          <Outlet />
        </div>
      )}
      {(isTopicsPage || isTopicDetailPage || isFlashcardPage) && (
        <>
          <div className="opacity-30 blur-sm pointer-events-none fixed inset-0">
            <Home />
          </div>
          <div className="relative z-50">
            <Outlet />
          </div>
        </>
      )}
    </>
  );
}

