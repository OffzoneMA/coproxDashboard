// Copro.js
import React, { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import CoproFilters from '../components/copros/CoproFilters';
import CoproTable from '../components/copros/CoproTable';
import CoproFabWithOptions from '../components/copros/CoproFabWithOptions';

const Copro = ({ onSetTitle }) => {
  const [coproList, setCoproList] = useState([]);
  const [filteredCoproList, setFilteredCoproList] = useState([]);
  const [filterVille, setFilterVille] = useState('');
  const [loading, setLoading] = useState(true);
  const [villeOptions, setVilleOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/copro/listCopro`);
        const data = await response.json();

        setCoproList(data);
        setFilteredCoproList(data);
        setLoading(false);

        const uniqueVilles = Array.from(new Set(data.map((copro) => copro.ville))).sort();
        setVilleOptions(uniqueVilles);
        setTableLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    onSetTitle('Les Coprox');
  }, [onSetTitle]);

  const handleFilter = (field, value) => {
    if (field === 'ville') {
      setFilterVille(value);
    }

    setFilteredCoproList(filterCoproList(field, value));
  };

  const filterCoproList = (field, value) => {
    return coproList.filter(
      (item) => field === 'ville' && (value === '' || item.ville === value)
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
    const filteredData = coproList.filter((copro) => {
      const searchData = Object.values(copro).join(' ').toLowerCase();
      return searchData.includes(searchTerm.toLowerCase());
    });
    setFilteredCoproList(filteredData);
  };

  return (
    <div className="container-main">
      <CoproFilters
        filterVille={filterVille}
        handleFilter={handleFilter}
        villeOptions={villeOptions}
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
      <CoproFabWithOptions />

      {loading ? (
        <CircularProgress style={{ margin: '20px' }} />
      ) : (
        <>
          <CoproTable
            coproList={coproList}
            filteredCoproList={filteredCoproList}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
          {tableLoading && <CircularProgress style={{ margin: '20px' }} />}
        </>
      )}
    </div>
  );
};

export default Copro;
