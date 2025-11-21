// App.js
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout';
import theme from './theme';
import './assets/styles/App.css';

// Lazy load components for performance
const HomePage = lazy(() => import('./containers/HomePage'));
const TrelloPage = lazy(() => import('./containers/TrelloPage'));
const Copro = lazy(() => import('./containers/Copro'));
const AddFiches = lazy(() => import('./containers/AddFiches'));
const ListeFiches = lazy(() => import('./containers/ListeFiches.js'));
const Clients = lazy(() => import('./containers/clients'));
const Script = lazy(() => import('./containers/script.js'));
const DetailCopro = lazy(() => import('./containers/DetailCopro'));

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const [currentTitle, setCurrentTitle] = useState('Dashboard');

  const setTitle = (title) => {
    setCurrentTitle(title || "Dashboard");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout title={currentTitle}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<HomePage onSetTitle={setTitle}/>} />
              <Route path="/trello" element={<TrelloPage onSetTitle={setTitle} />} />
              <Route path="/copro" element={<Copro onSetTitle={setTitle} />} />
              <Route path="/addfiches" element={<AddFiches onSetTitle={setTitle} />} />
              <Route path="/listefiches" element={<ListeFiches onSetTitle={setTitle} />} />
              <Route path="/clients" element={<Clients onSetTitle={setTitle} />} />
              <Route path="/scripts" element={<Script onSetTitle={setTitle} />} />
              <Route path="/detailcopro/:id" element={<DetailCopro onSetTitle={setTitle} />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}


export default App;
