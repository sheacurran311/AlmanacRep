import CampaignIcon from '@mui/icons-material/Campaign';

const campaigns = {
  id: 'campaigns',
  title: 'Campaigns',
  type: 'group',
  children: [
    {
      id: 'campaign-list',
      title: 'Campaign List',
      type: 'item',
      url: '/campaigns',
      icon: CampaignIcon,
      breadcrumbs: false
    }
  ]
};

export default campaigns;