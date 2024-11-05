import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper
} from '@mui/material';
import RegisterForm from './RegisterForm';

const Register: React.FC = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create Your Account
          </Typography>
          <Typography color="textSecondary" align="center" sx={{ mb: 3 }}>
            Join Almanac Labs loyalty platform
          </Typography>
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
