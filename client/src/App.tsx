import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { Navbar } from './components/Common/Navbar.js';
import { Home } from './pages/Home.js';
import { JoinRoom } from './pages/Player/JoinRoom.js';
import { PlayerLobby } from './pages/Player/PlayerLobby.js';
import { PlayerGame } from './pages/Player/PlayerGame.js';
import { HostDashboard } from './pages/Host/Dashboard.js';
import { QuizEditor } from './pages/Host/QuizEditor.js';
import { HostLobby } from './pages/Host/HostLobby.js';
import { HostGame } from './pages/Host/HostGame.js';
import { HostLogin } from './pages/Host/HostLogin.js';
import { ProtectedRoute } from './components/Common/ProtectedRoute.js';
import { Leaderboard } from './pages/Leaderboard.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* Public & Player Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinRoom />} />
                <Route path="/join/:code" element={<JoinRoom />} />
                <Route path="/player/lobby" element={<PlayerLobby />} />
                <Route path="/player/game" element={<PlayerGame />} />

                {/* Host Authentication & Protected Routes */}
                <Route path="/host/login" element={<HostLogin />} />
                <Route path="/host/dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
                <Route path="/host/editor" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
                <Route path="/host/editor/:id" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
                <Route path="/host/lobby/:code" element={<ProtectedRoute><HostLobby /></ProtectedRoute>} />
                <Route path="/host/game/:code" element={<ProtectedRoute><HostGame /></ProtectedRoute>} />
                
                {/* Live Leaderboard for Audience/Screen */}
                <Route path="/leaderboard/:code" element={<Leaderboard />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
