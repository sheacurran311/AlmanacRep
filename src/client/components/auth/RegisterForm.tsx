import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const validationSchema = Yup.object({
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  companyName: Yup.string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match')
});

const RegisterForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      companyName: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName: values.fullName,
            email: values.email,
            companyName: values.companyName,
            password: values.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        // Store token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        navigate(data.token ? '/admin' : '/login', { 
          state: { registered: true } 
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Box 
      component="form" 
      onSubmit={formik.handleSubmit} 
      noValidate
      role="form"
      aria-label="Registration form"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="fullName"
        name="fullName"
        label="Full Name"
        autoComplete="name"
        autoFocus
        value={formik.values.fullName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.fullName && Boolean(formik.errors.fullName)}
        helperText={formik.touched.fullName && formik.errors.fullName}
        inputProps={{
          'aria-label': 'Full name',
          'aria-required': 'true'
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        name="email"
        label="Company Email"
        autoComplete="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        inputProps={{
          'aria-label': 'Company email',
          'aria-required': 'true'
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="companyName"
        name="companyName"
        label="Company Name"
        value={formik.values.companyName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.companyName && Boolean(formik.errors.companyName)}
        helperText={formik.touched.companyName && formik.errors.companyName}
        inputProps={{
          'aria-label': 'Company name',
          'aria-required': 'true'
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        inputProps={{
          'aria-label': 'Password',
          'aria-required': 'true'
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
        inputProps={{
          'aria-label': 'Confirm password',
          'aria-required': 'true'
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading || !formik.isValid || !formik.dirty}
        aria-label="Register"
      >
        {loading ? <CircularProgress size={24} /> : 'Register'}
      </Button>

      <Button
        fullWidth
        variant="text"
        onClick={() => navigate('/login')}
        sx={{ mt: 1 }}
        aria-label="Go to login"
      >
        Already have an account? Sign in
      </Button>
    </Box>
  );
};

export default RegisterForm;
