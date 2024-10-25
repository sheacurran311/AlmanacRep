import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  active: boolean;
  metadata: Record<string, any>;
}

const RewardsManager: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditReward(reward);
    setOpenDialog(true);
  };

  const handleDelete = async (rewardId: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/rewards/${rewardId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          fetchRewards();
        }
      } catch (error) {
        console.error('Error deleting reward:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditReward(null);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Rewards Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Reward
        </Button>
      </Box>

      <Grid container spacing={3}>
        {rewards.map((reward) => (
          <Grid item xs={12} sm={6} md={4} key={reward.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" gutterBottom>
                    {reward.name}
                  </Typography>
                  <Chip
                    label={`${reward.points} Points`}
                    color="primary"
                    icon={<StarIcon />}
                  />
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {reward.category}
                </Typography>
                <Typography variant="body2">
                  {reward.description}
                </Typography>
                <Box mt={2}>
                  <Chip
                    label={reward.active ? 'Active' : 'Inactive'}
                    color={reward.active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleEdit(reward)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(reward.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editReward ? 'Edit Reward' : 'Add New Reward'}
        </DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TextField
              fullWidth
              label="Name"
              defaultValue={editReward?.name || ''}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              defaultValue={editReward?.description || ''}
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Points"
              type="number"
              defaultValue={editReward?.points || ''}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={editReward?.category || ''}
                label="Category"
              >
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="digital">Digital</MenuItem>
                <MenuItem value="nft">NFT</MenuItem>
                <MenuItem value="experience">Experience</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary">
            {editReward ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardsManager;
