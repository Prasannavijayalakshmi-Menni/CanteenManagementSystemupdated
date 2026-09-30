import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const FloatingAction = ({ onClick }) => {
  return (
    <Tooltip title="Create New Token" placement="left">
      <Fab
        color="primary"
        aria-label="add"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          width: 60,
          height: 60,
          '&:hover': {
            background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          }
        }}
      >
        <AddIcon sx={{ fontSize: 30 }} />
      </Fab>
    </Tooltip>
  );
};

export default FloatingAction;










































































































































































