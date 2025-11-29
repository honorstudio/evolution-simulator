import { useState } from 'react';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="start-screen">
        <div className="start-content">
          <h1>Evolution Simulator</h1>
          <p>AI 기반 생태계 진화 시뮬레이션</p>
          <button onClick={() => setStarted(true)}>시작하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Evolution Simulator</h1>
        <div className="controls">
          {/* TODO: 시간 컨트롤 추가 */}
        </div>
      </header>
      <main className="app-main">
        <div className="simulation-view">
          {/* TODO: PixiJS 캔버스 렌더링 */}
          <p style={{ color: '#666', textAlign: 'center', paddingTop: '40vh' }}>
            시뮬레이션 캔버스가 여기에 표시됩니다
          </p>
        </div>
        <aside className="sidebar">
          {/* TODO: 통계 패널 */}
          <div className="panel">
            <h3>통계</h3>
            <p>년도: 0</p>
            <p>생물: 0</p>
            <p>종: 0</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
