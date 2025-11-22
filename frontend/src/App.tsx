import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CreateNote } from './pages/CreateNote';
import { ViewNote } from './pages/ViewNote';
import { NoteCreated } from './pages/NoteCreated';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CreateNote />} />
          <Route path="/note/:id" element={<ViewNote />} />
          <Route path="/created" element={<NoteCreated />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

