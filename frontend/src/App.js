import React, { useState } from 'react';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';
import './App.css';

function App() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeTab, setActiveTab] = useState('submit');

  const handleTicketCreated = () => {
    setRefreshCount(c => c + 1);
    setTimeout(() => setActiveTab('list'), 800);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎫 Support Ticket System</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'submit' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('submit')}
          >
            Submit Ticket
          </button>
          <button
            className={activeTab === 'list' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('list')}
          >
            All Tickets
          </button>
          <button
            className={activeTab === 'stats' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('stats')}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'submit' && (
          <TicketForm onTicketCreated={handleTicketCreated} />
        )}
        {activeTab === 'list' && (
          <TicketList refreshTrigger={refreshCount} />
        )}
        {activeTab === 'stats' && (
          <StatsDashboard refreshTrigger={refreshCount} />
        )}
      </main>
    </div>
  );
}

export default App;
