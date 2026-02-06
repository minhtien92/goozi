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
        <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #11BBDD, #F2F4F6)' }}>
          <Outlet />
        </div>
      )}
      {(isTopicsPage || isTopicDetailPage || isFlashcardPage) && (
        <>
          {/* Home background - must be rendered first and behind everything */}
          <div className="fixed inset-0 z-0 pointer-events-none" style={{ zIndex: 0 }}>
            <div className="opacity-30 blur-sm w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
              <div style={{ position: 'relative', zIndex: 0 }}>
                <Home />
              </div>
            </div>
          </div>
          {/* Overlay content */}
          <div className="fixed inset-0" style={{ zIndex: 40 }}>
            <Outlet />
          </div>
        </>
      )}
    </>
  );
}

