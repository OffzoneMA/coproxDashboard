// CoproTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';


const CoproTable = ({ coproList, filteredCoproList, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Ville</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Code Postal</TableCell>
            <TableCell>Offre</TableCell>
            <TableCell>Exercice CT</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCoproList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((copro) => (
           
                <TableRow key={copro._id} style={{ background: copro.status !== 'Actif' ? 'lightgray' : 'inherit' }}>
                 <Link to={`/detailCopro/${copro._id}`}><TableCell>{copro.idCopro}</TableCell></Link>
                <TableCell>{copro.Nom}</TableCell>
                <TableCell>{copro.ville}</TableCell>
                <TableCell>{copro.status}</TableCell>
                <TableCell>{copro.address}</TableCell>
                <TableCell>{copro.codepostal}</TableCell>
                <TableCell>{copro.Offre}</TableCell>
                <TableCell>{copro.exerciceCT}</TableCell>
              </TableRow>
            
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredCoproList.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default CoproTable;
