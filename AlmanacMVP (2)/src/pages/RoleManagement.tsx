import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Select,
  MenuItem,
  TablePagination
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ErrorSnackbar from '../components/ErrorSnackbar';
import withRoleAccess from '../components/withRoleAccess';

// ... (rest of the component code remains the same)

export default withRoleAccess(['admin'])(RoleManagement);